// Re-export all Prisma types
export type {
  User,
  Firm,
  Client,
  ClientUser,
  Deal,
  TransactionSummary,
  Timeline,
  Milestone,
  Task,
  TaskChecklist,
  TaskChecklistItem,
  TaskComment,
  Document,
  DocumentFolder,
  Note,
  DealFinancials,
  Deposit,
  FinancialLineItem,
  UserPreferences,
  Notification,
  ReportTemplate,
  SavedReport,
  ActivityLog,
} from "@prisma/client";

// Re-export all enums
export {
  UserRole,
  UserStatus,
  DealType,
  DealStatus,
  PropertyType,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  DocumentCategory,
  DepositStatus,
  NotificationFrequency,
} from "@prisma/client";

// Re-export derived types
export * from "./api";
export * from "./forms";
export * from "./filters";
