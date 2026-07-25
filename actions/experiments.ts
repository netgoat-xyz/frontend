"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateTag, unstable_cache } from "next/cache";

type FeatureFlag = {
    key: string;
    isActive?: boolean;
    percentage?: number;
};

type FeatureFlagUpdateQuery = Partial<{
    "featureFlags.$.isActive": boolean;
    "featureFlags.$.percentage": number;
    "featureFlags.$.variants": string[];
}>;

function serialize<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

const getCachedFeatureFlags = unstable_cache(
    async (): Promise<FeatureFlag[]> => {
        await dbConnect();
        const settings = await Settings.findOne().select("featureFlags").lean<{
            featureFlags?: FeatureFlag[];
        }>();
        return serialize(settings?.featureFlags || []);
    },
    ["feature-flags"],
    { revalidate: 60, tags: ["feature-flags"] },
);

async function getUser() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        return session?.user;
    } catch {
        return null;
    }
}

export async function getExperiments() {
    const [user, globalFlags] = await Promise.all([
        getUser(),
        getCachedFeatureFlags(),
    ]);

    // Helper map - stores boolean true or the variant string
    const flagsMap: Record<string, boolean | string> = {};

    // 1. Process Global Flags
    globalFlags.forEach((flag) => {
        const percentage = flag.percentage ?? 0;
        if (flag.isActive) {
            flagsMap[flag.key] = true;
        } else if (percentage > 0) {
            // Simple deterministic rollout based on user ID or random if no user
            // If user exists, hash id to 0-100.
            if (user) {
                const hash = user.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                if ((hash % 100) < percentage) {
                    flagsMap[flag.key] = true;
                }
            }
        }
    });

    // 2. Process User Overrides
    if (user) {
        await dbConnect();
        const userDoc = await User.findById(user.id).select("experiments").lean<{
            experiments?: string[];
        }>();
        if (userDoc && userDoc.experiments) {
            userDoc.experiments.forEach((rawKey: string) => {
                // Check if it's a variant: "key=variant"
                if (rawKey.includes("=")) {
                    const [key, variant] = rawKey.split("=");
                    flagsMap[key] = variant;
                } else {
                    flagsMap[rawKey] = true;
                }
            });
        }
    }

    return flagsMap;
}

export async function getAllAvailableExperiments() {
    return getCachedFeatureFlags();
}

export async function enableAllExperiments() {
    const user = await getUser();
    if (!user) {
        throw new Error("Must be logged in to enable experiments");
    }

    const allFlags = (await getCachedFeatureFlags()).map((f) => f.key);

    await dbConnect();

    await User.updateOne(
        { _id: user.id },
        { $addToSet: { experiments: { $each: allFlags } } }
    );

    return { success: true };
}

export async function setExperimentValue(key: string, value: string | null) {
    await dbConnect();
    const user = await getUser();
    if (!user) {
         throw new Error("Must be logged in");
    }

    // First remove any existing entries for this key (base key or variants)
    const userDoc = await User.findById(user.id).select("experiments").lean<{
        experiments?: string[];
    }>();
    if (!userDoc) throw new Error("User not found");

    const currentExperiments = userDoc.experiments || [];
    
    // Filter out simple key or key=...
    const newExperiments = currentExperiments.filter((exp: string) => {
        if (exp === key) return false;
        if (exp.startsWith(`${key}=`)) return false;
        return true;
    });

    if (value === "true") {
        newExperiments.push(key);
    } else if (value && value !== "false") {
        newExperiments.push(`${key}=${value}`);
    }
    // If "false" or null, we just leave it out (disabled)

    await User.updateOne({ _id: user.id }, { experiments: newExperiments });
    return { success: true };
}

// Deprecated in favor of setExperimentValue but kept for compatibility
export async function toggleExperiment(key: string, enabled: boolean) {
    return setExperimentValue(key, enabled ? "true" : "false");
}

// Admin functions
async function checkAdmin() {
    const user = await getUser();
    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized");
    }
}

export async function adminAddExperiment(key: string, description: string, variants: string[] = []) {
    await checkAdmin();
    await dbConnect();
    await Settings.findOneAndUpdate({}, {
        $push: { featureFlags: { key, description, isActive: false, percentage: 0, variants } }
    }, { upsert: true });
    revalidateTag("feature-flags", "max");
    return { success: true };
}

export async function adminUpdateExperiment(key: string, update: { isActive?: boolean, percentage?: number, variants?: string[] }) {
    await checkAdmin();
    await dbConnect();
    
    const updateQuery: FeatureFlagUpdateQuery = {};
    if (update.isActive !== undefined) updateQuery["featureFlags.$.isActive"] = update.isActive;
    if (update.percentage !== undefined) updateQuery["featureFlags.$.percentage"] = update.percentage;
    if (update.variants !== undefined) updateQuery["featureFlags.$.variants"] = update.variants;

    await Settings.updateOne(
        { "featureFlags.key": key },
        { $set: updateQuery }
    );
    revalidateTag("feature-flags", "max");
    return { success: true };
}
