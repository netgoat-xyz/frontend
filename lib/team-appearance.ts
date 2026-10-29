const TEAM_ACCENTS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
] as const;

/** Deterministic accent color for a team, derived from its slug. */
export function teamAccent(slug: string): string {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) | 0;
  }
  return TEAM_ACCENTS[Math.abs(hash) % TEAM_ACCENTS.length] ?? TEAM_ACCENTS[0];
}

export function teamInitial(name: string): string {
  return (name.trim()[0] ?? "T").toUpperCase();
}
