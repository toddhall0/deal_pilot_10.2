"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  FolderInput,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";
import { formatFileSize } from "@/lib/storage";
import { cn } from "@/lib/utils";

type DocumentCategory =
  | "CONTRACT"
  | "AMENDMENT"
  | "TITLE"
  | "SURVEY"
  | "ENVIRONMENTAL"
  | "FINANCIAL"
  | "LEGAL"
  | "CORRESPONDENCE"
  | "CLOSING"
  | "OTHER";

interface Document {
  id: string;
  name: string;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  createdAt: string;
  url?: string;
}

interface Folder {
  id: string;
  name: string;
}

interface DraggableDocumentListProps {
  documents: Document[];
  folders: Folder[];
  onMoveToFolder: (docId: string, folderId: string | null) => void;
  onDelete: (docId: string) => void;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  CONTRACT: "Contract",
  AMENDMENT: "Amendment",
  TITLE: "Title",
  SURVEY: "Survey",
  ENVIRONMENTAL: "Environmental",
  FINANCIAL: "Financial",
  LEGAL: "Legal",
  CORRESPONDENCE: "Correspondence",
  CLOSING: "Closing",
  OTHER: "Other",
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType.includes("pdf") || mimeType.includes("word")) return FileText;
  return File;
}

interface SortableDocumentProps {
  document: Document;
  folders: Folder[];
  onMoveToFolder: (folderId: string | null) => void;
  onDelete: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

function SortableDocument({
  document,
  folders,
  onMoveToFolder,
  onDelete,
  onPreview,
  onDownload,
}: SortableDocumentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const FileIcon = getFileIcon(document.mimeType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-md hover:bg-muted group border",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{document.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(document.fileSize)} · {CATEGORY_LABELS[document.category]} ·{" "}
          {new Date(document.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {folders.length > 0 && (
              <>
                <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Move to Root
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id)}
                  >
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to {folder.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DragOverlayDocument({ document }: { document: Document }) {
  const FileIcon = getFileIcon(document.mimeType);

  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-background border shadow-lg">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{document.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(document.fileSize)}
        </p>
      </div>
    </div>
  );
}

export function DraggableDocumentList({
  documents,
  folders,
  onMoveToFolder,
  onDelete,
  onPreview,
  onDownload,
}: DraggableDocumentListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const activeDocument = activeId
    ? documents.find((d) => d.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over;
    if (over) {
      setOverId(over.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    // Check if dropped on a folder
    const targetFolder = folders.find((f) => f.id === over.id);
    if (targetFolder) {
      onMoveToFolder(active.id as string, targetFolder.id);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={documents.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {documents.map((doc) => (
            <SortableDocument
              key={doc.id}
              document={doc}
              folders={folders}
              onMoveToFolder={(folderId) => onMoveToFolder(doc.id, folderId)}
              onDelete={() => onDelete(doc.id)}
              onPreview={() => onPreview(doc)}
              onDownload={() => onDownload(doc)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeDocument && <DragOverlayDocument document={activeDocument} />}
      </DragOverlay>
    </DndContext>
  );
}
