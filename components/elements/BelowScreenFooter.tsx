"use client";

import { GitCommit, Github, ArrowUpCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BelowScreenFooter() {
    const serverCommit = process.env.NEXT_PUBLIC_COMMIT_HASH || "dev";
    const [latestCommit, setLatestCommit] = useState<string | null>(null);

    useEffect(() => {
        fetch("https://api.github.com/repos/netgoat-xyz/frontend/commits/Frontend-Rewrite")
            .then(res => res.json())
            .then(data => {
                if (data.sha) {
                    setLatestCommit(data.sha.substring(0, 7));
                }
            })
            .catch(e => console.error(e));
    }, []);

    const isOutdated = latestCommit && serverCommit !== "dev" && latestCommit !== serverCommit;

    return (
        <footer className="w-full border-t border-border py-6 bg-background/50 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} NetGoat. All rights reserved.</p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 font-mono text-xs" title="Server Commit">
                            <GitCommit className="w-3.5 h-3.5" />
                            <span>{serverCommit}</span>
                        </div>
                        
                        {latestCommit && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-xs transition-colors ${isOutdated ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}`} title={isOutdated ? "Update Available" : "Up to Date"}>
                                <Github className="w-3.5 h-3.5" />
                                <span>{latestCommit}</span>
                                {isOutdated ? <ArrowUpCircle className="w-3 h-3 ml-1" /> : <CheckCircle2 className="w-3 h-3 ml-1" />}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/status" className="hover:text-foreground transition-colors">
                            Status
                        </Link>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}