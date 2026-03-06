"use client";

import { useEffect, useState } from "react";
import {
  Power,
} from "lucide-react";
import {
  getSystemSpecs,
  adminRestartSystem
} from "@/actions/adminValues";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSystemPage() {
  const [systemSpecs, setSystemSpecs] = useState<any>(null);

  useEffect(() => {
    const fetchSystemSpecs = async () => {
        try {
          const data = await getSystemSpecs();
          setSystemSpecs(data);
        } catch (e) {
          toast.error("Failed to fetch system specs");
        }
      };
    fetchSystemSpecs();
  }, []);

  const handleRestart = async () => {
    if(!confirm("Are you sure you want to trigger a system restart?")) return;
    try {
      await adminRestartSystem();
      toast.success("Restart signal sent");
    } catch (error) {
      toast.error("Failed to restart system");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Information</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Server specifications and status.
          </p>
        </div>
        <Button variant="destructive" onClick={handleRestart} className="shadow-sm">
            <Power className="mr-2 h-4 w-4"/> Restart System
        </Button>
      </div>

    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
    <CardHeader>
        <CardTitle>Hardware Details</CardTitle>
        <CardDescription>Current hardware allocation and usage metrics.</CardDescription>
    </CardHeader>
    <CardContent>
        {systemSpecs ? (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">OS</span>
                <span>{systemSpecs.os}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">CPU Model</span>
                <span>{systemSpecs.cpuModel}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">CPU Cores</span>
                <span>{systemSpecs.cpuCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Memory (Total)</span>
                <span>{systemSpecs.memoryTotal}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Memory (Free)</span>
                <span>{systemSpecs.memoryFree}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Uptime</span>
                <span>{systemSpecs.uptime}</span>
            </div>
        </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="flex justify-between border-b pb-2">
                        <Skeleton className="h-5 w-[100px]" />
                        <Skeleton className="h-5 w-[150px]" />
                    </div>
                ))}
            </div>
        )}
    </CardContent>
    </Card>
    </div>
  );
}
