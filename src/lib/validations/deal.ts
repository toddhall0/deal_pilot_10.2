import { z } from "zod";

// Define enum values as const arrays for use with z.enum()
const DealTypeValues = [
  "ACQUISITION",
  "DISPOSITION",
  "LEASE",
  "DEVELOPMENT",
  "FINANCING",
  "JOINT_VENTURE",
  "OTHER",
] as const;

const DealStatusValues = [
  "PROSPECT",
  "ACTIVE",
  "UNDER_CONTRACT",
  "DUE_DILIGENCE",
  "CLOSING",
  "CLOSED",
  "TERMINATED",
  "ON_HOLD",
] as const;

const PropertyTypeValues = [
  "OFFICE",
  "RETAIL",
  "INDUSTRIAL",
  "MULTIFAMILY",
  "MIXED_USE",
  "LAND",
  "HOSPITALITY",
  "HEALTHCARE",
  "SELF_STORAGE",
  "DATA_CENTER",
  "OTHER",
] as const;

// ============================================
// DEAL SCHEMAS
// ============================================

export const dealCreateSchema = z.object({
  name: z.string().min(1, "Deal name is required").max(200),
  type: z.enum(DealTypeValues),
  clientId: z.string().cuid("Invalid client ID"),
  propertyName: z.string().max(200).optional(),
  propertyType: z.enum(PropertyTypeValues).optional(),
  propertyAddress: z.string().max(500).optional(),
  propertyCity: z.string().max(100).optional(),
  propertyState: z.string().max(50).optional(),
  propertyZip: z.string().max(20).optional(),
  propertyCounty: z.string().max(100).optional(),
  acreage: z.number().positive().optional(),
  squareFootage: z.number().positive().optional(),
  lotCount: z.number().int().positive().optional(),
  unitCount: z.number().int().positive().optional(),
  assessorPin: z.string().max(100).optional(),
  assessorReportUrl: z.string().url().optional().or(z.literal("")),
  propertyImageUrl: z.string().url().optional().or(z.literal("")),
});

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  status: z.enum(DealStatusValues).optional(),
  closedAt: z.coerce.date().optional(),
});

export const dealFilterSchema = z.object({
  search: z.string().optional(),
  status: z.union([z.enum(DealStatusValues), z.array(z.enum(DealStatusValues))]).optional(),
  type: z.enum(DealTypeValues).optional(),
  propertyType: z.union([z.enum(PropertyTypeValues), z.array(z.enum(PropertyTypeValues))]).optional(),
  clientId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),
  propertyState: z.string().optional(),
  propertyCity: z.string().optional(),
  closingDateFrom: z.coerce.date().optional(),
  closingDateTo: z.coerce.date().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
});

export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;
