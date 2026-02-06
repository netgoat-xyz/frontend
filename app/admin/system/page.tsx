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
    <Card>
    <CardHeader>
        <CardTitle>System Information</CardTitle>
        <CardDescription>Server specifications and status.</CardDescription>
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
        <div className="text-center py-4">Loading specs...</div>
        )}
    </CardContent>
    <CardFooter>
        <Button variant="destructive" onClick={handleRestart}>
            <Power className="mr-2 h-4 w-4"/> Restart System
        </Button>
    </CardFooter>
    </Card>
  );
}
