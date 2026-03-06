"use client";

import { useState } from "react";
import {
  EnvelopeIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Member" | "Billing";
  avatar?: string;
  status: "active" | "pending";
}

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Ducky",
    email: "chloe@cloudable.dev",
    role: "Owner",
    status: "active",
  },
  {
    id: "2",
    name: "Jim Halpert",
    email: "da_jim@cloudable.dev",
    role: "Member",
    status: "active",
  },
  {
    id: "3",
    name: "Michael Scott",
    email: "michael_s@cloudable.dev",
    role: "Member",
    status: "pending",
  },
];

export default function TeamsPage() {
  const [members] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto ">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Team Members
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Manage your team members and their privileges.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-neutral-200 transition-all active:scale-95">
          <UserPlusIcon className="size-4" />
          Invite Member
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
        <div className="h-9 w-px bg-neutral-800 hidden md:block" />
        <p className="text-xs text-neutral-500 font-medium hidden md:block">
          {members.length} Total Members
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4">
  <div className="flex items-start gap-3">
    <EnvelopeIcon className="size-4 text-neutral-400 mt-0.5" />

    <div className="flex-1">
      <p className="text-sm font-medium text-neutral-100">
        Invite link
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Share this link to invite people to your team.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value="https://netgoat.xyz/invite/duckydev-personal-team"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-400 focus:outline-none"
        />
        <button className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700/50 cursor-pointer transition">
          Copy
        </button>
      </div>

      <p className="mt-2 text-[11px] text-neutral-500">
        Anyone with the link can request access.
      </p>
    </div>
  </div>
</div>


      {/* Members Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-800">
                <th className="px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="group hover:bg-neutral-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">
                        {member.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-200">
                          {member.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-neutral-400">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.status === "pending" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded-md hover:bg-neutral-800">
                      <EllipsisHorizontalIcon className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
