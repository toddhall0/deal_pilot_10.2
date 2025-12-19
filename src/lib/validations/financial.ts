import { z } from "zod";
import { DepositStatus } from "@prisma/client";

// ============================================
// FINANCIAL SCHEMAS
// ============================================

export const dealFinancialsSchema = z.object({
  dealId: z.string().cuid("Invalid deal ID"),
  contractPrice: z.number().positive().max(99999999999999).optional(),
  currentPrice: z.number().positive().max(99999999999999).optional(),
  dueDiligenceBudget: z.number().positive().max(99999999999999).optional(),
  dueDiligenceSpent: z.number().positive().max(99999999999999).optional(),
  estimatedClosingCosts: z.number().positive().max(99999999999999).optional(),
  actualClosingCosts: z.number().positive().max(99999999999999).optional(),
});

export const depositCreateSchema = z.object({
  name: z.string().min(1, "Deposit name is required").max(200),
  amount: z.number().positive("Amount must be positive").max(99999999999999),
  dueDate: z.coerce.date(),
  condition: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const depositUpdateSchema = depositCreateSchema.partial().extend({
  status: z.nativeEnum(DepositStatus).optional(),
  paidDate: z.coerce.date().optional().nullable(),
  paidAmount: z.number().positive().max(99999999999999).optional().nullable(),
});

export const financialLineItemSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  estimatedAmount: z.number().positive().max(99999999999999).optional(),
  actualAmount: z.number().positive().max(99999999999999).optional(),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  paidDate: z.coerce.date().optional().nullable(),
});

export type DealFinancialsInput = z.infer<typeof dealFinancialsSchema>;
export type DepositCreateInput = z.infer<typeof depositCreateSchema>;
export type DepositUpdateInput = z.infer<typeof depositUpdateSchema>;
export type FinancialLineItemInput = z.infer<typeof financialLineItemSchema>;
