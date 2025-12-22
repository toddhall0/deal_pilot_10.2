"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar as CalendarIcon, User, Clock, Flag, FolderOpen, FileText } from "lucide-react";
import { useTeam } from "@/hooks/use-team";
import type { TaskStatus, TaskPriority } from "@/types/prisma";

// Transaction stages/categories
const TRANSACTION_STAGES = [
  { value: "CONTRACT_NEGOTIATION", label: "Contract Negotiation" },
  { value: "DUE_DILIGENCE", label: "Due Diligence" },
  { value: "TITLE_SURVEY", label: "Title & Survey" },
  { value: "FINANCING", label: "Financing" },
  { value: "CLOSING", label: "Closing" },
  { value: "POST_CLOSING", label: "Post-Closing" },
  { value: "OTHER", label: "Other" },
] as const;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800" },
];

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  completedAt?: string | null;
  estimatedHours?: number | null;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (data: TaskFormData) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit" | "view";
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  dueDate?: string;
  startDate?: string;
  assigneeId?: string | null;
  estimatedHours?: number;
}

// Helper to parse date string to Date object
function parseDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

// Helper to format Date to ISO string for API
function formatDateForApi(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return format(date, "yyyy-MM-dd");
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  isLoading,
  mode,
}: TaskDialogProps) {
  const { data: teamMembers = [] } = useTeam();
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    category: "",
    dueDate: "",
    startDate: "",
    assigneeId: null,
    estimatedHours: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Date state for the date pickers
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        category: task.category || "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        startDate: task.startDate ? task.startDate.split("T")[0] : "",
        assigneeId: task.assignee?.id || null,
        estimatedHours: task.estimatedHours || undefined,
      });
      setStartDate(parseDate(task.startDate));
      setDueDate(parseDate(task.dueDate));
    } else {
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        category: "",
        dueDate: "",
        startDate: "",
        assigneeId: null,
        estimatedHours: undefined,
      });
      setStartDate(undefined);
      setDueDate(undefined);
    }
  }, [task, open]);

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setFormData({ ...formData, startDate: formatDateForApi(date) || "" });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    setFormData({ ...formData, dueDate: formatDateForApi(date) || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isViewMode = mode === "view";
  const dialogTitle = mode === "create" ? "Create Task" : mode === "edit" ? "Edit Task" : "Task Details";
  const isSubmitting = isLoading || isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {mode === "create" && (
              <DialogDescription>
                Create a new task and assign it to a team member
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              {isViewMode ? (
                <p className="text-lg font-medium">{formData.title}</p>
              ) : (
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              )}
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isViewMode ? (
                  <Badge variant="secondary">
                    {STATUS_OPTIONS.find((s) => s.value === formData.status)?.label}
                  </Badge>
                ) : (
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                {isViewMode ? (
                  <Badge className={PRIORITY_OPTIONS.find((p) => p.value === formData.priority)?.color}>
                    {PRIORITY_OPTIONS.find((p) => p.value === formData.priority)?.label}
                  </Badge>
                ) : (
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Flag className={`h-3 w-3 ${option.value === "URGENT" ? "text-red-500" : option.value === "HIGH" ? "text-orange-500" : option.value === "MEDIUM" ? "text-yellow-500" : "text-gray-400"}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Transaction Stage */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Transaction Stage
              </Label>
              {isViewMode ? (
                <p className="font-medium">
                  {TRANSACTION_STAGES.find((s) => s.value === formData.category)?.label || "Not specified"}
                </p>
              ) : (
                <Select
                  value={formData.category || ""}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </Label>
              {isViewMode ? (
                task?.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignee.avatar || undefined} />
                      <AvatarFallback>
                        {task.assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{task.assignee.name}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )
              ) : (
                <Select
                  value={formData.assigneeId || "unassigned"}
                  onValueChange={(v) => setFormData({ ...formData, assigneeId: v === "unassigned" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          {member.title && (
                            <span className="text-muted-foreground text-xs">({member.title})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Start Date
                </Label>
                {isViewMode ? (
                  <p className="font-medium">
                    {startDate
                      ? format(startDate, "PPP")
                      : "Not set"}
                  </p>
                ) : (
                  <DatePicker
                    date={startDate}
                    onDateChange={handleStartDateChange}
                    placeholder="Select start date"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Due Date
                </Label>
                {isViewMode ? (
                  <p className="font-medium">
                    {dueDate
                      ? format(dueDate, "PPP")
                      : "Not set"}
                  </p>
                ) : (
                  <DatePicker
                    date={dueDate}
                    onDateChange={handleDueDateChange}
                    placeholder="Select due date"
                  />
                )}
              </div>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated Hours
              </Label>
              {isViewMode ? (
                <p className="font-medium">
                  {formData.estimatedHours ? `${formData.estimatedHours} hours` : "Not estimated"}
                </p>
              ) : (
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Enter estimated hours"
                />
              )}
            </div>

            {/* Description/Notes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description / Notes
              </Label>
              {isViewMode ? (
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                  {formData.description || "No description provided"}
                </p>
              ) : (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add task description, notes, or instructions..."
                  rows={4}
                />
              )}
            </div>

            {/* Task Metadata (View Mode Only) */}
            {isViewMode && task && (
              <>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created by</span>
                    <span className="font-medium">{task.createdBy.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created on</span>
                    <span className="font-medium">
                      {new Date(task.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completed on</span>
                      <span className="font-medium">
                        {new Date(task.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {isViewMode ? (
              <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
                  {isSubmitting ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
