// lib/email/index.tsx
import { render } from "@react-email/render";
import { MagicLinkEmail, OTPEmail, WelcomeEmail } from "./templates";

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
