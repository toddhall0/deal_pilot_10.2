import { z } from "zod";

const DocumentCategoryValues = [
  "CONTRACT",
  "AMENDMENT",
  "DUE_DILIGENCE",
  "TITLE",
  "SURVEY",
  "ENVIRONMENTAL",
  "FINANCIAL",
  "LEGAL",
  "CORRESPONDENCE",
  "CLOSING",
  "OTHER",
] as const;

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const documentUploadSchema = z.object({
  dealId: z.string().cuid("Invalid deal ID"),
  name: z.string().min(1, "Document name is required").max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(DocumentCategoryValues).default("OTHER"),
  subcategory: z.string().max(100).optional(),
  folderId: z.string().cuid().optional().nullable(),
});

export const documentUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum(DocumentCategoryValues).optional(),
  subcategory: z.string().max(100).optional().nullable(),
  folderId: z.string().cuid().optional().nullable(),
});

export const documentFolderSchema = z.object({
  dealId: z.string().cuid("Invalid deal ID"),
  name: z.string().min(1, "Folder name is required").max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().cuid().optional().nullable(),
});

export const documentFilterSchema = z.object({
  search: z.string().optional(),
  category: z.union([z.enum(DocumentCategoryValues), z.array(z.enum(DocumentCategoryValues))]).optional(),
  dealId: z.string().cuid().optional(),
  folderId: z.string().cuid().optional().nullable(),
  uploadedById: z.string().cuid().optional(),
  fileType: z.string().optional(),
  isAnalyzed: z.boolean().optional(),
  isPrimaryContract: z.boolean().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentFolderInput = z.infer<typeof documentFolderSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
