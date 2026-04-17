// lib/email/templates.tsx
import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Button,
  Heading,
  Hr,
  Img,
} from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

// Theme Configuration
const theme = {
  colors: {
    background: "#0a0a0f", // Dark mode application color
    surface: "#111111", // Slightly lighter for email surface
    border: "#333333", // Dark border
    text: "#ffffff",
    secondaryText: "#a1a1aa", // Muted text
    brand: "#7c3aed", // Violet/Purple brand color
    buttonText: "#ffffff",
  },
  spacing: {
    containerPadding: "40px",
    contentPadding: "24px",
  },
  borderRadius: "8px",
};

const styles = {
  main: {
    backgroundColor: theme.colors.background,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    color: theme.colors.text,
  },
  container: {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "560px",
  },
  logo: {
    margin: "0 auto",
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  logoText: {
    fontSize: "24px",
    fontWeight: "bold",
    color: theme.colors.text,
    textDecoration: "none",
  },
  section: {
    padding: "32px",
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius,
    textAlign: "center" as const,
  },
  heading: {
    fontSize: "20px",
    lineHeight: "1.3",
    fontWeight: "700",
    color: theme.colors.text,
    margin: "0 0 16px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: theme.colors.secondaryText,
    margin: "0 0 24px",
  },
  button: {
    backgroundColor: theme.colors.brand,
    borderRadius: "6px",
    color: theme.colors.buttonText,
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
    margin: "0 0 24px",
  },
  codeContainer: {
    padding: "16px",
    backgroundColor: "#1a1a20",
    borderRadius: "6px",
    border: "1px solid #333333",
    margin: "24px 0",
    textAlign: "center" as const,
  },
  code: {
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "4px",
    margin: "0",
  },
  hr: {
    borderColor: "#333333",
    margin: "24px 0",
  },
  footer: {
    color: "#666666",
    fontSize: "12px",
    lineHeight: "1.5",
    textAlign: "center" as const,
    marginTop: "24px",
  },
  link: {
    color: theme.colors.brand,
    textDecoration: "underline",
  },
  securityNote: {
    fontSize: "12px",
    color: "#666666",
    fontStyle: "italic",
    marginTop: "16px",
  },
};

// -----------------------------------------------------------------------------
// Component: Header (Logo)
// -----------------------------------------------------------------------------
const EmailHeader = ({ appName }: { appName: string }) => (
  <Section style={styles.logo}>
    <Text style={styles.logoText}>{appName}</Text>
  </Section>
);

// -----------------------------------------------------------------------------
// Component: Footer
// -----------------------------------------------------------------------------
const EmailFooter = ({ appName }: { appName: string }) => (
  <Section>
    <Text style={styles.footer}>
      © {new Date().getFullYear()} {appName}. All rights reserved.
    </Text>
  </Section>
);

// -----------------------------------------------------------------------------
// Email Template: Magic Link
// -----------------------------------------------------------------------------
interface MagicLinkEmailProps {
  url: string;
  appName: string;
}

export const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  url,
  appName,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {appName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <EmailHeader appName={appName} />
          
          <Section style={styles.section}>
            <Heading style={styles.heading}>Your magic link</Heading>
            <Text style={styles.paragraph}>
              You requested a magic link to sign in to <strong>{appName}</strong>.
              Click the button below to log in instantly.
            </Text>
            
            <Button href={url} style={styles.button}>
              Sign in to {appName}
            </Button>
            
            <Hr style={styles.hr} />
            
            <Text style={{ ...styles.paragraph, fontSize: "13px", color: "#666" }}>
              If you didn't request this email, you can safely ignore it. This link
              will expire in 15 minutes.
            </Text>
            
            <Text style={{ ...styles.paragraph, fontSize: "13px", color: "#666", marginBottom: 0 }}>
              Use the link below if the button doesn't work:
              <br />
              <Link href={url} style={{ color: "#888", textDecoration: "underline" }}>
                {url}
              </Link>
            </Text>
          </Section>

          <EmailFooter appName={appName} />
        </Container>
      </Body>
    </Html>
  );
};

// -----------------------------------------------------------------------------
// Email Template: OTP / Verification
// -----------------------------------------------------------------------------
interface OTPEmailProps {
  otp: string;
  type: "email-verification" | "forget-password" | "sign-in" | "change-email";
  appName: string;
}

export const OTPEmail: React.FC<OTPEmailProps> = ({ otp, type, appName }) => {
  const headings = {
    "email-verification": "Verify your email address",
    "forget-password": "Reset your password",
    "sign-in": "Your sign-in code",
    "change-email": "Verify your new email",
  };
  
  const bodies = {
    "email-verification":
      "Thanks for starting the new account creation process. We want to make sure it's really you. Please enter the following verify code when prompted.",
    "forget-password":
      "Someone (hopefully you) requested a password reset for your account. Use the code below to set a new password.",
    "sign-in":
      "Here is your one-time verification code to sign in. This code will expire shortly.",
    "change-email": "You requested to change your email address. Please enter the following code to confirm.",
  };

  const title = headings[type];
  const bodyText = bodies[type];

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <EmailHeader appName={appName} />
          
          <Section style={styles.section}>
            <Heading style={styles.heading}>{title}</Heading>
            
            <Text style={styles.paragraph}>{bodyText}</Text>
            
            <div style={styles.codeContainer}>
              <Text style={styles.code}>{otp}</Text>
            </div>
            
            <Text style={styles.securityNote}>
              Verification codes expire after 10 minutes. Do not share this code
              with anyone.
            </Text>
          </Section>

          <EmailFooter appName={appName} />
        </Container>
      </Body>
    </Html>
  );
};

// -----------------------------------------------------------------------------
// Email Template: Welcome
// -----------------------------------------------------------------------------
interface WelcomeEmailProps {
  name: string;
  appName: string;
  dashboardUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  appName,
  dashboardUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}!</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <EmailHeader appName={appName} />
          
          <Section style={styles.section}>
            <Heading style={styles.heading}>Welcome aboard, {name}!</Heading>
            <Text style={styles.paragraph}>
              We're thrilled to have you with us. {appName} is designed to help you
              build better, faster, and more securely.
            </Text>
            
            <Text style={styles.paragraph}>
              You can now access your dashboard to start managing your projects,
              view analytics, and configure your settings.
            </Text>
            
            <Button href={dashboardUrl} style={styles.button}>
              Go to Dashboard
            </Button>
            
            <Hr style={styles.hr} />
            
            <Text style={styles.paragraph}>
              If you have any questions, feel free to reply to this email or check
              out our documentation.
            </Text>
          </Section>

          <EmailFooter appName={appName} />
        </Container>
      </Body>
    </Html>
  );
};

interface TeamInviteEmailProps {
  inviteLink: string;
  teamName: string;
  roleName: string;
  invitedByName: string;
  appName: string;
}

function formatRoleName(roleName: string) {
  return roleName
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export const TeamInviteEmail: React.FC<TeamInviteEmailProps> = ({
  inviteLink,
  teamName,
  roleName,
  invitedByName,
  appName,
}) => {
  const prettyRole = formatRoleName(roleName);

  return (
    <Html>
      <Head />
      <Preview>{invitedByName} invited you to join {teamName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <EmailHeader appName={appName} />

          <Section style={styles.section}>
            <Heading style={styles.heading}>You're invited to join {teamName}</Heading>
            <Text style={styles.paragraph}>
              <strong>{invitedByName}</strong> invited you to collaborate in <strong>{teamName}</strong> on {appName}.
            </Text>

            <Text style={styles.paragraph}>
              Assigned role: <strong>{prettyRole}</strong>
            </Text>

            <Button href={inviteLink} style={styles.button}>
              Accept Team Invite
            </Button>

            <Hr style={styles.hr} />

            <Text style={{ ...styles.paragraph, fontSize: "13px", color: "#666" }}>
              This invite link expires in 7 days. If this wasn&apos;t expected, you can ignore this email.
            </Text>

            <Text style={{ ...styles.paragraph, fontSize: "13px", color: "#666", marginBottom: 0 }}>
              If the button does not work, use this link:
              <br />
              <Link href={inviteLink} style={{ color: "#888", textDecoration: "underline" }}>
                {inviteLink}
              </Link>
            </Text>
          </Section>

          <EmailFooter appName={appName} />
        </Container>
      </Body>
    </Html>
  );
};
