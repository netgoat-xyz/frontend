"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LockPasswordIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateDomainSslAction } from "@/actions/domain-settings";
import { FormError } from "@/components/auth/auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";

/** Certificate upload + automatic SSL toggle for a domain or subdomain. */
export function SslForm({
  teamSlug,
  domainId,
  subdomain,
  hostname,
  autoSsl,
  hasManualCertificate,
  sslEnabled,
}: {
  teamSlug: string;
  domainId: string;
  subdomain?: string;
  hostname: string;
  autoSsl: boolean;
  hasManualCertificate: boolean;
  sslEnabled: boolean;
}) {
  const router = useRouter();

  const [autoSslEnabled, setAutoSslEnabled] = useState(autoSsl);
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [clearManual, setClearManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasNewMaterial = certificate.trim().length > 0 || privateKey.trim().length > 0;
  const dirty =
    autoSslEnabled !== autoSsl ||
    hasNewMaterial ||
    (clearManual && hasManualCertificate);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;

    if (hasNewMaterial && (!certificate.trim() || !privateKey.trim())) {
      setError("Provide both the certificate and its private key.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await updateDomainSslAction({
      teamSlug,
      domainId,
      subdomain,
      auto_ssl: autoSslEnabled,
      certificate_pem: certificate.trim() || undefined,
      private_key_pem: privateKey.trim() || undefined,
      clear_manual_ssl: clearManual,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "SSL configuration saved",
      description: "The edge applies it on the next snapshot.",
    });
    setCertificate("");
    setPrivateKey("");
    setClearManual(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={LockPasswordIcon} className="size-4" />
            Certificate
            {hasManualCertificate ? (
              <Badge variant="success" className="ms-auto">
                <HugeiconsIcon icon={Tick02Icon} />
                Manual certificate stored
              </Badge>
            ) : sslEnabled ? (
              <Badge variant="success" className="ms-auto">
                <HugeiconsIcon icon={Tick02Icon} />
                SSL enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="ms-auto">
                No certificate
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Certificates and keys stay on the server and are streamed to edge
            agents for {hostname}. Only the presence of a certificate is shown
            here — issuer, serial and expiry are not stored.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel>Automatic SSL</FieldLabel>
            <div className="flex h-9 items-center">
              <Switch
                checked={autoSslEnabled}
                onCheckedChange={setAutoSslEnabled}
                aria-label="Enable automatic SSL"
              />
            </div>
            <FieldDescription>
              Issue and renew certificates automatically at the edge.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="ssl-certificate">
              Certificate (PEM)
            </FieldLabel>
            <Textarea
              id="ssl-certificate"
              rows={6}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder="-----BEGIN CERTIFICATE-----"
              value={certificate}
              onChange={(event) => setCertificate(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ssl-private-key">
              Private key (PEM)
            </FieldLabel>
            <Textarea
              id="ssl-private-key"
              rows={6}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder="-----BEGIN PRIVATE KEY-----"
              value={privateKey}
              onChange={(event) => setPrivateKey(event.target.value)}
            />
            <FieldDescription>
              Leave both fields empty to keep the stored pair unchanged.
            </FieldDescription>
          </Field>

          {hasManualCertificate ? (
            <Field>
              <FieldLabel>Remove stored certificate</FieldLabel>
              <div className="flex h-9 items-center">
                <Switch
                  checked={clearManual}
                  onCheckedChange={setClearManual}
                  aria-label="Remove the stored certificate"
                />
              </div>
              <FieldDescription>
                Applies when you save: the stored pair is deleted and SSL falls
                back to the automatic setting.
              </FieldDescription>
            </Field>
          ) : null}

          <FormError message={error} />
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? <Spinner className="size-4" /> : null}
            Save SSL configuration
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
