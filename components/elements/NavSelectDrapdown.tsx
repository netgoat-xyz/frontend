"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
} from "@heroicons/react/16/solid";
import { getUserTeams, getTeam } from "@/actions/teams";
import { listTeamDomains } from "@/actions/teamDomains";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Memoized icons for list rendering
const TeamIcon = memo(() => (
  <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 border border-zinc-700">
    <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  </div>
));
TeamIcon.displayName = 'TeamIcon';

const ProjectIcon = memo(({ letter }: { letter: string }) => (
  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
    <span className="text-[10px] font-medium text-zinc-400">{letter}</span>
  </div>
));
ProjectIcon.displayName = 'ProjectIcon';

interface Team {
  _id: string;
  name: string;
  slug: string;
}

interface Domain {
  _id: string;
  domain: string;
  team_id: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function NavSelectDrapdown() {
  const pathname = usePathname();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingCurrentTeam, setLoadingCurrentTeam] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [domainSearch, setDomainSearch] = useState("");

  const segments = pathname?.split("/").filter(Boolean) || [];
  const currentTeamSlug = segments[0] === "dashboard" && segments[1] !== "teams" ? segments[1] : null;
  const isSpecialTeamSlug = currentTeamSlug?.startsWith("@") || false;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const userTeams = await getUserTeams();
        setTeams(userTeams);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to load teams"));
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // Fetch current team data to resolve special slugs like @me
  useEffect(() => {
    const fetchCurrentTeam = async () => {
      if (!currentTeamSlug) {
        setCurrentTeam(null);
        return;
      }

      // If it's not a special slug, try to find in loaded teams first
      if (!isSpecialTeamSlug) {
        const foundTeam = teams.find(t => t.slug === currentTeamSlug);
        if (foundTeam) {
          setCurrentTeam(foundTeam);
          return;
        }
      }

      // For special slugs or teams not in the list, fetch from server
      try {
        setLoadingCurrentTeam(true);
        const team = await getTeam(currentTeamSlug);
        setCurrentTeam(team);
      } catch {
        setCurrentTeam(null);
      } finally {
        setLoadingCurrentTeam(false);
      }
    };

    fetchCurrentTeam();
  }, [currentTeamSlug, isSpecialTeamSlug, teams]);

  useEffect(() => {
    const fetchDomains = async () => {
      // Skip loading if no team or still loading team data
      if (!currentTeam || loadingCurrentTeam) {
        setDomains([]);
        setLoadingDomains(false);
        return;
      }

      // Use the actual team slug from the resolved team object
      const actualTeamSlug = currentTeam.slug;

      try {
        setLoadingDomains(true);
        const teamDomains = await listTeamDomains(actualTeamSlug);
        setDomains(teamDomains);
      } catch {
        // Silently fail for domains - might not have permission
        setDomains([]);
      } finally {
        setLoadingDomains(false);
      }
    };

    fetchDomains();
  }, [currentTeam, loadingCurrentTeam]);

  const filteredTeams = useMemo(() => teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  ), [teams, teamSearch]);

  const filteredDomains = useMemo(() => domains.filter((domain) =>
    domain.domain.toLowerCase().includes(domainSearch.toLowerCase())
  ), [domains, domainSearch]);

  const handleTeamClick = useCallback((teamSlug: string) => {
    // Navigate using the real team slug so server actions resolve correctly
    router.push(`/dashboard/${teamSlug}`);
  }, [router]);

  const handleDomainClick = useCallback((domain: string) => {
    if (currentTeam) {
      router.push(`/dashboard/${currentTeam.slug}/${domain}`);
    }
  }, [router, currentTeam]);

  const handleCreateTeam = useCallback(() => {
    router.push("/dashboard/teams/new");
  }, [router]);

  const handleCreateDomain = useCallback(() => {
    if (currentTeam) {
      router.push(`/dashboard/${currentTeam.slug}/new`);
    }
  }, [router, currentTeam]);

  return (
    <Menu>
      <MenuButton className="group flex-col justify-center rounded-lg cursor-pointer p-1 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white focus:outline-none data-open:bg-neutral-800">
        <ChevronUpIcon className="size-3 text-neutral-400 transition-colors group-hover:text-white" />
        <ChevronDownIcon className="size-3 text-neutral-400 transition-colors group-hover:text-white" />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom start"
        className="z-50 mt-1 flex w-150 origin-top-left divide-x divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/65 filter backdrop-blur-md text-sm shadow-2xl ring-1 ring-white/5 focus:outline-none data-closed:scale-95 data-closed:opacity-0 transition duration-150 ease-out"
      >
        {/* Teams Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative border-b border-neutral-800 p-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Find Team..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full bg-transparent pl-7 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <div className="p-2">
            <div className="px-2 py-1.5 text-xs text-neutral-500">Teams</div>
            {loadingTeams ? (
              <div className="space-y-2 px-2">
                <Skeleton className="h-8 w-full bg-neutral-800" />
                <Skeleton className="h-8 w-full bg-neutral-800" />
                <Skeleton className="h-8 w-full bg-neutral-800" />
              </div>
            ) : filteredTeams.length > 0 ? (
              filteredTeams.map((team) => {
                // Compare with currentTeam's actual slug to highlight correctly
                const isActive = currentTeam && (currentTeam._id === team._id || currentTeam.slug === team.slug);
                return (
                  <MenuItem key={team._id}>
                    <button
                      onClick={() => handleTeamClick(team.slug)}
                      className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <TeamIcon />
                        <span className={isActive ? "text-white" : ""}>
                          {team.name}
                        </span>
                      </div>
                    </button>
                  </MenuItem>
                );
              })
            ) : (
              <div className="px-2 py-2 text-xs text-neutral-500">
                No teams found
              </div>
            )}

            <MenuItem>
              <button
                onClick={handleCreateTeam}
                className="group mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white"
              >
                <PlusCircleIcon className="size-5 text-blue-500" />
                <span>Create Team</span>
              </button>
            </MenuItem>
          </div>
        </div>

        {/* Projects/Domains Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative border-b border-neutral-800 p-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Find Domain..."
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              className="w-full bg-transparent pl-7 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <div className="p-2">
            <div className="px-2 py-1.5 text-xs text-neutral-500">Domains</div>
            <div className="flex flex-col gap-0.5">
              {loadingDomains ? (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-8 w-full bg-neutral-800" />
                  <Skeleton className="h-8 w-full bg-neutral-800" />
                  <Skeleton className="h-8 w-full bg-neutral-800" />
                </div>
              ) : filteredDomains.length > 0 ? (
                filteredDomains.map((domain) => (
                  <MenuItem key={domain._id}>
                    <button
                      onClick={() => handleDomainClick(domain.domain)}
                      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white"
                    >
                      <ProjectIcon letter={domain.domain[0].toUpperCase()} />
                      <span>{domain.domain}</span>
                    </button>
                  </MenuItem>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-neutral-500">
                  {currentTeam ? "No domains found" : "Select a team first"}
                </div>
              )}

              {currentTeam && (
                <MenuItem>
                  <button
                    onClick={handleCreateDomain}
                    className="group mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white"
                  >
                    <PlusCircleIcon className="size-5 text-blue-500" />
                    <span>Add Domain</span>
                  </button>
                </MenuItem>
              )}
            </div>
          </div>
        </div>
      </MenuItems>
    </Menu>
  );
}
