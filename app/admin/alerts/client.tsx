"use client";

import { useState } from "react";
import { createAlert, toggleAlertActive, deleteAlert } from "@/actions/alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

export default function AlertsClient({ initialAlerts }: { initialAlerts: any[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: "",
    body: "",
    variant: "blue",
    actionText: "",
  });

  const handleCreate = async () => {
    try {
      await createAlert(newAlert);
      toast.success("Alert created successfully");
      setIsCreating(false);
      window.location.reload();
    } catch {
      toast.error("Failed to create alert");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleAlertActive(id, !currentActive);
      toast.success("Alert status updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteAlert(id);
      toast.success("Alert deleted");
      window.location.reload();
    } catch {
      toast.error("Failed to delete alert");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Alerts</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? "Cancel" : "Create Alert"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>New Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={newAlert.title} 
                onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                placeholder="Alert title..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Body</label>
              <Textarea 
                value={newAlert.body}
                onChange={(e) => setNewAlert({ ...newAlert, body: e.target.value })}
                placeholder="Details of the alert..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Variant</label>
                <Select 
                  value={newAlert.variant} 
                  onValueChange={(val) => setNewAlert({ ...newAlert, variant: val ?? "blue" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue (Info)</SelectItem>
                    <SelectItem value="yellow">Yellow (Warning)</SelectItem>
                    <SelectItem value="red">Red (Critical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Text (optional)</label>
                <Input 
                  value={newAlert.actionText} 
                  onChange={(e) => setNewAlert({ ...newAlert, actionText: e.target.value })}
                  placeholder="E.g., Read More"
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">Save Alert</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert._id}>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{alert.title}</h3>
                  <Badge variant={alert.variant === "red" ? "destructive" : alert.variant === "yellow" ? "outline" : "secondary"} className="capitalize">
                    {alert.variant}
                  </Badge>
                  {alert.actionText && (
                    <Badge variant="outline">Has Action: {alert.actionText}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={alert.active}
                    onCheckedChange={() => handleToggleActive(alert._id, alert.active)}
                  />
                  <span className="text-sm text-muted-foreground">{alert.active ? "Active" : "Inactive"}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(alert._id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && !isCreating && (
          <div className="py-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No alerts generated yet.
          </div>
        )}
      </div>
    </div>
  );
}