import { z } from "zod";
import {
  DealType,
  DealStatus,
  PropertyType,
} from "@prisma/client";

// ============================================
// DEAL SCHEMAS
// ============================================

export const dealCreateSchema = z.object({
  name: z.string().min(1, "Deal name is required").max(200),
  type: z.nativeEnum(DealType),
  clientId: z.string().cuid("Invalid client ID"),
  propertyName: z.string().max(200).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
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
  status: z.nativeEnum(DealStatus).optional(),
  closedAt: z.coerce.date().optional(),
});

export const dealFilterSchema = z.object({
  search: z.string().optional(),
  status: z.union([z.nativeEnum(DealStatus), z.array(z.nativeEnum(DealStatus))]).optional(),
  type: z.nativeEnum(DealType).optional(),
  propertyType: z.union([z.nativeEnum(PropertyType), z.array(z.nativeEnum(PropertyType))]).optional(),
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
