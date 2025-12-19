import { z } from "zod";

// ============================================
// NOTE SCHEMAS
// ============================================

export const noteCreateSchema = z.object({
  dealId: z.string().cuid("Invalid deal ID"),
  title: z.string().max(200).optional(),
  content: z.string().min(1, "Note content is required").max(50000),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPinned: z.boolean().default(false),
});

export const noteUpdateSchema = noteCreateSchema.partial().omit({ dealId: true });

export const noteFilterSchema = z.object({
  search: z.string().optional(),
  dealId: z.string().cuid().optional(),
  authorId: z.string().cuid().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
});

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
export type NoteFilterInput = z.infer<typeof noteFilterSchema>;
