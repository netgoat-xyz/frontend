// lib/email/index.tsx
import { render } from "@react-email/render";
import { Resend } from "resend";
import {
  MagicLinkEmail,
  OTPEmail,
  TeamInviteEmail,
  WelcomeEmail,
} from "./templates";

export async function renderMagicLinkEmail(url: string, appName: string): Promise<string> {
  return render(<MagicLinkEmail url={url} appName={appName} />);
}

export async function renderOTPEmail(
  otp: string,
  type: "email-verification" | "forget-password" | "sign-in" | "change-email",
  appName: string
): Promise<string> {
  return render(<OTPEmail otp={otp} type={type} appName={appName} />);
}

export async function renderWelcomeEmail(name: string, appName: string, dashboardUrl: string): Promise<string> {
  return render(<WelcomeEmail name={name} appName={appName} dashboardUrl={dashboardUrl} />);
}

export async function renderTeamInviteEmail(args: {
  inviteLink: string;
  teamName: string;
  roleName: string;
  invitedByName: string;
  appName: string;
}): Promise<string> {
  return render(
    <TeamInviteEmail
      inviteLink={args.inviteLink}
      teamName={args.teamName}
      roleName={args.roleName}
      invitedByName={args.invitedByName}
      appName={args.appName}
    />
  );
}

export async function sendTeamInviteEmail(args: {
  to: string;
  inviteLink: string;
  teamName: string;
  roleName: string;
  invitedByName: string;
  appName?: string;
}) {
  const resendApiKey = process.env.RESEND_APIKEY;
  if (!resendApiKey) {
    throw new Error("RESEND_APIKEY is required to send team invitation emails.");
  }

  const resend = new Resend(resendApiKey);
  const appName = args.appName ?? "NetGoat";
  const emailFrom = process.env.EMAIL_FROM ?? "noreply@netgoat.xyz";
  const html = await renderTeamInviteEmail({
    inviteLink: args.inviteLink,
    teamName: args.teamName,
    roleName: args.roleName,
    invitedByName: args.invitedByName,
    appName,
  });

  return resend.emails.send({
    from: `${appName} <${emailFrom}>`,
    to: args.to,
    subject: `${args.invitedByName} invited you to join ${args.teamName}`,
    html,
    text: `You were invited to join ${args.teamName} as ${args.roleName}. Accept your invite: ${args.inviteLink}`,
  });
}
