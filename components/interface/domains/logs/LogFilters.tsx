"use client";

import { Search, Filter, X, Calendar } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LogFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState(0);

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-xl p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by IP, path, method..."
            className="w-full pl-9 pr-9 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status Code</SelectLabel>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="2xx">2xx Success</SelectItem>
              <SelectItem value="3xx">3xx Redirect</SelectItem>
              <SelectItem value="4xx">4xx Client</SelectItem>
              <SelectItem value="5xx">5xx Server</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Method filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>HTTP Method</SelectLabel>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-700 rounded-lg text-xs font-medium transition-all">
          <Filter size={12} /> Filters
          {activeFilters > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-bold">
              {activeFilters}
            </span>
          )}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-700 rounded-lg text-xs font-medium transition-all">
          <Calendar size={12} /> Last 24h
        </button>
      </div>
    </div>
  );
}
