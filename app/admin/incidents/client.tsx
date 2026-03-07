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
import { PlusCircle, Trash2, Edit2 } from "lucide-react";

export default function IncidentsClient({ initialIncidents }: { initialIncidents: any[] }) {
  const [incidents, setIncidents] = useState(initialIncidents);
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
      toast.success("Incident created");
      setIsCreating(false);
      window.location.reload();
    } catch {
      toast.error("Failed to create incident");
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await updateIncidentStarted(id, updates);
      toast.success("Incident updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update incident");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteIncident(id);
      toast.success("Incident deleted");
      window.location.reload();
    } catch {
      toast.error("Failed to delete incident");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Incident Announcements</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? "Cancel" : "Post Incident"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>New Incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={newIncident.title} 
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                placeholder="E.g. API taking longer than expected"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="What is going on?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={newIncident.status ?? "investigating"} 
                  onValueChange={(val) => setNewIncident({ ...newIncident, status: val ?? "investigating" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select value={newIncident.severity} onValueChange={(val) => setNewIncident({ ...newIncident, severity: val ?? "minor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Announcement</Button>
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
                    <Badge variant="destructive">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Resolved</Badge>
                  )}
                  <Badge variant="outline" className="capitalize">{inc.status}</Badge>
                  <Badge variant="outline" className="capitalize">{inc.severity} Severity</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Started: {new Date(inc.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inc.active && (
                  <Select 
                    value={inc.status} 
                    onValueChange={(val) => handleUpdate(inc._id, { status: val })}
                  >
                    <SelectTrigger className="w-35"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="resolved">Mark Resolved</SelectItem>
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
            No incidents reported yet.
          </div>
        )}
      </div>
    </div>
  );
}
