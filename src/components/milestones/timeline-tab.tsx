"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
import { useMilestones, useMilestoneMutations } from "@/hooks/use-milestones";
import { useToast } from "@/hooks/use-toast";
import type { MilestoneStatus } from "@/types/prisma";

interface TimelineTabProps {
  dealId: string;
}

const statusConfig: Record<MilestoneStatus, { icon: typeof Circle; color: string; label: string }> = {
  PENDING: { icon: Circle, color: "text-gray-400", label: "Pending" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500", label: "In Progress" },
  COMPLETED: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  MISSED: { icon: AlertCircle, color: "text-red-500", label: "Missed" },
  WAIVED: { icon: Circle, color: "text-gray-300", label: "Waived" },
  NOT_APPLICABLE: { icon: Circle, color: "text-gray-300", label: "N/A" },
};

export function TimelineTab({ dealId }: TimelineTabProps) {
  const { data, isLoading } = useMilestones(dealId);
  const { create, update } = useMilestoneMutations(dealId);
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    description: "",
    dueDate: "",
  });

  const handleCreate = async () => {
    if (!newMilestone.name.trim() || !newMilestone.dueDate) {
      toast({ title: "Error", description: "Name and due date are required", variant: "destructive" });
      return;
    }

    try {
      await create.mutateAsync({
        name: newMilestone.name,
        description: newMilestone.description || undefined,
        dueDate: newMilestone.dueDate,
      });
      toast({ title: "Success", description: "Milestone created successfully" });
      setShowCreateDialog(false);
      setNewMilestone({ name: "", description: "", dueDate: "" });
    } catch {
      toast({ title: "Error", description: "Failed to create milestone", variant: "destructive" });
    }
  };

  const handleStatusChange = async (milestoneId: string, status: MilestoneStatus) => {
    try {
      await update.mutateAsync({ milestoneId, data: { status } });
      toast({ title: "Success", description: "Milestone updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update milestone", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const milestones = data?.milestones || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Key milestones and deadlines</CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
              <DialogDescription>Add a key date or deadline to the timeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="e.g., Due Diligence Deadline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create Milestone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No timeline milestones defined yet. Add key dates to track progress.
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const config = statusConfig[milestone.status];
                const StatusIcon = config.icon;
                const isPast = new Date(milestone.dueDate) < new Date();
                const isOverdue = isPast && milestone.status !== "COMPLETED" && milestone.status !== "WAIVED" && milestone.status !== "NOT_APPLICABLE";

                return (
                  <div key={milestone.id} className="relative pl-10">
                    {/* Status icon */}
                    <div className={`absolute left-0 p-1 bg-background rounded-full ${config.color}`}>
                      <StatusIcon className="h-6 w-6" />
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{milestone.name}</h4>
                            <Badge variant={isOverdue ? "destructive" : "secondary"}>
                              {config.label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(milestone.dueDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <Select
                          value={milestone.status}
                          onValueChange={(v) => handleStatusChange(milestone.id, v as MilestoneStatus)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="MISSED">Missed</SelectItem>
                            <SelectItem value="WAIVED">Waived</SelectItem>
                            <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {milestone.tasks && milestone.tasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Related Tasks ({milestone.tasks.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.tasks.map((task) => (
                              <Badge key={task.id} variant="outline" className="text-xs">
                                {task.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
