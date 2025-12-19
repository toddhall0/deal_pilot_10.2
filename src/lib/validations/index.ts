// Export all validation schemas and types
export * from "./auth";
export * from "./deal";
export * from "./task";
export * from "./document";
export * from "./note";
export * from "./milestone";
export * from "./financial";

// Common validation helpers
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().cuid("Invalid ID"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
