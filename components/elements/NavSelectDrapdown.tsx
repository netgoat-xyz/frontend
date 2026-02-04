"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
    ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
} from "@heroicons/react/16/solid";

// Placeholder icons/logos for the mock data
const TeamIcon = () => (
    <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 border border-zinc-700">
      <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
);

const ProjectIcon = ({ letter }: { letter: string }) => (
  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
    <span className="text-[10px] font-medium text-zinc-400">{letter}</span>
  </div>
);

const teams = [
  { name: "Netgoat", active: true },
];

const projects = [
  { name: "frontend" },
  { name: "github-readme-stats" },
  { name: "netgoat-docs" },
  { name: "pm2.web" },
  { name: "portfolio" },
  { name: "strem" },
  { name: "v0-coming-soon-page" },
  { name: "v0-shaders-hero-section" },
];

export default function NavSelectDrapdown() {
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
              className="w-full bg-transparent pl-7 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
          
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs text-neutral-500">Teams</div>
            {teams.map((team) => (
              <MenuItem key={team.name}>
                <button className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white">
                    <div className="flex items-center gap-2">
                        <TeamIcon />
                        <span className={team.active ? "text-white" : ""}>{team.name}</span>
                    </div>
                </button>
              </MenuItem>
            ))}

            <MenuItem>
              <button className="group mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white">
                <PlusCircleIcon className="size-5 text-blue-500" />
                <span>Create Team</span>
              </button>
            </MenuItem>
          </div>
        </div>

        {/* Projects Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative border-b border-neutral-800 p-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Find Project..."
              className="w-full bg-transparent pl-7 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <div className="p-2">
            <div className="px-2 py-1.5 text-xs text-neutral-500">Projects</div>
            <div className="flex flex-col gap-0.5">
                {projects.map((project) => (
                <MenuItem key={project.name}>
                    <button className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white">
                        <ProjectIcon letter={project.name[0].toUpperCase()} />
                        <span>{project.name}</span>
                    </button>
                </MenuItem>
                ))}

                <MenuItem>
                <button className="group mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-400 hover:bg-neutral-700/75 hover:text-white data-focus:bg-neutral-700/75 cursor-pointer data-focus:text-white">
                    <PlusCircleIcon className="size-5 text-blue-500" />
                    <span>Create Project</span>
                </button>
                </MenuItem>
            </div>
          </div>
        </div>
      </MenuItems>
    </Menu>
  );
}
