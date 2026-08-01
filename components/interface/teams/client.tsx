"use client";

import TeamRow from "@/components/elements/TeamRow";
import { PlusIcon } from "@heroicons/react/16/solid";
import Link from "next/link";

export default function TeamsOverview({ teams }: { teams: Team[] }) {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Switch between teams or manage your organization settings.
          </p>
        </div>
        <Link
          href="/dashboard/teams/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-neutral-200 transition-all"
        >
          <PlusIcon className="size-4 stroke-3" />
          Create Team
        </Link>
      </div>

      <div className="space-y-3">
        {teams.length > 0 ? (
          teams.map((team) => <TeamRow key={team.id} team={team} />)
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-6 text-sm text-neutral-400">
            No teams found for this account yet.
          </div>
        )}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center text-center">
        <div className="size-10 rounded-full bg-neutral-900 flex items-center justify-center mb-3">
          <PlusIcon className="size-5 text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-200">Looking for a different team?</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-70">
          If you do not see your team here, make sure you have been invited via your email address.
        </p>
      </div>
    </div>
  );
}
