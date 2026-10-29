/**
 * Branded transactional email templates.
 *
 * Plain template literals keep the surface small (no react-email runtime) and
 * every interpolation is escaped before it reaches the markup.
 */

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

const layout = (appName: string, heading: string, body: string): string => `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#16a34a;">${escapeHtml(appName)}</p>
                <h1 style="margin:12px 0 0;font-size:20px;line-height:1.3;color:#09090b;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 32px;">${body}</td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#71717a;">Sent by ${escapeHtml(appName)}. If you did not request this email you can ignore it.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const button = (href: string, label: string): string =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;margin:8px 0 4px;padding:10px 18px;border-radius:8px;background:#09090b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>`;

export function magicLinkEmail({
  url,
  appName,
}: {
  url: string;
  appName: string;
}): EmailContent {
  const body = `
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3f3f46;">
      Click the button below to sign in. This link expires shortly and can only be used once.
    </p>
    ${button(url, `Sign in to ${appName}`)}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717a;word-break:break-all;">
      Button not working? Paste this URL into your browser:<br />${escapeHtml(url)}
    </p>`;

  return {
    subject: `Sign in to ${appName}`,
    html: layout(appName, "Your sign-in link", body),
    text: `Sign in to ${appName} with this link (valid once): ${url}`,
  };
}

export type OtpEmailType = "email-verification" | "forget-password" | "sign-in";

export function otpEmail({
  otp,
  type,
  appName,
}: {
  otp: string;
  type: OtpEmailType;
  appName: string;
}): EmailContent {
  const labels: Record<OtpEmailType, { heading: string; subject: string; action: string }> = {
    "email-verification": {
      heading: "Verify your email",
      subject: `Verify your email - ${appName}`,
      action: "verify your email address",
    },
    "forget-password": {
      heading: "Reset your password",
      subject: `Reset your password - ${appName}`,
      action: "reset your password",
    },
    "sign-in": {
      heading: "Your sign-in code",
      subject: `Sign in code - ${appName}`,
      action: "sign in",
    },
  };

  const label = labels[type] ?? labels["sign-in"];

  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">
      Use the code below to ${escapeHtml(label.action)}. It expires in 10 minutes.
    </p>
    <p style="margin:0;padding:14px 18px;border-radius:8px;background:#f4f4f5;font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:26px;letter-spacing:0.28em;color:#09090b;">${escapeHtml(otp)}</p>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
      Never share this code. ${escapeHtml(appName)} staff will never ask you for it.
    </p>`;

  return {
    subject: label.subject,
    html: layout(appName, label.heading, body),
    text: `Your code to ${label.action} on ${appName}: ${otp} (expires in 10 minutes)`,
  };
}
