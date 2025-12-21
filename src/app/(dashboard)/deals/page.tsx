"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useDeals, useDealStats, useDealMutations } from "@/hooks/use-deals";
import { useDealStore } from "@/stores/deal-store";
import {
  DealTable,
  DealCard,
  DealFilters,
  DealEmptyState,
  DealTableSkeleton,
  DealCardGridSkeleton,
  DealViewToggle,
  DealPagination,
} from "@/components/deals";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { DealStatus, PropertyType } from "@prisma/client";

export default function DealsPage() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    viewMode,
    setViewMode,
    filters,
    setFilter,
    clearFilters,
    page,
    limit,
    setPage,
    setLimit,
    sortField,
    sortOrder,
    setSort,
    selectedDeals,
    toggleDealSelection,
    selectAllDeals,
  } = useDealStore();

  const { data, isLoading, error } = useDeals({
    filters,
    page,
    limit,
    sortField,
    sortOrder,
  });

  const { data: stats } = useDealStats();
  const { deleteDeal } = useDealMutations();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDeal.mutateAsync(deleteId);
      toast({
        title: "Deal deleted",
        description: "The deal has been successfully deleted.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete deal",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = (value: DealStatus | null) => {
    setFilter("status", value ? [value] : []);
  };

  const handlePropertyTypeChange = (value: PropertyType | null) => {
    setFilter("propertyType", value ? [value] : []);
  };

  const deals = data?.deals || [];
  const total = data?.pagination?.total || 0;
  const hasFilters = Boolean(filters.search) || filters.status.length > 0 || filters.propertyType.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your commercial real estate transactions
          </p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Closing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingClosing || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Closed This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closedThisMonth || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DealFilters
          search={filters.search}
          onSearchChange={(value) => setFilter("search", value)}
          status={filters.status}
          onStatusChange={handleStatusChange}
          propertyType={filters.propertyType}
          onPropertyTypeChange={handlePropertyTypeChange}
          onClear={clearFilters}
        />
        <DealViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <div className="text-center text-destructive">
              <p>Failed to load deals</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        viewMode === "table" ? (
          <DealTableSkeleton />
        ) : (
          <DealCardGridSkeleton />
        )
      ) : deals.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <DealEmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <>
          <DealTable
            deals={deals}
            selectedDeals={selectedDeals}
            onSelectDeal={toggleDealSelection}
            onSelectAll={selectAllDeals}
            onSort={setSort}
            sortField={sortField}
            sortOrder={sortOrder}
            onDelete={setDeleteId}
          />
          <DealPagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      ) : viewMode === "card" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal: typeof deals[0]) => (
              <DealCard key={deal.id} deal={deal} onDelete={setDeleteId} />
            ))}
          </div>
          <DealPagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      ) : (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center text-muted-foreground">
            Board view coming soon
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
              All associated tasks, documents, and notes will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
