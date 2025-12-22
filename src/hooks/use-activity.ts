"use client";

import { useQuery } from "@tanstack/react-query";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string | null;
  changes?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

interface PaginatedActivityResponse {
  data: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

async function fetchActivity(dealId: string, limit = 10): Promise<PaginatedActivityResponse> {
  const res = await fetch(`/api/deals/${dealId}/activity?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

export function useActivity(dealId: string, limit = 10) {
  return useQuery({
    queryKey: ["activity", dealId, limit],
    queryFn: () => fetchActivity(dealId, limit),
    enabled: !!dealId,
  });
}
