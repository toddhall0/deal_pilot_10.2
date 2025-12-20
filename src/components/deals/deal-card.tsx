"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealStatusBadge } from "./deal-status-badge";
import { Building2, Calendar, FileText, CheckSquare, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DealStatus, DealType, PropertyType } from "@prisma/client";

interface DealCardProps {
  deal: {
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
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const location = [deal.propertyCity, deal.propertyState].filter(Boolean).join(", ");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link href={"/deals/" + deal.id} className="font-semibold hover:underline">
              {deal.name}
            </Link>
            <p className="text-sm text-muted-foreground">{deal.dealNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <DealStatusBadge status={deal.status} />
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Client: </span>
          <span className="font-medium">{deal.client.name}</span>
        </div>

        {(deal.propertyType || location) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>
              {deal.propertyType?.replace(/_/g, " ")}
              {deal.propertyType && location && " · "}
              {location}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4" />
            <span>{deal._count.tasks} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{deal._count.documents} docs</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {new Date(deal.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
