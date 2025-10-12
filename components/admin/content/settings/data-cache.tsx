"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageTitle } from "../../../SiteTitle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function SettingsGeneral() {
  const [mode, setMode] = useState("DNSOnly");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [brandName, setBrandName] = useState("Netgoat");
  const [timezone, setTimezone] = useState("UTC");

  const handleSave = () => toast.success("Settings saved successfully 🎉");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <PageTitle
        title="Data Cache"
        subtitle="Manage how caching works in Netgoat"
      />

    </div>
  );
}
