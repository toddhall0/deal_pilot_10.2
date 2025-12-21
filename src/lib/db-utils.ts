import type { SortDirection, PaginatedResponse } from "@/types";

// Local type definitions for Prisma filter types
type QueryMode = "default" | "insensitive";

interface StringFilter {
  contains?: string;
  mode?: QueryMode;
  startsWith?: string;
  endsWith?: string;
  equals?: string;
}

interface DateTimeFilter {
  gte?: Date;
  lte?: Date;
  gt?: Date;
  lt?: Date;
  equals?: Date;
}

// ============================================
// PAGINATION UTILITIES
// ============================================

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function getPaginationParams(input: PaginationInput = {}) {
  const page = Math.max(1, input.page || 1);
  const limit = Math.min(100, Math.max(1, input.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ============================================
// SORTING UTILITIES
// ============================================

export interface SortInput<T extends string = string> {
  field: T;
  direction?: SortDirection;
}

export function getSortParams<T extends string>(
  input?: SortInput<T>,
  defaultField?: T,
  defaultDirection: SortDirection = "desc"
): { orderBy: Record<string, SortDirection> } {
  const field = input?.field || defaultField;
  const direction = input?.direction || defaultDirection;

  if (!field) {
    return { orderBy: { createdAt: "desc" } };
  }

  return { orderBy: { [field]: direction } };
}

// ============================================
// FILTER BUILDERS
// ============================================

export function buildSearchFilter(
  search: string | undefined,
  fields: string[]
): StringFilter | undefined {
  if (!search || search.trim() === "") return undefined;

  const searchTerm = search.trim();

  return {
    contains: searchTerm,
    mode: "insensitive" as QueryMode,
  };
}

export function buildSearchOrFilter(
  search: string | undefined,
  fields: string[]
): { OR: Record<string, StringFilter>[] } | undefined {
  if (!search || search.trim() === "") return undefined;

  const searchTerm = search.trim();

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: "insensitive" as QueryMode,
      },
    })),
  };
}

export function buildEnumFilter<T>(
  value: T | T[] | undefined
): T | { in: T[] } | undefined {
  if (value === undefined) return undefined;
  
  if (Array.isArray(value)) {
    return value.length > 0 ? { in: value } : undefined;
  }
  
  return value;
}

export function buildDateRangeFilter(
  from: Date | undefined,
  to: Date | undefined
): DateTimeFilter | undefined {
  if (!from && !to) return undefined;

  const filter: DateTimeFilter = {};

  if (from) filter.gte = from;
  if (to) filter.lte = to;

  return filter;
}

export function buildBooleanFilter(
  value: boolean | undefined
): boolean | undefined {
  return value;
}

// ============================================
// COMMON INCLUDES
// ============================================

export const dealIncludes = {
  minimal: {
    client: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
    _count: { select: { tasks: true, documents: true, notes: true } },
  },
  full: {
    client: true,
    createdBy: { select: { id: true, name: true, email: true, avatar: true } },
    transactionSummary: true,
    timeline: { include: { milestones: true } },
    financials: { include: { deposits: true, lineItems: true } },
    _count: { select: { tasks: true, documents: true, notes: true } },
  },
} as const;

export const taskIncludes = {
  minimal: {
    deal: { select: { id: true, name: true, dealNumber: true } },
    assignee: { select: { id: true, name: true, avatar: true } },
  },
  full: {
    deal: { select: { id: true, name: true, dealNumber: true } },
    assignee: { select: { id: true, name: true, email: true, avatar: true } },
    createdBy: { select: { id: true, name: true, email: true, avatar: true } },
    milestone: { select: { id: true, name: true } },
    checklists: { include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
    _count: { select: { subtasks: true, comments: true } },
  },
} as const;

export const documentIncludes = {
  minimal: {
    deal: { select: { id: true, name: true, dealNumber: true } },
    uploadedBy: { select: { id: true, name: true } },
  },
  full: {
    deal: { select: { id: true, name: true, dealNumber: true } },
    uploadedBy: { select: { id: true, name: true, email: true, avatar: true } },
    folder: { select: { id: true, name: true } },
  },
} as const;

export const noteIncludes = {
  minimal: {
    author: { select: { id: true, name: true, avatar: true } },
    deal: { select: { id: true, name: true } },
  },
  full: {
    author: { select: { id: true, name: true, email: true, avatar: true } },
    deal: { select: { id: true, name: true, dealNumber: true } },
  },
} as const;

export const userIncludes = {
  minimal: {
    firm: { select: { id: true, name: true } },
    client: { select: { id: true, name: true } },
  },
  full: {
    firm: true,
    client: true,
    preferences: true,
  },
} as const;

// ============================================
// DEAL NUMBER GENERATOR
// ============================================

export async function generateDealNumber(
  prisma: any,
  prefix: string = "DP"
): Promise<string> {
  const year = new Date().getFullYear();
  const yearPrefix = prefix + "-" + year + "-";
  
  // Find the highest deal number for this year
  const lastDeal = await prisma.deal.findFirst({
    where: {
      dealNumber: { startsWith: yearPrefix },
    },
    orderBy: { dealNumber: "desc" },
    select: { dealNumber: true },
  });

  let nextNumber = 1;
  
  if (lastDeal?.dealNumber) {
    const match = lastDeal.dealNumber.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return yearPrefix + nextNumber.toString().padStart(4, "0");
}

// ============================================
// SOFT DELETE UTILITIES
// ============================================

export function excludeDeleted<T extends { deletedAt?: Date | null }>(
  items: T[]
): T[] {
  return items.filter((item) => !item.deletedAt);
}

// ============================================
// TYPE SAFE OMIT
// ============================================

export function omitFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function omitPasswordHash<T extends { passwordHash?: string | null }>(
  user: T
): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
