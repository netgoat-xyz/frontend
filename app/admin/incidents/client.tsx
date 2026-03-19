"use client";

import { useState } from "react";
import { createIncident, updateIncidentStarted, deleteIncident } from "@/actions/incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentSeverity = "minor" | "major" | "critical";

interface IncidentItem {
  _id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  active: boolean;
  createdAt: string;
}

export default function IncidentsClient({ initialIncidents }: { initialIncidents: IncidentItem[] }) {
  const t = useTranslations("DashboardPages.admin.incidents");
  const [incidents] = useState<IncidentItem[]>(initialIncidents);
  const [isCreating, setIsCreating] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    status: "investigating",
    severity: "minor",
  });

  const handleCreate = async () => {
    try {
      await createIncident(newIncident);
      toast.success(t("toasts.createSuccess"));
      setIsCreating(false);
      window.location.reload();
    } catch {
      toast.error(t("toasts.createFailed"));
    }
  };

  const handleUpdate = async (id: string, updates: { status: IncidentStatus }) => {
    try {
      await updateIncidentStarted(id, updates);
      toast.success(t("toasts.updateSuccess"));
      window.location.reload();
    } catch {
      toast.error(t("toasts.updateFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteIncident(id);
      toast.success(t("toasts.deleteSuccess"));
      window.location.reload();
    } catch {
      toast.error(t("toasts.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? t("actions.cancel") : t("actions.postIncident")}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{t("newIncident.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.title")}</label>
              <Input 
                value={newIncident.title} 
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                placeholder={t("fields.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.description")}</label>
              <Textarea 
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder={t("fields.descriptionPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("fields.status")}</label>
                <Select 
                  value={newIncident.status ?? "investigating"} 
                  onValueChange={(val) => setNewIncident({ ...newIncident, status: val ?? "investigating" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">{t("statuses.investigating")}</SelectItem>
                    <SelectItem value="identified">{t("statuses.identified")}</SelectItem>
                    <SelectItem value="monitoring">{t("statuses.monitoring")}</SelectItem>
                    <SelectItem value="resolved">{t("statuses.resolved")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("fields.severity")}</label>
                <Select value={newIncident.severity} onValueChange={(val) => setNewIncident({ ...newIncident, severity: val ?? "minor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">{t("severity.minor")}</SelectItem>
                    <SelectItem value="major">{t("severity.major")}</SelectItem>
                    <SelectItem value="critical">{t("severity.critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">{t("actions.createAnnouncement")}</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {incidents.map((inc) => (
          <Card key={inc._id}>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{inc.title}</h3>
                  {inc.active ? (
                    <Badge variant="destructive">{t("badges.active")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("badges.resolved")}</Badge>
                  )}
                  <Badge variant="outline" className="capitalize">{t(`statuses.${inc.status}`)}</Badge>
                  <Badge variant="outline" className="capitalize">{t("severityBadge", { severity: t(`severity.${inc.severity}`) })}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("started", { date: new Date(inc.createdAt).toLocaleString() })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inc.active && (
                  <Select 
                    value={inc.status} 
                    onValueChange={(val) => handleUpdate(inc._id, { status: (val ?? "investigating") as IncidentStatus })}
                  >
                    <SelectTrigger className="w-35"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating">{t("statuses.investigating")}</SelectItem>
                      <SelectItem value="identified">{t("statuses.identified")}</SelectItem>
                      <SelectItem value="monitoring">{t("statuses.monitoring")}</SelectItem>
                      <SelectItem value="resolved">{t("statuses.markResolved")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(inc._id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {incidents.length === 0 && !isCreating && (
          <div className="py-8 text-center text-muted-foreground border rounded-lg border-dashed">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
