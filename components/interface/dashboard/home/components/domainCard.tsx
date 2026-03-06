'use client'

import { StarIcon, CheckCircle2, AlertCircle, RefreshCw, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { verifyDomain } from "@/actions/domainVerification";
import { Button } from "@/components/ui/button";

const DomainCard = memo(function DomainCard({ domain, onVerified }: DomainPropsCard & { onVerified?: () => void }) {
  const router = useRouter();
  const isValid = domain.status === "Valid";
  const isInvalid = domain.status === "Invalid Configuration";
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [localVerified, setLocalVerified] = useState(domain.verified);

  // Reset message when domain becomes verified from props
  useEffect(() => {
    if (domain.verified && !localVerified) {
      setLocalVerified(true);
      setVerificationMessage("");
    }
  }, [domain.verified, localVerified]);

  const handleVerify = useCallback(async () => {
    if (!domain.teamSlug) return;
    
    setVerifying(true);
    setVerificationMessage("");
    
    try {
      const result = await verifyDomain(domain.teamSlug, domain.name);
      if (result.verified) {
        setVerificationMessage("✓ Domain verified successfully!");
        setLocalVerified(true);
        // Clear message after 2 seconds before refresh
        setTimeout(() => {
          setVerificationMessage("");
          router.refresh();
          if (onVerified) {
            onVerified();
          }
        }, 2000);
      } else {
        setVerificationMessage(result.message || "Verification failed. Please check your DNS records.");
        // Clear error message after 5 seconds
        setTimeout(() => setVerificationMessage(""), 5000);
      }
    } catch (error: any) {
      setVerificationMessage(error.message || "Failed to verify domain");
      // Clear error message after 5 seconds
      setTimeout(() => setVerificationMessage(""), 5000);
    } finally {
      setVerifying(false);
    }
  }, [domain.teamSlug, domain.name, router, onVerified]);

  const copyToken = useCallback(() => {
    if (domain.verificationToken) {
      navigator.clipboard.writeText(domain.verificationToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  }, [domain.verificationToken]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-neutral-100 font-semibold text-[15px] group-hover:underline cursor-pointer">
              {domain.name}
            </h3>
            {domain.isStarred && (
              <StarIcon className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center mt-1.5 space-x-2">
             {/* Status Indicator Dot */}
            <div className={`w-2 h-2 rounded-full ${
              isValid ? 'bg-emerald-500' : 
              isInvalid ? 'bg-red-500' : 
              'bg-amber-500'
            }`} />
            <span className={`text-xs ${
              isValid ? 'text-emerald-400' : 
              isInvalid ? 'text-red-400' : 
              'text-amber-400'
            }`}>
              {domain.status}
            </span>
          </div>
        </div>
        
        {/* External Link Icon */}
        <a href={`https://${domain.name}`} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Verification Section - Show only if not verified */}
      {!domain.verified && domain.verificationToken && (
        <div className="mb-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg">
          <div className="flex items-start space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-300 font-medium mb-1">Domain needs verification</p>
              <p className="text-[11px] text-neutral-400 mb-2">
                Add this TXT record to <span className="text-neutral-200 font-mono">_netgoat-verify.{domain.name}</span>
              </p>
              <div className="flex items-center space-x-1">
                <code className="text-[10px] bg-neutral-900 px-2 py-1 rounded border border-neutral-700 text-neutral-300 truncate flex-1 block">
                  {domain.verificationToken}
                </code>
                <button
                  onClick={copyToken}
                  className="p-1.5 hover:bg-neutral-700 rounded transition-colors shrink-0"
                  title="Copy token"
                >
                  {copiedToken ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {verificationMessage && (
            <p className={`text-[11px] mt-2 ${
              verificationMessage.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {verificationMessage}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Group</span>
            <span className="text-xs text-neutral-300">{domain.group}</span>
          </div>
          <div className="flex flex-col border-l border-neutral-800 pl-4">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Updated</span>
            <span className="text-xs text-neutral-300">{domain.updatedAt}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!domain.verified && (
            <Button
              onClick={handleVerify}
              disabled={verifying}
              size="sm"
              variant="outline"
              className="text-xs h-8 px-3 border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Checking...' : 'Verify'}
            </Button>
          )}
          <Link href={domain.pathName as any} className="text-neutral-400 hover:text-neutral-100 text-xs font-medium border border-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-900 transition-all">
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
});

export default DomainCard;
