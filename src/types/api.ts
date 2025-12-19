import type {
  User,
  Firm,
  Client,
  Deal,
  Task,
  Document,
  Note,
  Milestone,
  Timeline,
  TransactionSummary,
  DealFinancials,
  Notification,
  ActivityLog,
} from "@prisma/client";

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// ============================================
// USER RESPONSES
// ============================================

export type SafeUser = Omit<User, "passwordHash">;

export interface UserWithRelations extends SafeUser {
  firm?: Firm | null;
  client?: Client | null;
}

// ============================================
// DEAL RESPONSES
// ============================================

export interface DealWithRelations extends Deal {
  client: Client;
  createdBy: SafeUser;
  transactionSummary?: TransactionSummary | null;
  timeline?: TimelineWithMilestones | null;
  financials?: DealFinancials | null;
  _count?: {
    tasks: number;
    documents: number;
    notes: number;
  };
}

export interface DealListItem extends Deal {
  client: Pick<Client, "id" | "name">;
  createdBy: Pick<User, "id" | "name">;
  _count: {
    tasks: number;
    documents: number;
  };
}

export interface DealSummary {
  id: string;
  name: string;
  dealNumber: string;
  status: Deal["status"];
  clientName: string;
  propertyAddress?: string | null;
  closingDate?: Date | null;
  taskCount: number;
  completedTaskCount: number;
}

// ============================================
// TASK RESPONSES
// ============================================

export interface TaskWithRelations extends Task {
  deal: Pick<Deal, "id" | "name" | "dealNumber">;
  assignee?: SafeUser | null;
  createdBy: SafeUser;
  milestone?: Pick<Milestone, "id" | "name"> | null;
  subtasks?: Task[];
  checklists?: TaskChecklistWithItems[];
  _count?: {
    subtasks: number;
    comments: number;
  };
}

export interface TaskListItem extends Task {
  deal: Pick<Deal, "id" | "name" | "dealNumber">;
  assignee?: Pick<User, "id" | "name" | "avatar"> | null;
}

export interface TaskChecklistWithItems {
  id: string;
  name: string;
  sortOrder: number;
  items: {
    id: string;
    text: string;
    isCompleted: boolean;
    sortOrder: number;
  }[];
}

// ============================================
// DOCUMENT RESPONSES
// ============================================

export interface DocumentWithRelations extends Document {
  deal: Pick<Deal, "id" | "name" | "dealNumber">;
  uploadedBy: SafeUser;
  folder?: Pick<DocumentFolder, "id" | "name"> | null;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  children?: DocumentFolder[];
  documents?: Document[];
  _count?: {
    documents: number;
  };
}

// ============================================
// NOTE RESPONSES
// ============================================

export interface NoteWithRelations extends Note {
  author: SafeUser;
  deal: Pick<Deal, "id" | "name">;
}

// ============================================
// TIMELINE RESPONSES
// ============================================

export interface TimelineWithMilestones extends Timeline {
  milestones: MilestoneWithTasks[];
}

export interface MilestoneWithTasks extends Milestone {
  tasks?: Pick<Task, "id" | "title" | "status">[];
  children?: MilestoneWithTasks[];
}

// ============================================
// NOTIFICATION RESPONSES
// ============================================

export interface NotificationWithMeta extends Notification {
  entity?: {
    type: string;
    name?: string;
    link?: string;
  };
}

// ============================================
// ACTIVITY LOG RESPONSES
// ============================================

export interface ActivityLogWithUser extends ActivityLog {
  user?: Pick<User, "id" | "name" | "avatar"> | null;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  deals: {
    total: number;
    active: number;
    pendingClosing: number;
    closedThisMonth: number;
  };
  tasks: {
    total: number;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
  };
  documents: {
    total: number;
    uploadedThisWeek: number;
  };
  upcomingDeadlines: {
    id: string;
    name: string;
    dueDate: Date;
    type: "milestone" | "task";
    dealId: string;
    dealName: string;
  }[];
  recentActivity: ActivityLogWithUser[];
}

// ============================================
// API ERROR RESPONSE
// ============================================

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T = void> {
  success: true;
  data?: T;
  message?: string;
}
