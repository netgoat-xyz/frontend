"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";

/**
 * Browser auth client. Defaults to the current origin, so the same build
 * works on localhost:3002, preview deployments and production without env
 * juggling.
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient(), magicLinkClient()],
  sessionOptions: {
    refetchOnWindowFocus: false,
    refetchInterval: 0,
    refetchWhenOffline: false,
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;
