"use client";

import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

interface DealEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function DealEmptyState({ hasFilters, onClearFilters }: DealEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No deals found</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Try adjusting your filters to find what you're looking for.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No deals yet</h3>
      <p className="text-muted-foreground mt-1 mb-4">
        Get started by creating your first deal.
      </p>
      <Button asChild>
        <Link href="/deals/new">
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Link>
      </Button>
    </div>
  );
}
