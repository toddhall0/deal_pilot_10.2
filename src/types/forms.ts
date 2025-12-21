import type {
  DealType,
  DealStatus,
  PropertyType,
  TaskStatus,
  TaskPriority,
  DocumentCategory,
  MilestoneStatus,
} from "@/types/prisma";

// ============================================
// DEAL FORM INPUTS
// ============================================

export interface DealCreateInput {
  name: string;
  type: DealType;
  clientId: string;
  propertyName?: string;
  propertyType?: PropertyType;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyCounty?: string;
  acreage?: number;
  squareFootage?: number;
  lotCount?: number;
  unitCount?: number;
}

export interface DealUpdateInput extends Partial<DealCreateInput> {
  status?: DealStatus;
  closedAt?: Date;
}

// ============================================
// TASK FORM INPUTS
// ============================================

export interface TaskCreateInput {
  dealId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
  startDate?: Date;
  assigneeId?: string;
  milestoneId?: string;
  parentId?: string;
  category?: string;
  tags?: string[];
  estimatedHours?: number;
}

export interface TaskUpdateInput extends Partial<Omit<TaskCreateInput, "dealId">> {
  completedAt?: Date;
  actualHours?: number;
}

export interface TaskChecklistInput {
  name: string;
  items: { text: string }[];
}

export interface TaskCommentInput {
  content: string;
}

// ============================================
// DOCUMENT FORM INPUTS
// ============================================

export interface DocumentUploadInput {
  dealId: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  subcategory?: string;
  folderId?: string;
  file: File;
}

export interface DocumentUpdateInput {
  name?: string;
  description?: string;
  category?: DocumentCategory;
  subcategory?: string;
  folderId?: string;
}

export interface DocumentFolderInput {
  dealId: string;
  name: string;
  description?: string;
  parentId?: string;
}

// ============================================
// NOTE FORM INPUTS
// ============================================

export interface NoteCreateInput {
  dealId: string;
  title?: string;
  content: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface NoteUpdateInput extends Partial<Omit<NoteCreateInput, "dealId">> {}

// ============================================
// MILESTONE FORM INPUTS
// ============================================

export interface MilestoneCreateInput {
  timelineId: string;
  name: string;
  description?: string;
  dueDate: Date;
  parentId?: string;
  reminderDays?: number[];
}

export interface MilestoneUpdateInput extends Partial<Omit<MilestoneCreateInput, "timelineId">> {
  status?: MilestoneStatus;
  completedDate?: Date;
}

// ============================================
// FINANCIAL FORM INPUTS
// ============================================

export interface DealFinancialsInput {
  dealId: string;
  contractPrice?: number;
  currentPrice?: number;
  dueDiligenceBudget?: number;
  dueDiligenceSpent?: number;
  estimatedClosingCosts?: number;
  actualClosingCosts?: number;
}

export interface DepositInput {
  name: string;
  amount: number;
  dueDate: Date;
  condition?: string;
  notes?: string;
}

export interface FinancialLineItemInput {
  category: string;
  name: string;
  description?: string;
  estimatedAmount?: number;
  actualAmount?: number;
  vendor?: string;
  invoiceNumber?: string;
  paidDate?: Date;
}

// ============================================
// USER PREFERENCES FORM INPUT
// ============================================

export interface UserPreferencesInput {
  emailNotifications?: boolean;
  taskReminders?: boolean;
  deadlineAlerts?: boolean;
  notificationFrequency?: "REALTIME" | "DAILY" | "WEEKLY" | "NONE";
  dailySummaryTime?: string;
  weeklySummaryDay?: number;
  defaultDealView?: "board" | "list" | "timeline";
  defaultTaskView?: "list" | "board" | "calendar";
  timezone?: string;
  dateFormat?: string;
}

// ============================================
// TRANSACTION SUMMARY INPUT
// ============================================

export interface TransactionSummaryInput {
  dealId: string;
  contractDate?: Date;
  effectiveDate?: Date;
  buyerName?: string;
  buyerEntity?: string;
  buyerAddress?: string;
  sellerName?: string;
  sellerEntity?: string;
  sellerAddress?: string;
  purchasePrice?: number;
  pricePerUnit?: number;
  priceAdjustable?: boolean;
  priceAdjustmentBasis?: string;
  initialDeposit?: number;
  initialDepositDue?: Date;
  feasibilityPeriodDays?: number;
  feasibilityExpiration?: Date;
  closingDate?: Date;
  outsideClosingDate?: Date;
  titleCompany?: string;
  escrowAgent?: string;
  surveyRequirements?: string;
  prorationDate?: Date;
}
