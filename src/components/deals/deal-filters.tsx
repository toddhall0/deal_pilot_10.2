"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { DealStatus, PropertyType } from "@prisma/client";

interface DealFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: DealStatus[];
  onStatusChange: (value: DealStatus | null) => void;
  propertyType: PropertyType[];
  onPropertyTypeChange: (value: PropertyType | null) => void;
  onClear: () => void;
}

const statusOptions: { value: DealStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "UNDER_CONTRACT", label: "Under Contract" },
  { value: "IN_DUE_DILIGENCE", label: "Due Diligence" },
  { value: "PENDING_CLOSING", label: "Pending Closing" },
  { value: "CLOSED", label: "Closed" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ON_HOLD", label: "On Hold" },
];

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MULTIFAMILY", label: "Multifamily" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "LAND", label: "Land" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "SELF_STORAGE", label: "Self Storage" },
  { value: "DATA_CENTER", label: "Data Center" },
  { value: "OTHER", label: "Other" },
];

export function DealFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  propertyType,
  onPropertyTypeChange,
  onClear,
}: DealFiltersProps) {
  const hasFilters = search || status.length > 0 || propertyType.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status[0] || ""}
        onValueChange={(value) => onStatusChange(value as DealStatus || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={propertyType[0] || ""}
        onValueChange={(value) => onPropertyTypeChange(value as PropertyType || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Property Type" />
        </SelectTrigger>
        <SelectContent>
          {propertyTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
