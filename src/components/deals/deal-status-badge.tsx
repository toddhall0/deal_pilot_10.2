import { cn } from "@/lib/utils";
import type { DealStatus } from "@prisma/client";

const statusConfig: Record<DealStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
  ACTIVE: { label: "Active", className: "bg-blue-100 text-blue-800" },
  UNDER_CONTRACT: { label: "Under Contract", className: "bg-purple-100 text-purple-800" },
  IN_DUE_DILIGENCE: { label: "Due Diligence", className: "bg-indigo-100 text-indigo-800" },
  PENDING_CLOSING: { label: "Pending Closing", className: "bg-yellow-100 text-yellow-800" },
  CLOSED: { label: "Closed", className: "bg-green-100 text-green-800" },
  TERMINATED: { label: "Terminated", className: "bg-red-100 text-red-800" },
  ON_HOLD: { label: "On Hold", className: "bg-orange-100 text-orange-800" },
};

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
