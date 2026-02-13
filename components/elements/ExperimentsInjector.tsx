"use client";

import { useEffect, useState } from "react";
import { enableAllExperiments, getAllAvailableExperiments, getExperiments, setExperimentValue } from "@/actions/experiments";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bug, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExperimentsInjector() {
  const [showUI, setShowUI] = useState(false);
  const [open, setOpen] = useState(false);
  const [availableFlags, setAvailableFlags] = useState<any[]>([]);
  const [userFlags, setUserFlags] = useState<Record<string, boolean | string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDev = localStorage.getItem("netgoat_experiments_ui") === "true";
      setShowUI(isDev);

      (window as any).giveMeAllTheBugs = async () => {
        if (process.env.NODE_ENV === 'development') console.log("🐛 Enabling Experiment UI...");
        localStorage.setItem("netgoat_experiments_ui", "true");
        setShowUI(true);
        
        try {
          await enableAllExperiments();
          if (process.env.NODE_ENV === 'development') console.log("✅ All experiments enabled! Reloading...");
          window.location.reload();
        } catch (e) {
          console.error("❌ Failed to enable experiments. Are you logged in?", e);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (showUI && open) {
        const loadData = async () => {
             const [all, current] = await Promise.all([
                 getAllAvailableExperiments(),
                 getExperiments()
             ]);
             setAvailableFlags(all);
             setUserFlags(current);
        };
        loadData();
    }
  }, [showUI, open]);

  const handleUpdate = async (key: string, value: string | boolean) => {
    setUserFlags(prev => ({...prev, [key]: value}));
    
    try {
        await setExperimentValue(key, value === false ? "false" : value.toString());
        toast.success(`Updated ${key}`);
    } catch (e) {
        toast.error("Failed to update experiment");
    }
  };

  if (!showUI) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "destructive", size: "icon" }), "h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform")}>
                <Bug className="h-6 w-6" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        Experiments & Feature Flags
                    </DialogTitle>
                    <DialogDescription>
                        Manage active experiments for your session. These settings persist across reloads.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {availableFlags.map((flag) => {
                         const currentValue = userFlags[flag.key] ?? false;
                         const hasVariants = flag.variants && flag.variants.length > 0;
                         
                         return (
                             <div key={flag.key} className="flex flex-col gap-2 p-3 border rounded-lg bg-secondary/20">
                                 <div className="flex items-center justify-between">
                                     <div className="space-y-0.5">
                                         <Label className="text-base font-semibold">{flag.key}</Label>
                                         <p className="text-xs text-muted-foreground">{flag.description}</p>
                                     </div>
                                     {!hasVariants && (
                                         <Switch 
                                             checked={!!currentValue} 
                                             onCheckedChange={(c) => handleUpdate(flag.key, c)}
                                         />
                                     )}
                                 </div>
                                 
                                 {hasVariants && (
                                     <Select 
                                         value={currentValue.toString() === "true" ? flag.variants[0] : (currentValue.toString() || "false")} 
                                         onValueChange={(v) => handleUpdate(flag.key, v)}
                                     >
                                         <SelectTrigger>
                                             <SelectValue placeholder="Select variant" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="false">No (Disabled)</SelectItem>
                                             <SelectItem value="true">Yes (Default)</SelectItem>
                                             {flag.variants.map((v: string) => (
                                                 <SelectItem key={v} value={v}>Variant: {v}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 )}
                                 
                                 <div className="flex gap-2 mt-1">
                                    {flag.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20">Globally Active</span>}
                                    {flag.percentage > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">{flag.percentage}% Rollout</span>}
                                 </div>
                             </div>
                         )
                    })}
                    {availableFlags.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No experiments available.</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                     <Button variant="outline" onClick={() => {
                        localStorage.removeItem("netgoat_experiments_ui");
                        setShowUI(false);
                     }}>
                        Disable Dev Mode
                     </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
