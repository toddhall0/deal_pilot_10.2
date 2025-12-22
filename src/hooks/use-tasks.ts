"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus, TaskPriority } from "@/types/prisma";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
  completedAt?: string | null;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  createdBy: { id: string; name: string };
  subtasks?: Task[];
  _count?: { subtasks: number; comments: number };
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  assigneeId?: string | null;
  milestoneId?: string | null;
}

interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completedAt?: string | null;
}

async function fetchTasks(dealId: string): Promise<Task[]> {
  const res = await fetch(`/api/deals/${dealId}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function createTask(dealId: string, data: CreateTaskInput): Promise<Task> {
  const res = await fetch(`/api/deals/${dealId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

async function updateTask(dealId: string, taskId: string, data: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

async function deleteTask(dealId: string, taskId: string): Promise<void> {
  const res = await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

export function useTasks(dealId: string) {
  return useQuery({
    queryKey: ["tasks", dealId],
    queryFn: () => fetchTasks(dealId),
    enabled: !!dealId,
  });
}

export function useTaskMutations(dealId: string) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: CreateTaskInput) => createTask(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    },
  });

  const update = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskInput }) =>
      updateTask(dealId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", dealId] });
    },
  });

  const remove = useMutation({
    mutationFn: (taskId: string) => deleteTask(dealId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    },
  });

  return { create, update, remove };
}
