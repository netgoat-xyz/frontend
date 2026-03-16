"use client";

import { useState, useRef } from "react";

import {
  ChevronDownIcon,
  PlusIcon,
  GlobeAltIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { SearchIcon, FilterIcon, GridIcon, ListIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Dropdown, DropdownItem } from "../../../elements/Dropdown"; // Assuming it's in the same directory
import type { DomainsViewMode, DomainStatusFilter } from "./dashboardDomainsPanel";

type ProjectToolbarProps = {
  params: { teamName: string };
  searchQuery: string;
  onSearchChange: (search: string) => void;
  viewMode: DomainsViewMode;
  onViewModeChange: (view: DomainsViewMode) => void;
  statusFilter: DomainStatusFilter;
  onStatusFilterChange: (filter: DomainStatusFilter) => void;
};

export default function ProjectToolbar({
  params,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
}: ProjectToolbarProps) {
  const t = useTranslations("DashboardPages.homeToolbar");
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);

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
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-all"
          />
        </div>
        {/* Filter Button */}
        <div className="relative">
          <FilterIcon className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as DomainStatusFilter)}
            className="h-10 min-w-42.5 pl-8 pr-3 rounded-md border border-neutral-800 bg-neutral-900 text-sm text-neutral-300 focus:outline-none focus:border-neutral-700"
            aria-label={t("filterLabel")}
          >
            <option value="all">{t("filters.all")}</option>
            <option value="verified">{t("filters.verified")}</option>
            <option value="needs-verification">{t("filters.needsVerification")}</option>
          </select>
        </div>
        {/* View Switcher (Grid/List) */}
        <div className="hidden lg:flex bg-neutral-900 border border-neutral-800 rounded-md p-1">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1 rounded-md transition-all ${viewMode === "grid"
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
              }`}
          >
            <GridIcon className="size-5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1 rounded-md transition-all ${viewMode === "list"
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
              }`}
          >
            <ListIcon className="size-5" />
          </button>
        </div>
        <button
          onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}
          className="lg:hidden flex items-center justify-center p-2 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label={t("toggleLayout")}
        >
          {viewMode === "grid" ? <ListIcon className="size-5" /> : <GridIcon className="size-5" />}
        </button>
        <button className="lg:hidden flex items-center justify-center w-10 h-10 bg-white text-black rounded-md hover:bg-neutral-200 transition-colors">
          <PlusIcon className="size-5" />
        </button>
        <div className="relative">
          <button
            ref={dropdownRef}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAddNewOpen(v => !v);
            }}
            className="flex items-center cursor-pointer space-x-2 bg-white text-black px-3 py-1.5 rounded-md font-medium text-sm hover:bg-neutral-200 transition-all active:scale-95"
          >
            <span>{t("actions.addNew")}</span>
            <ChevronDownIcon
              className={`size-4 transition-transform ${isAddNewOpen ? "rotate-180" : ""}`}
            />
          </button>
          <Dropdown
            isOpen={isAddNewOpen}
            onClose={() => setIsAddNewOpen(false)}
            triggerRef={dropdownRef}
            className="w-56 mt-2"
          >
            <div className="p-1">
              <div className="p-2 border-b border-neutral-800">
                <p className="text-xs text-neutral-500">{t("actions.addSection")}</p>
              </div>

              <DropdownItem
                icon={<GlobeAltIcon className="size-4" />}
                className="mt-1"
                label={t("actions.domain")}
                href={`./${params.teamName}/new`}
              />

              <DropdownItem
                icon={<FolderIcon className="size-4" />}
                className="mt-1"
                label={t("actions.group")}
                href={`./${params.teamName}/groups`}
              />
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
