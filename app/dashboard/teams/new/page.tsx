"use client";

import { createTeam } from "@/actions/teams";
import { sanitizeTeamSlug, validateTeamSlug } from "@/lib/team-slug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const suggestedSlug = useMemo(() => sanitizeTeamSlug(name), [name]);
  const effectiveSlug = slugEdited ? slug : suggestedSlug;
  const slugValidation = validateTeamSlug(effectiveSlug);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Team name is required.");
      return;
    }

    if (!slugValidation.valid) {
      toast.error(slugValidation.message || "Team slug is invalid.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await createTeam({
        name,
        slug: slugValidation.sanitized,
        description,
      });

      toast.success("Team created.");
      router.push(`/dashboard/${result.team.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/dashboard/teams"
            className="mb-6 inline-flex items-center text-sm text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to teams
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Create a team</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Set up a shared workspace for domains, proxy configuration, SSL, and access controls.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-2xl shadow-black/20 backdrop-blur-md"
          >
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                <Users className="h-6 w-6 text-sky-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">Team details</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Pick a name your teammates will recognize and a stable URL slug for the dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Team name
                </label>
                <input
                  id="team-name"
                  aria-label="Team name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slugEdited) {
                      setSlug(sanitizeTeamSlug(event.target.value));
                    }
                  }}
                  placeholder="Acme Platform"
                  disabled={submitting}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Team slug
                </label>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300 focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-neutral-700">
                  <span className="mr-1 text-neutral-500">/dashboard/</span>
                  <input
                    id="team-slug"
                    aria-label="Team slug"
                    value={effectiveSlug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setSlug(sanitizeTeamSlug(event.target.value));
                    }}
                    placeholder="acme-platform"
                    disabled={submitting}
                    className="w-56 max-w-full bg-transparent text-neutral-100 outline-none"
                  />
                </div>
                <p className={`mt-2 text-xs ${slugValidation.valid ? "text-neutral-500" : "text-rose-300"}`}>
                  {slugValidation.valid
                    ? "Lowercase letters, numbers, and hyphens only."
                    : slugValidation.message}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Description
                </label>
                <textarea
                  id="team-description"
                  aria-label="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What this team is for, who owns it, or what environments it manages."
                  disabled={submitting}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-neutral-500">
                Your account will be added as the team owner automatically.
              </p>

              <button
                type="submit"
                disabled={submitting || !slugValidation.valid || !name.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    Create team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
            <h3 className="text-sm font-semibold text-neutral-200">What you get</h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-400">
              <li className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                Shared team-level domain and SSL management
              </li>
              <li className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                Member roles, invites, and access groups
              </li>
              <li className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                Reverse-proxy, WAF, and routing configuration
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
