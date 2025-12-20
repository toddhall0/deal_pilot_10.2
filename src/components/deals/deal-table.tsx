"use client";

import Link from "next/link";
import { DealStatusBadge } from "./deal-status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import type { DealStatus, DealType, PropertyType } from "@prisma/client";

interface Deal {
  id: string;
  name: string;
  dealNumber: string;
  status: DealStatus;
  type: DealType;
  propertyType: PropertyType | null;
  propertyCity: string | null;
  propertyState: string | null;
  client: { id: string; name: string };
  _count: { tasks: number; documents: number };
  createdAt: string | Date;
}

interface DealTableProps {
  deals: Deal[];
  selectedDeals: string[];
  onSelectDeal: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DealTable({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onSort,
  sortField,
  sortOrder,
  onEdit,
  onDelete,
}: DealTableProps) {
  const allSelected = deals.length > 0 && deals.every((d) => selectedDeals.includes(d.id));

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=active]:text-primary"
      data-state={sortField === field ? "active" : undefined}
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll(deals.map((d) => d.id));
                  } else {
                    onSelectAll([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>
              <SortableHeader field="dealNumber">Deal #</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="name">Name</SortableHeader>
            </TableHead>
            <TableHead>Client</TableHead>
            <TableHead>
              <SortableHeader field="status">Status</SortableHeader>
            </TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>
              <SortableHeader field="createdAt">Created</SortableHeader>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell>
                <Checkbox
                  checked={selectedDeals.includes(deal.id)}
                  onCheckedChange={() => onSelectDeal(deal.id)}
                />
              </TableCell>
              <TableCell className="font-mono text-sm">{deal.dealNumber}</TableCell>
              <TableCell>
                <Link
                  href={"/deals/" + deal.id}
                  className="font-medium hover:underline"
                >
                  {deal.name}
                </Link>
              </TableCell>
              <TableCell>{deal.client.name}</TableCell>
              <TableCell>
                <DealStatusBadge status={deal.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {deal.propertyType?.replace(/_/g, " ")}
                {deal.propertyCity && ` · ${deal.propertyCity}`}
              </TableCell>
              <TableCell>{deal._count.tasks}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(deal.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={"/deals/" + deal.id}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(deal.id)}>
                      Edit Deal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete?.(deal.id)}
                    >
                      Delete Deal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
