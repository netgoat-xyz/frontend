import { ChevronRightIcon, Cog6ToothIcon, UserIcon } from "@heroicons/react/16/solid";
import Link from "next/link";

export default function TeamRow({ team }: { team: Team }) {
  return (
    <div className="group relative bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 transition-all flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Team Avatar */}
        <div className={`size-12 rounded-lg border border-neutral-700 flex items-center justify-center font-bold text-lg ${team.isPersonal ? 'bg-neutral-800' : 'bg-blue-600'}`}>
          {team.isPersonal ? <UserIcon className="size-6 text-neutral-400" /> : team.name[0]}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-100">{team.name}</h2>
            {team.isPersonal && (
              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700 uppercase font-bold tracking-tighter">
                Free
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
            <span>{team.role}</span>
            <span className="size-1 bg-neutral-700 rounded-full" />
            <span>{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Configure Button */}
        <Link 
          href={`/dashboard/teams/${team.slug}/settings`}
          className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title="Team Settings"
        >
          <Cog6ToothIcon className="size-5" />
        </Link>
        
        {/* Switch to Team Button */}
        <Link 
          href={`/dashboard/teams/${team.slug}`}
          className="flex items-center gap-1 text-xs font-medium bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-md hover:bg-neutral-700 transition-colors"
        >
          Go to Team
          <ChevronRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  );
}