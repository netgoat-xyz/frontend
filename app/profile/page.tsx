"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/home-sidebar";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Avatar from "@/components/utils/Avatar";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

const secondaryNavigation = [
  { name: "Account", href: "#", current: true },
  { name: "Notifications", href: "#", current: false },
  { name: "Billing", href: "#", current: false },
  { name: "Teams", href: "#", current: false },
  { name: "Integrations", href: "#", current: false },
];

export default function ProfilePage() {
  // Controlled personal info state (initialized from localStorage where possible)
  const [firstName, setFirstName] = useState<string>(() => {
    if (typeof window !== "undefined") return window.localStorage.getItem("firstName") || "";
    return "";
  });
  const [lastName, setLastName] = useState<string>(() => {
    if (typeof window !== "undefined") return window.localStorage.getItem("lastName") || "";
    return "";
  });
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== "undefined") return window.localStorage.getItem("email") || "";
    return "";
  });
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== "undefined") return window.localStorage.getItem("username") || "";
    return "";
  });
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof window !== "undefined") return window.localStorage.getItem("timezone") || "";
    return "";
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      alert("File size exceeds 1MB limit");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/gif", "image/png"].includes(file.type)) {
      alert("Only JPG, GIF, or PNG files are allowed");
      return;
    }

    try {
      setAvatarUploading(true);
      const jwtkey = typeof window !== "undefined" ? window.localStorage.getItem("jwt") : null;
      
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKENDAPI}/api/profile/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtkey}`,
          },
          body: formData,
        }
      );

      if (res.ok) {
        alert("Avatar uploaded successfully");
        // Trigger page refresh or avatar component re-render
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        const errorData = await res.json();
        alert(`Error uploading avatar: ${errorData.error || res.statusText}`);
        console.error("Failed to upload avatar:", errorData);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error("Avatar upload failed:", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePersonalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const jwtkey = typeof window !== "undefined" ? window.localStorage.getItem("jwt") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKENDAPI}/api/profile/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtkey}`,
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            username,
            timezone,
          }),
        }
      );

      if (res.ok) {
        // Save to localStorage as backup
        if (typeof window !== "undefined") {
          window.localStorage.setItem("firstName", firstName);
          window.localStorage.setItem("lastName", lastName);
          window.localStorage.setItem("email", email);
          window.localStorage.setItem("username", username);
          window.localStorage.setItem("timezone", timezone);
        }
        alert("Profile saved successfully");
        console.log("Profile saved to API:", { firstName, lastName, email, username, timezone });
      } else {
        const errorData = await res.json();
        alert(`Error saving profile: ${errorData.error || res.statusText}`);
        console.error("Failed to save profile:", errorData);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error("API request failed:", err);
    }
  };
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" id="AppSidebar" />
      <SidebarInset id="SidebarInset">
        <SiteHeader title="Account Settings"></SiteHeader>

        <main>
          <h1 className="sr-only">Account Settings</h1>
          <header className="">
            {/* Secondary navigation */}
            <nav className="flex overflow-x-auto mt-6">
              <ul
                role="list"
                className="flex min-w-full flex-none gap-x-3 px-4 text-sm/6 font-semibold text-gray-400 sm:px-6 lg:px-8"
              >
                {secondaryNavigation.map((item) => (
                  <li
                    key={item.name}
                    className={
                      item.current
                        ? "bg-primary py-1 px-3 rounded-lg"
                        : "bg-secondary  py-1 px-3  rounded-lg"
                    }
                  >
                    <a
                      href={item.href}
                      className={
                        item.current
                          ? "text-primary-foreground"
                          : "text-secondary-foreground"
                      }
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          {/* Settings forms */}
          <div className="divide-y divide-white/5">
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-white">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm/6 text-gray-400">
                  Use a permanent address where you can receive mail.
                </p>
              </div>

              <form className="md:col-span-2" onSubmit={handlePersonalSave}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full flex items-center gap-x-8">
                    <Avatar />
                    <div>
                      <input
                        type="file"
                        id="avatar-input"
                        accept="image/jpeg,image/gif,image/png"
                        onChange={handleAvatarUpload}
                        disabled={avatarUploading}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById("avatar-input")?.click()}
                        disabled={avatarUploading}
                        className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {avatarUploading ? "Uploading..." : "Change avatar"}
                      </button>
                      <p className="mt-2 text-xs/5 text-gray-400">
                        JPG, GIF or PNG. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="Username"
                      className="block text-sm/6 font-medium text-white"
                    >
                      First Name
                    </label>
                    <div className="mt-2">
                      <Input
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName((e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="last-name"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Last name
                    </label>
                    <div className="mt-2">
                      <Input
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName((e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="email"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Email address
                    </label>
                    <div className="mt-2">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>

                  <div className="col-span-full space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>

                    <div className="flex w-full">
                      <span className="border border-input flex items-center rounded-l-lg bg-neutral-700 px-3 text-sm text-foreground/80">
                        example.com/
                      </span>

                      <Input
                        id="username"
                        name="username"
                        placeholder="Chloe"
                        className="rounded-l-none border-l-0"
                        value={username}
                        onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="timezone"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Timezone
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                      <Select name="timezone" value={timezone} onValueChange={(v) => setTimezone(v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="PST">Pacific Standard Time</SelectItem>
                            <SelectItem value="EST">Eastern Standard Time</SelectItem>
                            <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <Button
                    type="submit"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-white">
                  Change password
                </h2>
                <p className="mt-1 text-sm/6 text-gray-400">
                  Update your password associated with your account.
                </p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label
                      htmlFor="current-password"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Current password
                    </label>
                    <div className="mt-2">
                      <Input
                        id="current-password"
                        name="current_password"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="new-password"
                      className="block text-sm/6 font-medium text-white"
                    >
                      New password
                    </label>
                    <div className="mt-2">
                      <Input
                        id="new-password"
                        name="new_password"
                        type="password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Confirm password
                    </label>
                    <div className="mt-2">
                      <Input
                        id="confirm-password"
                        name="confirm_password"
                        type="password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <Button
                    type="submit"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-white">
                  Log out other sessions
                </h2>
                <p className="mt-1 text-sm/6 text-gray-400">
                  Please enter your password to confirm you would like to log
                  out of your other sessions across all of your devices.
                </p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label
                      htmlFor="logout-password"
                      className="block text-sm/6 font-medium text-white"
                    >
                      Your password
                    </label>
                    <div className="mt-2">
                      <Input
                        id="logout-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <Button
                    type="submit"
                  >
                    Log out other sessions
                  </Button>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-white">
                  Delete account
                </h2>
                <p className="mt-1 text-sm/6 text-gray-400">
                  No longer want to use our service? You can delete your account
                  here. This action is not reversible. All information related
                  to this account will be deleted permanently.
                </p>
              </div>

              <form className="flex items-start md:col-span-2">
                <Button
                  type="submit"
                  variant="destructive"
                >
                  Yes, delete my account
                </Button>
              </form>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
