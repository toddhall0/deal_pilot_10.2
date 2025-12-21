import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DealStatus, DealType, PropertyType } from "@/types/prisma";

type ViewMode = "table" | "card" | "board";

interface DealFiltersState {
  status: DealStatus[];
  type?: DealType;
  propertyType: PropertyType[];
  clientId?: string;
  search: string;
}

interface DealStore {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Filter state
  filters: DealFiltersState;
  setFilter: <K extends keyof DealFiltersState>(key: K, value: DealFiltersState[K]) => void;
  clearFilters: () => void;

  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Sorting
  sortField: string;
  sortOrder: "asc" | "desc";
  setSort: (field: string, order?: "asc" | "desc") => void;

  // Selection
  selectedDeals: string[];
  toggleDealSelection: (id: string) => void;
  selectAllDeals: (ids: string[]) => void;
  clearSelection: () => void;
}

const defaultFilters: DealFiltersState = {
  status: [],
  type: undefined,
  propertyType: [],
  clientId: undefined,
  search: "",
};

export const useDealStore = create<DealStore>()(
  persist(
    (set) => ({
      // View state
      viewMode: "table",
      setViewMode: (mode) => set({ viewMode: mode }),

      // Filter state
      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
          page: 1, // Reset to first page on filter change
        })),
      clearFilters: () => set({ filters: defaultFilters, page: 1 }),

      // Pagination
      page: 1,
      limit: 20,
      setPage: (page) => set({ page }),
      setLimit: (limit) => set({ limit, page: 1 }),

      // Sorting
      sortField: "createdAt",
      sortOrder: "desc",
      setSort: (field, order) =>
        set((state) => ({
          sortField: field,
          sortOrder: order || (state.sortField === field && state.sortOrder === "asc" ? "desc" : "asc"),
        })),

      // Selection
      selectedDeals: [],
      toggleDealSelection: (id) =>
        set((state) => ({
          selectedDeals: state.selectedDeals.includes(id)
            ? state.selectedDeals.filter((dealId) => dealId !== id)
            : [...state.selectedDeals, id],
        })),
      selectAllDeals: (ids) => set({ selectedDeals: ids }),
      clearSelection: () => set({ selectedDeals: [] }),
    }),
    {
      name: "deal-store",
      partialize: (state) => ({
        viewMode: state.viewMode,
        limit: state.limit,
        sortField: state.sortField,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
