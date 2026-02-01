"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ExternalLink, Info } from "lucide-react";

// Mock data for the sparklines
const data = [
  { val: 10 }, { val: 12 }, { val: 11 }, { val: 8 }, { val: 12 }, { val: 12 }
];

export default function CloudflareDashboard() {
  const [activeTab, setActiveTab] = useState("24h");
  
  return (
   <p>
    Coming soon!
   </p>
);
}