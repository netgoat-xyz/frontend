"use server"

import { trackAnalytics } from "@/actions/analytics"
import { getExperiments } from "@/actions/experiments"
import { auth } from "@/lib/auth"
import {
  renderMagicLinkEmail,
  renderOTPEmail,
  renderTeamInviteEmail,
  renderWelcomeEmail,
} from "@/lib/email"
import { headers } from "next/headers"
import { Resend } from "resend"

export type DebugEmailTemplate = "welcome" | "teamInvite" | "magicLink" | "otp"

type DebugSessionUser = {
  id: string
  name: string | null
  email: string | null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_NAME = "NetGoat"
const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePath(value: string) {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return "/"
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function normalizeUrl(value: string | undefined, fallbackPath: string) {
  const raw = value?.trim()

  if (raw && raw.length > 0) {
    try {
      return new URL(raw).toString()
    } catch {
      // Use fallback below.
    }
  }

  return new URL(fallbackPath, DEFAULT_APP_URL).toString()
}

function isDeveloperModeTestingEnabled(
  flags: Record<string, boolean | string> | null | undefined
) {
  const rawValue =
    flags?.Developer_Mode_Testing ||
    flags?.developer_mode_testing ||
    flags?.DEVELOPER_MODE_TESTING

  if (rawValue === true) {
    return true
  }

  if (typeof rawValue === "string") {
    return rawValue.trim().toLowerCase() === "true"
  }

  return false
}

async function assertDeveloperModeTestingEnabled() {
  const flags = (await getExperiments()) as Record<string, boolean | string> | null | undefined

  if (!isDeveloperModeTestingEnabled(flags)) {
    throw new Error("Developer_Mode_Testing is disabled for this account.")
  }
}

async function requireDebugSession(): Promise<DebugSessionUser> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await assertDeveloperModeTestingEnabled()

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  }
}

export async function sendDeveloperDebugEmail(input: {
  to: string
  template: DebugEmailTemplate
  teamName?: string
  roleName?: string
  inviteLink?: string
  magicLinkUrl?: string
  otpCode?: string
}) {
  const sessionUser = await requireDebugSession()
  const to = normalizeEmail(input.to)

  if (!EMAIL_REGEX.test(to)) {
    throw new Error("A valid recipient email is required.")
  }

  const resendApiKey = process.env.RESEND_APIKEY
  if (!resendApiKey) {
    throw new Error("RESEND_APIKEY is required to send debug emails.")
  }

  const resend = new Resend(resendApiKey)
  const emailFrom = process.env.EMAIL_FROM ?? "noreply@netgoat.xyz"

  let subject = ""
  let html = ""
  let text = ""

  if (input.template === "welcome") {
    const dashboardUrl = normalizeUrl(undefined, "/dashboard/@me")
    html = await renderWelcomeEmail(sessionUser.name || "Developer", APP_NAME, dashboardUrl)
    subject = `Welcome to ${APP_NAME} (Debug)`
    text = `Welcome to ${APP_NAME}. Open your dashboard: ${dashboardUrl}`
  } else if (input.template === "teamInvite") {
    const teamName = input.teamName?.trim() || "Debug Team"
    const roleName = input.roleName?.trim() || "member"
    const inviteLink = normalizeUrl(input.inviteLink, "/invite/debug-token")

    html = await renderTeamInviteEmail({
      inviteLink,
      teamName,
      roleName,
      invitedByName: sessionUser.name || "Debug Console",
      appName: APP_NAME,
    })
    subject = `${sessionUser.name || "Debug Console"} invited you to join ${teamName}`
    text = `You were invited to join ${teamName} as ${roleName}. Accept your invite: ${inviteLink}`
  } else if (input.template === "magicLink") {
    const magicLinkUrl = normalizeUrl(input.magicLinkUrl, "/auth/login/magic-link")
    html = await renderMagicLinkEmail(magicLinkUrl, APP_NAME)
    subject = `Magic link for ${APP_NAME} (Debug)`
    text = `Use this debug magic link to sign in: ${magicLinkUrl}`
  } else {
    const otpCode = (input.otpCode?.trim() || "482951").slice(0, 12)
    html = await renderOTPEmail(otpCode, "sign-in", APP_NAME)
    subject = `${APP_NAME} sign-in code (Debug)`
    text = `Your debug sign-in code for ${APP_NAME} is: ${otpCode}`
  }

  const result = (await resend.emails.send({
    from: `${APP_NAME} <${emailFrom}>`,
    to,
    subject,
    html,
    text,
  })) as {
    data?: { id?: string | null } | null
    error?: { message?: string } | null
  }

  if (result.error) {
    throw new Error(result.error.message || "Resend rejected the debug email request.")
  }

  return {
    success: true,
    template: input.template,
    to,
    messageId: result.data?.id ?? null,
    sentAt: new Date().toISOString(),
  }
}

export async function runDeveloperAnalyticsProbe(input: {
  path: string
  visitorId?: string
}) {
  await requireDebugSession()

  const path = normalizePath(input.path)
  const visitorId = input.visitorId?.trim() || `debug-${Date.now()}`

  await trackAnalytics({
    type: "pageview",
    path,
    visitorId,
    referrer: "developer-debug-route",
  })

  await trackAnalytics({
    type: "web-vital",
    path,
    visitorId,
    metricName: "LCP",
    metricValue: 2100,
    metricRating: "needs-improvement",
  })

  return {
    success: true,
    path,
    visitorId,
    sampledMetric: {
      name: "LCP",
      value: 2100,
      rating: "needs-improvement",
    },
    trackedAt: new Date().toISOString(),
  }
}
