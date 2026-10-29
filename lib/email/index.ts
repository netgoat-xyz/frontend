import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

export const APP_NAME = "NetGoat";

let resendClient: Resend | null = null;

function resend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(serverEnv().RESEND_APIKEY);
  }
  return resendClient;
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends a transactional email through Resend. Throws on delivery errors so
 * callers can surface a truthful failure state.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const env = serverEnv();
  const { error } = await resend().emails.send({
    from: `${APP_NAME} <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}
