// Local type definitions for Prisma types
// These match the Prisma schema enums and are used when @prisma/client types aren't available

export type DealType =
  | "ACQUISITION"
  | "DISPOSITION";

export type DealStatus =
  | "DRAFT"
  | "ACTIVE"
  | "UNDER_CONTRACT"
  | "IN_DUE_DILIGENCE"
  | "PENDING_CLOSING"
  | "CLOSED"
  | "TERMINATED"
  | "ON_HOLD";

export type PropertyType =
  | "OFFICE"
  | "RETAIL"
  | "INDUSTRIAL"
  | "MULTIFAMILY"
  | "MIXED_USE"
  | "LAND"
  | "HOSPITALITY"
  | "HEALTHCARE"
  | "SELF_STORAGE"
  | "DATA_CENTER"
  | "OTHER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type DocumentCategory =
  | "CONTRACT"
  | "AMENDMENT"
  | "DUE_DILIGENCE"
  | "TITLE"
  | "SURVEY"
  | "ENVIRONMENTAL"
  | "FINANCIAL"
  | "LEGAL"
  | "CORRESPONDENCE"
  | "CLOSING"
  | "OTHER";

export type MilestoneStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "WAIVED"
  | "NOT_APPLICABLE";

export type DepositStatus =
  | "SCHEDULED"
  | "DUE"
  | "PAID"
  | "APPLIED_TO_PURCHASE"
  | "REFUNDED"
  | "FORFEITED";

export type UserRole =
  | "ADMIN"
  | "ATTORNEY"
  | "CLIENT";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING";

export type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "UPLOADED"
  | "DOWNLOADED"
  | "COMMENTED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "COMPLETED";

export type NotificationType =
  | "TASK_DUE"
  | "TASK_ASSIGNED"
  | "MILESTONE_DUE"
  | "DOCUMENT_UPLOADED"
  | "DEAL_STATUS_CHANGED"
  | "MENTION"
  | "SYSTEM";
