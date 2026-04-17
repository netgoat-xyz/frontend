import TeamsOverview from "@/components/interface/teams/client";
import { getUserTeams } from "@/actions/teams";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateTeamMetadata } from "./metadata"; 

type TeamMetadataParams = Promise<{
  teamName: string;
  section?: string[];
}>;

type RawTeamMember = {
  user_id?: unknown;
  role?: unknown;
};

type RawTeam = {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  members?: unknown;
};

function toRawTeam(value: unknown): RawTeam {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as RawTeam;
}

function toRawTeamMember(value: unknown): RawTeamMember {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as RawTeamMember;
}

export async function generateMetadata({ params }: { params: TeamMetadataParams }) {
  return generateTeamMetadata(params, "overview");
}

function formatRoleLabel(role: unknown) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return "Member";
  if (normalized === "owner") return "Owner";
  if (normalized === "admin") return "Admin";
  if (normalized === "billing_manager") return "Billing Manager";
  if (normalized === "viewer") return "Viewer";
  if (normalized === "member") return "Member";

  return normalized
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function TeamsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const rawTeams = await getUserTeams().catch(() => []);
  const teams: Team[] = Array.isArray(rawTeams)
    ? rawTeams.map((rawTeamValue) => {
        const team = toRawTeam(rawTeamValue);
        const members = Array.isArray(team.members)
          ? team.members.map((memberValue) => toRawTeamMember(memberValue))
          : [];
        const currentMember = members.find(
          (member) => String(member.user_id || "") === String(session?.user?.id || ""),
        );

        const slug = String(team.slug || "");

        return {
          id: String(team._id || team.id || slug),
          name: String(team.name || slug || "Team"),
          slug,
          role: formatRoleLabel(currentMember?.role),
          memberCount: members.length,
          isPersonal: slug.startsWith("@me-"),
        };
      })
    : [];

  return <TeamsOverview teams={teams} />;
}