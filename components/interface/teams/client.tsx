"use client";

import TeamRow from "@/components/elements/TeamRow";
import { PlusIcon } from "@heroicons/react/16/solid";

const myTeams: Team[] = [
  { id: "p1", name: "Personal Account", slug: "duckydev-personal-team", role: "Owner", memberCount: 1, isPersonal: true },
  { id: "t1", name: "Netgoat Studio", slug: "netgoat", role: "Owner", memberCount: 12 },
  { id: "t2", name: "Acme Corp", slug: "acme", role: "Developer", memberCount: 45 },
];

export default function TeamsOverview() {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Switch between teams or manage your organization settings.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-neutral-200 transition-all active:scale-95">
          <PlusIcon className="size-4 stroke-3" />
          Create Team
        </button>
      </div>

      <div className="space-y-3">
        {myTeams.map((team) => (
          <TeamRow key={team.id} team={team} />
        ))}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center text-center">
        <div className="size-10 rounded-full bg-neutral-900 flex items-center justify-center mb-3">
          <PlusIcon className="size-5 text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-200">Looking for a different team?</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-70">
          If you don't see your team here, make sure you've been invited via your email address.
        </p>
      </div>
    </div>
  );
}