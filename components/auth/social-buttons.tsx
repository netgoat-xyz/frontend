"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

const PROVIDERS = [
  { id: "github", name: "GitHub", icon: "/brands/GitHub/GitHub_Symbol_0.svg" },
  { id: "gitlab", name: "GitLab", icon: "/brands/GitLab/GitLab_Symbol_0.svg" },
  { id: "discord", name: "Discord", icon: "/brands/Discord/Discord_idk1kDTKQj_0.svg" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

/**
 * Social sign-in row. The provider glyphs are white-on-dark assets, so they
 * sit on a dark tile that reads correctly in both themes.
 */
export function SocialButtons({
  callbackURL = "/dashboard",
}: {
  callbackURL?: string;
}) {
  const [pending, setPending] = useState<ProviderId | null>(null);

  async function signInWith(provider: ProviderId) {
    setPending(provider);
    try {
      const { error } = await authClient.signIn.social({ provider, callbackURL });
      if (error) {
        toastManager.add({
          type: "error",
          title: "Social sign-in failed",
          description: getErrorMessage(error, "Please try again."),
        });
        setPending(null);
      }
      // On success the browser is redirected to the provider.
    } catch (err) {
      toastManager.add({
        type: "error",
        title: "Social sign-in failed",
        description: getErrorMessage(err, "Please try again."),
      });
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          size="lg"
          loading={pending === provider.id}
          disabled={pending !== null && pending !== provider.id}
          onClick={() => signInWith(provider.id)}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-zinc-950">
            <Image
              src={provider.icon}
              alt=""
              width={13}
              height={13}
              unoptimized
              className="size-3"
            />
          </span>
          <span className="sr-only">Continue with {provider.name}</span>
        </Button>
      ))}
    </div>
  );
}
