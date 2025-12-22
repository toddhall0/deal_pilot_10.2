"use client";

import { useQuery } from "@tanstack/react-query";
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
  deal: {
    id: string;
    name: string;
    dealNumber: string;
  };
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  createdBy: { id: string; name: string };
  _count?: { subtasks: number; comments: number };
  createdAt: string;
  updatedAt: string;
}

interface UseAllTasksOptions {
  status?: string;
  priority?: string;
  limit?: number;
}

async function fetchAllTasks(options?: UseAllTasksOptions): Promise<Task[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.priority) params.set("priority", options.priority);
  if (options?.limit) params.set("limit", options.limit.toString());

  const query = params.toString();
  const url = `/api/tasks${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export function useAllTasks(options?: UseAllTasksOptions) {
  return useQuery({
    queryKey: ["all-tasks", options],
    queryFn: () => fetchAllTasks(options),
  });
}
