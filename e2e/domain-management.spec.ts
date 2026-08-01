import { expect, test } from "@playwright/test";
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

function readEnvValue(name: string) {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  const match = envFile.match(new RegExp(`^${name}="?(.+?)"?$`, "m"));
  if (!match) {
    throw new Error(`${name} is missing from .env`);
  }
  return match[1];
}

async function markEmailVerified(email: string) {
  const mongoUri = readEnvValue("MONGODB_URI");
  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const startedAt = Date.now();

    while (Date.now() - startedAt < 20_000) {
      const result = await db.collection("user").updateOne(
        { email },
        {
          $set: {
            emailVerified: true,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount > 0) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timed out waiting for user ${email} to be created`);
  } finally {
    await client.close();
  }
}

test("team, local domain, reverse proxy, subdomain, and ssl flows work end to end", async ({ page }) => {
  const unique = Date.now().toString();
  const email = `netgoat-e2e-${unique}@example.com`;
  const password = `Netgoat!${unique}`;
  const username = `E2E ${unique}`;
  const teamName = `E2E Team ${unique}`;
  const teamSlug = `e2e-team-${unique}`;
  const domainName = `app-${unique}.test`;
  const certificatePem = [
    "-----BEGIN CERTIFICATE-----",
    "MIIBszCCAVmgAwIBAgIUQ29kZXhMb2NhbFRlc3RDZXJ0MB4XDTI2MDcyOTAwMDAwMFoX",
    "DTI3MDcyOTAwMDAwMFowEzERMA8GA1UEAwwIYXBwLmxvY2FsMFwwDQYJKoZIhvcNAQEB",
    "BQADSwAwSAJBAM1y4x2j1kW8j7+u8fH0v7cX6G9Oa1fJDbW+2o1y1XhE7oTg7Wzj4a3T",
    "4EwKp2oJf4J9R5l2hY1dY0VJ2qD2FfUCAwEAAaNTMFEwHQYDVR0OBBYEFMVY2R1i3f0m",
    "fT3z6m2i6hRk6h8KMB8GA1UdIwQYMBaAFMVY2R1i3f0mfT3z6m2i6hRk6h8KMA8GA1Ud",
    "EwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADQQC5J4lqV5YKhXzVx7J0zGfY7uU+1bQO",
    "J1pPj9S0YxwY6b3Lr1nG5d5M0b2ZxW0eS8nq5dH6aG5gkS8Q3E1x2M9F",
    "-----END CERTIFICATE-----",
  ].join("\n");
  const privateKeyPem = [
    "-----BEGIN PRIVATE KEY-----",
    "MIIEvQIBADANBgkqhkiG9w0BAQEFAASC",
    "AQ8AMIIBCgKCAQEAzXLjHaPWRbyPv67x8fS/txfob05rV8kNtb7ajXLVeETuhODtbOPh",
    "rdPgTAqnag l/gn1HmXaFjV1jRUnaoPYV9QIDAQABAoIBAFakePrivateKeyValueOnly",
    "-----END PRIVATE KEY-----",
  ].join("\n");

  await page.goto("/auth/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email/);

  await markEmailVerified(email);

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const signInResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/sign-in/email") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Login", exact: true }).click();
  const signInResponse = await signInResponsePromise;
  expect(signInResponse.ok()).toBeTruthy();

  await expect
    .poll(
      async () =>
        (await page.context().cookies()).filter((cookie) =>
          /(session|auth)/i.test(cookie.name),
        ).length,
      { timeout: 10_000 },
    )
    .toBeGreaterThan(0);
  await page.goto("/dashboard/teams/new");

  await page.getByLabel("Team name").fill(teamName);
  await page.getByRole("button", { name: "Create team" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${teamSlug}$`));

  await page.goto(`/dashboard/${teamSlug}/new`);
  await page.getByLabel("Domain", { exact: true }).fill(domainName);
  await page.getByLabel("Origin URL").fill("http://127.0.0.1:3100");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Review local setup")).toBeVisible();
  await page.getByRole("button", { name: "Create Domain" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${teamSlug}/${domainName}/ssl$`));

  await page.getByLabel("Certificate PEM").fill(certificatePem);
  await page.getByLabel("Private Key PEM").fill(privateKeyPem);
  await page.getByRole("button", { name: "Save SSL settings" }).click();
  await expect(page.getByText("Certificate configured")).toBeVisible();

  await page.goto(`/dashboard/${teamSlug}/${domainName}/reverse-proxies`);
  await page.getByLabel("Pool name").fill("Primary application pool");
  await page.getByLabel("Upstream servers").fill("http://127.0.0.1:3100\nhttp://127.0.0.1:3101");
  await page.getByLabel("Health check path").fill("/health");
  await page.getByRole("button", { name: "Create pool" }).click();
  await expect(page.getByText("Primary application pool")).toBeVisible();
  await expect(page.getByText("http://127.0.0.1:3101")).toBeVisible();

  await page.goto(`/dashboard/${teamSlug}/${domainName}/subdomains`);
  await page.getByLabel("Label").fill("api");
  await page.getByLabel("Origin URL").fill("http://127.0.0.1:3200");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(`api.${domainName}`)).toBeVisible();

  await page.goto(`/dashboard/${teamSlug}/${domainName}/reverse-proxies`);
  await page.getByLabel("Scope").selectOption("api");
  await page.getByLabel("Pool name").fill("API pool");
  await page.getByLabel("Upstream servers").fill("http://127.0.0.1:3200\nhttp://127.0.0.1:3201");
  await page.getByRole("button", { name: "Create pool" }).click();
  await expect(page.getByText("API pool")).toBeVisible();
  await expect(
    page.locator("span").filter({ hasText: `api.${domainName}` }).first(),
  ).toBeVisible();
});
