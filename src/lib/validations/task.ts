import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

// ============================================
// TASK SCHEMAS
// ============================================

export const taskCreateSchema = z.object({
  dealId: z.string().cuid("Invalid deal ID"),
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  milestoneId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  estimatedHours: z.number().positive().max(9999).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().omit({ dealId: true }).extend({
  completedAt: z.coerce.date().optional().nullable(),
  actualHours: z.number().positive().max(9999).optional(),
});

export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.union([z.nativeEnum(TaskStatus), z.array(z.nativeEnum(TaskStatus))]).optional(),
  priority: z.union([z.nativeEnum(TaskPriority), z.array(z.nativeEnum(TaskPriority))]).optional(),
  dealId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  createdById: z.string().cuid().optional(),
  milestoneId: z.string().cuid().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  isOverdue: z.boolean().optional(),
  hasAssignee: z.boolean().optional(),
});

export const taskChecklistSchema = z.object({
  name: z.string().min(1, "Checklist name is required").max(100),
  items: z.array(z.object({
    text: z.string().min(1, "Item text is required").max(500),
  })).min(1, "At least one item is required"),
});

export const taskCommentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(5000),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type TaskChecklistInput = z.infer<typeof taskChecklistSchema>;
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
