"use client";

import { useState } from "react";

import {
  ChevronDownIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

export default function ProjectToolbar() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-row items-center gap-2">
        {/* Search Input Group */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-white transition-colors">
            <SearchIcon className="size-5" />
          </div>
          <input
            type="search"
            placeholder="Search Domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-all"
          />
        </div>
        {/* Filter Button */}
        <button className="flex items-center justify-center p-2 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <FilterIcon className="size-5" />
        </button>
        {/* View Switcher (Grid/List) */}
        <div className="hidden lg:flex bg-neutral-900 border border-neutral-800 rounded-md p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1 rounded-md transition-all ${
              view === "grid"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <GridIcon className="size-5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1 rounded-md transition-all ${
              view === "list"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <ListIcon className="size-5" />
          </button>
        </div>
        <button className="lg:hidden flex items-center justify-center w-10 h-10 bg-white text-black rounded-md hover:bg-neutral-200 transition-colors">
          <PlusIcon className="size-5" />
        </button>
        <button className="hidden lg:flex items-center justify-between min-w-32 bg-white text-black px-3 py-2 rounded-md font-medium text-sm hover:bg-neutral-200 transition-colors">
          <span>Add New...</span>
          <ChevronDownIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}