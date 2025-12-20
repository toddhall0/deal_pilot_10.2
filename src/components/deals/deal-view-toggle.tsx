"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "card" | "board";

interface DealViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const viewOptions: { value: ViewMode; icon: typeof List; label: string }[] = [
  { value: "table", icon: List, label: "Table view" },
  { value: "card", icon: LayoutGrid, label: "Card view" },
  { value: "board", icon: Kanban, label: "Board view" },
];

export function DealViewToggle({ value, onChange }: DealViewToggleProps) {
  return (
    <div className="flex items-center border rounded-md">
      {viewOptions.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 rounded-none first:rounded-l-md last:rounded-r-md",
            value === option.value && "bg-muted"
          )}
          onClick={() => onChange(option.value)}
          title={option.label}
        >
          <option.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
