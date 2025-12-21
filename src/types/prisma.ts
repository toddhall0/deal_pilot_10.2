// Local type definitions for Prisma types
// These match the Prisma schema enums and are used when @prisma/client types aren't available

export type DealType =
  | "ACQUISITION"
  | "DISPOSITION"
  | "LEASE"
  | "DEVELOPMENT"
  | "FINANCING"
  | "JOINT_VENTURE"
  | "OTHER";

export type DealStatus =
  | "PROSPECT"
  | "ACTIVE"
  | "UNDER_CONTRACT"
  | "DUE_DILIGENCE"
  | "CLOSING"
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
  | "PENDING"
  | "IN_PROGRESS"
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
  | "MISSED";

export type DepositStatus =
  | "PENDING"
  | "RECEIVED"
  | "RELEASED"
  | "REFUNDED";

export type UserRole =
  | "ADMIN"
  | "PARTNER"
  | "ASSOCIATE"
  | "PARALEGAL"
  | "ASSISTANT"
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
