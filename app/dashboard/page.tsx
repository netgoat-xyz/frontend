"use client";

import { DataTable } from "@/components/domains-table";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/components/home-sidebar";
import SiteHeader from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Globe } from "lucide-react";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PageTitle } from "@/components/SiteTitle";

type Domain = {
  group: string;
  name: string;
  status: "active" | "inactive" | "pending";
  lastSeen: string;
};

type Role = "user" | "admin";

type Data = {
  username: string;
  email: string;
  role: Role[]; // array of roles
  domains: Domain[];
  _id: string;
  createdAt: string; // or Date if you're parsing it
  updatedAt: string; // or Date if you're parsing it
};

export const dynamic = "force-dynamic";

export default function DashboardHomePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [subtitle, setSubtitle] = useState("");

  const funnySubtitles = [
    "Counting hits 👀",
    "Counting clicks… and cookies 🍪",
    "Your domains are chilling 😎",
    "Loading the magic… ✨",
    "Domains in the wild 🌴",
    "Never fear, Netgoat's here! 🐐",
    "Making sense of your digital chaos 🤯",
    "Cash and Cache, same thing, right? 💸",
    "<strike>Spying</strike> Watching over your domains 🕵️‍♂️",
  ];

  function getRandomSubtitle() {
    const index = Math.floor(Math.random() * funnySubtitles.length);
    return funnySubtitles[index];
  }

  useEffect(() => {
    setSubtitle(getRandomSubtitle());
  }, []);
  
  const router = useRouter();

  useEffect(() => {
    setLoaded(false);
    setError(null);

    axios
      .get(`/api/session`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })
      .then((res) => {
        setData(res.data || null);
        localStorage.setItem("session", JSON.stringify(res.data || {}));
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
        setError("Oops, session lost in the fog. Log in to reconnect!");
      });
  }, []);

  useEffect(() => {
    const sessionStr = window.localStorage.getItem("session");
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.username) setUsername(parsed.username);
      } catch {}
    }
  }, []);
  const capitalized = username.charAt(0).toUpperCase() + username.slice(1);



  // Interactive loading/error overlay (hidden after loaded)
  const LoadingOverlay = (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in pointer-events-auto transition-opacity duration-500 ${
        loaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ visibility: loaded ? "hidden" : "visible" }}
    >
      <svg
        className="animate-spin mb-6"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <button
        className="px-4 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 font-medium text-base transition-colors"
        onClick={() => window.location.reload()}
      >
        {error ? "Retry" : "Still loading? Click to retry"}
      </button>
      <div className="mt-4 text-muted-foreground text-sm">
        {error ? error : "Spying on your domains… almost there!"}
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" id="AppSidebar" />
      <SidebarInset id="SidebarInset">
        <SiteHeader title="Manage domains" id="SiteHeader" />
        <div>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <PageTitle
                    title={`Hi, ${capitalized} 👋`}
                    subtitle={subtitle}
                  />
                  {/* Show error message if loaded but no data */}
                  {loaded &&
                  !error &&
                  (!data || !data.domains || data.domains.length === 0) ? (
                    <div className="text-center text-muted-foreground py-8 text-lg">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Globe />
                          </EmptyMedia>
                          <EmptyTitle>No Domains, No Users.</EmptyTitle>
                          <EmptyDescription>
                            You haven&apos;t created any Domains yet. Get
                            started by creating your first Domains.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push("/dashboard/new")}
                            >
                              Create Domain
                            </Button>
                            <Button variant="outline">Import Domain</Button>
                          </div>
                        </EmptyContent>
                      </Empty>
                    </div>
                  ) : null}
                  {/* Show table if data exists */}
                  {loaded &&
                  !error &&
                  data &&
                  data.domains &&
                  data.domains.length > 0 ? (
                    <DataTable data={data.domains} />
                  ) : null}
                  {/* Show error message if loaded and error */}
                  {loaded && error ? (
                    <div className="text-center text-destructive py-8 text-lg">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>{" "}
          {LoadingOverlay}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
