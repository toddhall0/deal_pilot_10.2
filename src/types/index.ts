// Common types used throughout the application

export type DealStatus = "active" | "pending" | "closed" | "cancelled" | "on_hold";

export type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type DocumentCategory =
  | "contract"
  | "amendment"
  | "addendum"
  | "financial"
  | "legal"
  | "inspection"
  | "environmental"
  | "title"
  | "survey"
  | "other";

export type UserRole = "admin" | "manager" | "analyst" | "viewer";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
