"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DealFilters } from "@/types/filters";

interface DealListParams {
  filters?: DealFilters;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchDeals(params: DealListParams) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortField) searchParams.set("sortField", params.sortField);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  
  if (params.filters) {
    if (params.filters.status) {
      const statuses = Array.isArray(params.filters.status) 
        ? params.filters.status.join(",") 
        : params.filters.status;
      searchParams.set("status", statuses);
    }
    if (params.filters.clientId) searchParams.set("clientId", params.filters.clientId);
    if (params.filters.type) searchParams.set("type", params.filters.type);
    if (params.filters.propertyType) {
      const types = Array.isArray(params.filters.propertyType)
        ? params.filters.propertyType.join(",")
        : params.filters.propertyType;
      searchParams.set("propertyType", types);
    }
    if (params.filters.search) searchParams.set("search", params.filters.search);
  }

  const url = "/api/deals?" + searchParams.toString();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch deals");
  }
  return response.json();
}

export function useDeals(params: DealListParams = {}) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: () => fetchDeals(params),
  });
}

async function fetchDeal(id: string) {
  const response = await fetch("/api/deals/" + id);
  if (!response.ok) {
    throw new Error("Failed to fetch deal");
  }
  return response.json();
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: () => fetchDeal(id),
    enabled: !!id,
  });
}

async function fetchDealStats() {
  const response = await fetch("/api/deals/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch deal stats");
  }
  return response.json();
}

export function useDealStats() {
  return useQuery({
    queryKey: ["dealStats"],
    queryFn: fetchDealStats,
  });
}

export function useDealMutations() {
  const queryClient = useQueryClient();

  const createDeal = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create deal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dealStats"] });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch("/api/deals/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update deal");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dealStats"] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/deals/" + id, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete deal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dealStats"] });
    },
  });

  return { createDeal, updateDeal, deleteDeal };
}
