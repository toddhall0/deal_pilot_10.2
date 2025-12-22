"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, User, MoreHorizontal, Trash2, Pencil, Eye, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasks, useTaskMutations } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog, type TaskFormData } from "./task-dialog";
import type { TaskStatus, TaskPriority } from "@/types/prisma";

interface TasksTabProps {
  dealId: string;
}

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

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  BLOCKED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const TRANSACTION_STAGE_LABELS: Record<string, string> = {
  CONTRACT_NEGOTIATION: "Contract Negotiation",
  DUE_DILIGENCE: "Due Diligence",
  TITLE_SURVEY: "Title & Survey",
  FINANCING: "Financing",
  CLOSING: "Closing",
  POST_CLOSING: "Post-Closing",
  OTHER: "Other",
};

export function TasksTab({ dealId }: TasksTabProps) {
  const { data: tasks, isLoading } = useTasks(dealId);
  const { create, update, remove } = useTaskMutations(dealId);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleOpenView = (task: Task) => {
    setSelectedTask(task);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSave = async (data: TaskFormData) => {
    try {
      if (dialogMode === "create") {
        await create.mutateAsync({
          title: data.title,
          description: data.description || undefined,
          status: data.status,
          priority: data.priority,
          category: data.category || undefined,
          dueDate: data.dueDate || undefined,
          startDate: data.startDate || undefined,
          assigneeId: data.assigneeId || undefined,
          estimatedHours: data.estimatedHours,
        });
        toast({ title: "Success", description: "Task created successfully" });
      } else if (dialogMode === "edit" && selectedTask) {
        await update.mutateAsync({
          taskId: selectedTask.id,
          data: {
            title: data.title,
            description: data.description || undefined,
            status: data.status,
            priority: data.priority,
            category: data.category || undefined,
            dueDate: data.dueDate || undefined,
            startDate: data.startDate || undefined,
            assigneeId: data.assigneeId || undefined,
            estimatedHours: data.estimatedHours,
          },
        });
        toast({ title: "Success", description: "Task updated successfully" });
      }
      setDialogOpen(false);
      setSelectedTask(null);
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${dialogMode === "create" ? "create" : "update"} task`,
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      await update.mutateAsync({ taskId, data: { status: newStatus } });
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await remove.mutateAsync(taskId);
      toast({ title: "Success", description: "Task deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
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
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Manage tasks for this deal</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {!tasks || tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tasks yet. Create your first task to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleOpenView(task as Task)}
                >
                  <Checkbox
                    checked={task.status === "COMPLETED"}
                    onCheckedChange={() => {
                      handleToggleComplete(task.id, task.status);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-medium ${
                          task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      <Badge className={statusColors[task.status]} variant="secondary">
                        {task.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={priorityColors[task.priority]} variant="secondary">
                        {task.priority}
                      </Badge>
                      {task.category && (
                        <Badge variant="outline" className="text-xs">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          {TRANSACTION_STAGE_LABELS[task.category] || task.category}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.assignee.avatar || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {task.assignee.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {task.assignee.name}
                        </span>
                      )}
                      {task.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Created by: {task.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenView(task as Task);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(task as Task);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onSave={handleSave}
        isLoading={create.isPending || update.isPending}
        mode={dialogMode}
      />
    </>
  );
}
