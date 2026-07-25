"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2, ShieldCheck,
  Globe,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  generateDomainVerification,
  verifyDomainOwnership,
} from "@/actions/domainVerification";
import { getTeam } from "@/actions/teams";
import { createDomainForTeam } from "@/actions/teamDomains";
import { sanitizeDomainInput, validateDomainSyntax } from "@/lib/domain-validation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type TeamSummary = {
  name?: string
}

export default function NewDomainPage() {
  const t = useTranslations("DashboardPages.newDomain");
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamName as string;
  
  const [teamData, setTeamData] = useState<TeamSummary | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [step, setStep] = useState<"input" | "verify">("input");
  const [domain, setDomain] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (teamSlug) {
      getTeam(teamSlug)
        .then((data) => {
          if (typeof data === "object" && data !== null && "name" in data && typeof data.name === "string") {
            setTeamData({ name: data.name });
            return;
          }

          setTeamData(null);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingTeam(false));
    }
  }, [teamSlug]);

  const handleNextToVerify = async () => {
    if (!domain) {
      toast.error(t("errors.enterDomain"));
      return;
    }

    const domainValidation = validateDomainSyntax(domain);
    if (!domainValidation.valid) {
      toast.error(t("errors.invalidDomain"));
      return;
    }

    const sanitizedDomain = domainValidation.sanitized;
    if (sanitizedDomain !== domain) {
      setDomain(sanitizedDomain);
    }

    try {
      setVerifying(true);
      // Generate verification token securely on the server
      const result = await generateDomainVerification(teamSlug, sanitizedDomain);
      
      if (result.success && result.token) {
        setVerificationToken(result.token);
        setStep("verify");
      } else {
        throw new Error(t("errors.tokenFailed"));
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    const domainValidation = validateDomainSyntax(domain);
    if (!domainValidation.valid) {
      toast.error(t("errors.invalidDomain"));
      return;
    }

    const sanitizedDomain = domainValidation.sanitized;
    if (sanitizedDomain !== domain) {
      setDomain(sanitizedDomain);
    }

    setVerifying(true);

    try {
      const result = await verifyDomainOwnership(teamSlug, sanitizedDomain, verificationToken);
      
      if (result.success && result.verified) {
        // The server action independently checks the token before persisting
        // this state. Do not pre-mark the client as verified or enable SSL.
        await createDomainForTeam(teamSlug, {
          domain: sanitizedDomain,
          target_url: "", // Set later by user
          verification_token: verificationToken,
        });

        setVerified(true);
        toast.success(t("toasts.verified"));
        toast.success(t("toasts.added"));
        router.push(`/dashboard/${teamSlug}/${sanitizedDomain}`);
      } else {
        toast.error(t("errors.verifyFailed"));
      }
    } catch {
      toast.error(t("errors.propagation"));
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(t("toasts.copied"));
    setTimeout(() => setCopiedField(null), 2000);
  };

  const steps = [
    { id: "input", label: t("steps.domain") },
    { id: "verify", label: t("steps.verify") },
  ];

  return (
    <div className="min-h-svh bg-neutral-50/50 dark:bg-neutral-950 py-10 sm:py-12 px-4">
      <div className="max-w-145 mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href={`/dashboard/${teamSlug}/`}
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t("backTo", { name: loadingTeam ? t("projectFallback") : teamData?.name || t("projectFallback") })}
          </Link>
          {loadingTeam ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
               {t("title", { teamName: teamData?.name || t("projectFallback") })}
            </h1>
          )}
        </div>

        {/* Minimalist Stepper */}
        {loadingTeam ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors",
                    step === s.id
                      ? "text-neutral-900 dark:text-neutral-50"
                      : s.id === "input" && step === "verify"
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-400 dark:text-neutral-600"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs",
                      step === s.id
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : s.id === "input" && step === "verify"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    {s.id === "input" && step === "verify" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-px mx-3",
                      s.id === "input" && step === "verify"
                        ? "bg-neutral-200 dark:bg-neutral-800"
                        : "bg-neutral-200 dark:bg-neutral-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              "transition-all duration-500 ease-in-out absolute w-full",
              step === "input"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 -translate-x-8 pointer-events-none"
            )}
          >
            <Card className="border-neutral-200/60 dark:border-neutral-800/60 shadow-lg shadow-neutral-200/20 dark:shadow-none bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner">
                  <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-xl">{t("input.title")}</CardTitle>
                <CardDescription className="text-[15px]">
                  {t("input.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                      <Globe className="h-4 w-4 text-neutral-500" />
                    </div>
                    <Input
                      id="domain"
                      placeholder={t("input.placeholder")}
                      value={domain}
                      onChange={(e) => setDomain(sanitizeDomainInput(e.target.value))}
                      className="pl-10 h-12 text-base transition-shadow focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleNextToVerify();
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6">
                <Button
                  onClick={handleNextToVerify}
                  disabled={!domain || verifying}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-all font-medium text-[15px]"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("actions.preparing")}
                    </>
                  ) : (
                    <>
                      {t("actions.continue")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div
            className={cn(
              "transition-all duration-500 ease-in-out absolute w-full",
              step === "verify"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-8 pointer-events-none"
            )}
          >
            <Card className="border-neutral-200/60 dark:border-neutral-800/60 shadow-lg shadow-neutral-200/20 dark:shadow-none bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors",
                    verified
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    {verified ? (
                      <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs px-2.5 py-1 bg-white dark:bg-neutral-950"
                  >
                    {domain}
                  </Badge>
                </div>
                <CardTitle className="text-xl">
                  {verified ? t("verify.verifiedTitle") : t("verify.title")}
                </CardTitle>
                <CardDescription className="text-[15px]">
                  {verified
                    ? t("verify.verifiedDescription")
                    : t("verify.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!verified && (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
                      <div className="p-4 flex items-center justify-between group">
                        <div className="space-y-1 overflow-hidden pr-4">
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {t("verify.fields.type")}
                          </p>
                          <p className="text-[15px] font-mono font-medium truncate">
                            TXT
                          </p>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between group hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors cursor-copy" onClick={() => copyToClipboard("_netgoat", "name")}>
                        <div className="space-y-1 overflow-hidden pr-4">
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {t("verify.fields.name")}
                          </p>
                          <p className="text-[15px] font-mono font-medium truncate">
                            _netgoat
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedField === "name" ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="p-4 flex items-center justify-between group hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors cursor-copy" onClick={() => copyToClipboard(verificationToken, "value")}>
                        <div className="space-y-1 overflow-hidden pr-4">
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {t("verify.fields.value")}
                          </p>
                          <p className="text-[15px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                            {verificationToken}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          {copiedField === "value" ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30 text-blue-800 dark:text-blue-300">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-sm ml-1 leading-relaxed">
                        {t("verify.propagationHint")}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {verified && (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-neutral-500">{t("verify.ready")}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-6">
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  disabled={verifying || verified}
                  className="w-full sm:w-auto h-11 px-6 shadow-sm order-2 sm:order-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("actions.back")}
                </Button>
                <div className="flex w-full gap-2 order-1 sm:order-2">
                  <Button
                    onClick={handleVerify}
                    disabled={verifying || verified}
                    className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-all font-medium flex-1 shadow-sm"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("actions.verifying")}
                      </>
                    ) : (
                      t("actions.verify")
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
