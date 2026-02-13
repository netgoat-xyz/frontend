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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Globe,
  ShieldCheck,
  Server,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  generateDomainVerification,
  verifyDomainOwnership,
} from "@/actions/domainVerification";
import { getTeam } from "@/actions/teams";
import { cn } from "@/lib/utils";

export default function NewDomainPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamName as string;
  
  const [teamData, setTeamData] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [step, setStep] = useState<"input" | "verify" | "configure">("input");
  const [domain, setDomain] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"txt" | "cname">(
    "txt"
  );
  const [targetUrl, setTargetUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoadingTeam(true);
        const team = await getTeam(teamSlug);
        setTeamData(team);
      } catch (error: any) {
        toast.error(error.message || "Failed to load team data");
        router.push("/dashboard");
      } finally {
        setLoadingTeam(false);
      }
    };

    if (teamSlug) {
      fetchTeamData();
    }
  }, [teamSlug, router]);

  const handleGenerateVerification = async () => {
    if (!domain) return toast.error("Please enter a domain");
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain))
      return toast.error("Please enter a valid domain");

    try {
      setVerifying(true);
      // Simulating API call for UI demo purposes if action not present
      const result = await generateDomainVerification(teamSlug, domain);
      setVerificationToken(result.token);
      setStep("verify");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate verification");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const result = await verifyDomainOwnership(
        teamSlug,
        domain,
        verificationToken
      );
      if (result.verified) {
        setVerified(true);
        setStep("configure");
        toast.success("Domain verified successfully");
      } else {
        toast.error("Verification failed. Check your DNS records.");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateDomain = async () => {
    if (!targetUrl) return toast.error("Please enter a target URL");
    try {
      setVerifying(true);
      const { createDomainForTeam } = await import("@/actions/teamDomains");
      await createDomainForTeam(teamSlug, {
        domain,
        target_url: targetUrl,
        auto_ssl: true,
        verification_token: verificationToken, // Pass the existing token
      });
      toast.success("Domain added");
      router.push(`/dashboard/${teamSlug}/domains`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create domain");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const steps = [
    { id: "input", label: "Domain" },
    { id: "verify", label: "Verify" },
    { id: "configure", label: "Configure" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 py-12 px-4">
      <div className="max-w-[580px] mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href={`/dashboard/${teamSlug}/`}
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to {loadingTeam ? "Project" : teamData?.name || "Project"}
          </Link>
          {loadingTeam ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Add Domain to {teamData?.name}
            </h1>
          )}
        </div>

        {/* Minimalist Stepper */}
        {loadingTeam ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
            <Skeleton className="h-6 w-24" />
            <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
            <Skeleton className="h-6 w-28" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {steps.map((s, index) => {
              const currentStepIndex = steps.findIndex((x) => x.id === step);
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border transition-colors",
                      isActive
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black"
                        : isCompleted
                        ? "bg-neutral-100 text-neutral-900 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                        : "bg-transparent text-neutral-400 border-neutral-200 dark:border-neutral-800"
                    )}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "ml-2 font-medium",
                      isActive
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500"
                    )}
                  >
                    {s.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800 mx-3" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loadingTeam ? (
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48 mt-2" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* STEP 1: INPUT */}
            {step === "input" && (
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Enter your domain
              </CardTitle>
              <CardDescription>
                We need to verify that you own the domain before we can issue an SSL certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-xs font-medium uppercase text-neutral-500">
                  Domain Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) =>
                      setDomain(e.target.value.toLowerCase().trim())
                    }
                    className="h-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 transition-all font-mono"
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleGenerateVerification()
                    }
                  />
                  <Button
                    onClick={handleGenerateVerification}
                    disabled={verifying || !domain}
                    className="h-10 bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {verifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Do not include http:// or https://.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: VERIFY */}
        {step === "verify" && (
          <div className="space-y-6">
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    Verify Ownership
                  </CardTitle>
                  <Badge variant="outline" className="font-normal text-neutral-500 border-neutral-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    Pending Verification
                  </Badge>
                </div>
                <CardDescription>
                  Add the following record to the DNS configuration for{" "}
                  <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">
                    {domain}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs
                  defaultValue="txt"
                  className="w-full"
                  onValueChange={(v) => setVerificationMethod(v as any)}
                >
                  <TabsList className="w-full justify-start p-0 h-auto bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none mb-6">
                    <TabsTrigger
                      value="txt"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 dark:data-[state=active]:border-neutral-100 data-[state=active]:shadow-none px-4 pb-3 pt-2"
                    >
                      TXT Record
                    </TabsTrigger>
                    <TabsTrigger
                      value="cname"
                      disabled
                      className="rounded-none border-b-2 border-transparent opacity-50 px-4 pb-3 pt-2"
                    >
                      CNAME Record
                    </TabsTrigger>
                  </TabsList>

                  {/* DNS Record Table Style */}
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="grid grid-cols-[100px_1fr_40px] items-center border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-500 border-r border-neutral-200 dark:border-neutral-800">
                        Type
                      </div>
                      <div className="px-4 py-3 font-mono text-sm text-neutral-900 dark:text-neutral-100">
                        TXT
                      </div>
                      <div className="px-2"></div>
                    </div>

                    <div className="grid grid-cols-[100px_1fr_40px] items-center border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-500 border-r border-neutral-200 dark:border-neutral-800 h-full flex items-center">
                        Name
                      </div>
                      <div className="px-4 py-3 font-mono text-sm text-neutral-900 dark:text-neutral-100 overflow-x-auto whitespace-nowrap">
                        _netgoat-verify
                      </div>
                      <div className="px-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-500 hover:text-neutral-900"
                          onClick={() => copyToClipboard("_netgoat-verify", "name")}
                        >
                          {copiedField === "name" ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-[100px_1fr_40px] items-center">
                      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-500 border-r border-neutral-200 dark:border-neutral-800 h-full flex items-center">
                        Value
                      </div>
                      <div className="px-4 py-3 font-mono text-sm text-neutral-900 dark:text-neutral-100 overflow-x-auto whitespace-nowrap">
                        {verificationToken}
                      </div>
                      <div className="px-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-500 hover:text-neutral-900"
                          onClick={() => copyToClipboard(verificationToken, "value")}
                        >
                          {copiedField === "value" ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Tabs>

                <Alert className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <Info className="h-4 w-4 text-neutral-500" />
                  <AlertTitle className="text-sm font-medium text-neutral-900 dark:text-neutral-100">DNS Propagation</AlertTitle>
                  <AlertDescription className="text-neutral-500 text-xs mt-1">
                    DNS changes may take a few minutes to propagate globally.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep("input")}
                  className="text-neutral-500 hover:text-neutral-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 min-w-[100px]"
                >
                  {verifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 3: CONFIGURE */}
        {step === "configure" && (
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
              </div>
              <CardTitle className="text-lg font-medium">
                Configure Domain
              </CardTitle>
              <CardDescription>
                Your domain <span className="text-neutral-900 dark:text-neutral-100 font-medium">{domain}</span> has been verified. Where should traffic be routed?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="target" className="text-xs font-medium uppercase text-neutral-500">
                  Destination URL
                </Label>
                <div className="relative">
                  <Input
                    id="target"
                    placeholder="my-project.vercel.app"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="h-10 pl-9 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 font-mono text-sm"
                  />
                  <Server className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                </div>
              </div>

              <div className="rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-4">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Included Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-xs text-neutral-500">
                    <Check className="w-3 h-3 mr-2 text-neutral-900 dark:text-neutral-100" />
                    Automatic SSL/TLS Certificates
                  </li>
                  <li className="flex items-center text-xs text-neutral-500">
                     <Check className="w-3 h-3 mr-2 text-neutral-900 dark:text-neutral-100" />
                    Global CDN Edge Caching
                  </li>
                  <li className="flex items-center text-xs text-neutral-500">
                     <Check className="w-3 h-3 mr-2 text-neutral-900 dark:text-neutral-100" />
                    DDoS Protection
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <Button
                onClick={handleCreateDomain}
                disabled={verifying || !targetUrl}
                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  "Finish Configuration"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
}