"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Edit,
  FolderPlus,
  Upload,
  Grid,
  List,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import { useDocuments, useDocumentMutations, DealDocument, DocumentFolder } from "@/hooks/use-documents";
import { useDocumentFolders, useFolderMutations } from "@/hooks/use-document-folders";
import { DocumentUploader } from "./document-uploader";
import { CreateFolderDialog } from "./create-folder-dialog";
import { DocumentPreview } from "./document-preview";
import { DraggableDocumentList } from "./draggable-document-list";
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

interface DocumentsTabProps {
  dealId: string;
}

interface FolderNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  _count: { documents: number; children: number };
  children?: FolderNode[];
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

export function DocumentsTab({ dealId }: DocumentsTabProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    name: string;
    mimeType: string;
    url?: string;
  } | null>(null);

  const { data: foldersData, isLoading: foldersLoading } = useDocumentFolders(dealId);
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocs } = useDocuments(dealId, {
    folderId: selectedFolderId || undefined,
    search: searchQuery || undefined,
  });
  const { deleteDocument, updateDocument } = useDocumentMutations(dealId);
  const { deleteFolder } = useFolderMutations(dealId);

  const folders = foldersData?.folders || [];
  const documents = documentsData?.documents || [];

  // Build folder tree
  const folderTree = useMemo(() => {
    const map = new Map<string | null, FolderNode[]>();
    folders.forEach((folder: FolderNode) => {
      const parentId = folder.parentId;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(folder);
    });

    const buildTree = (parentId: string | null): FolderNode[] => {
      const children = map.get(parentId) || [];
      return children.map(folder => ({
        ...folder,
        children: buildTree(folder.id),
      }));
    };

    return buildTree(null);
  }, [folders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = (parentId: string | null = null) => {
    setCreateFolderParentId(parentId);
    setShowCreateFolder(true);
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocId) return;
    try {
      await deleteDocument.mutateAsync(deleteDocId);
      setDeleteDocId(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return;
    try {
      await deleteFolder.mutateAsync({ folderId: deleteFolderId, moveToParent: true });
      if (selectedFolderId === deleteFolderId) {
        setSelectedFolderId(null);
      }
      setDeleteFolderId(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  const handleMoveToFolder = async (docId: string, folderId: string | null) => {
    try {
      await updateDocument.mutateAsync({ docId, data: { folderId } });
    } catch (error) {
      console.error("Failed to move document:", error);
    }
  };

  const renderFolderTree = (nodes: FolderNode[], level = 0) => {
    return nodes.map(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
              isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <button
              className="p-0.5 hover:bg-muted-foreground/20 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              ) : (
                <span className="w-3" />
              )}
            </button>
            <div
              className="flex items-center gap-2 flex-1 min-w-0"
              onClick={() => setSelectedFolderId(folder.id)}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-600 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-600 shrink-0" />
              )}
              <span className="text-sm truncate">{folder.name}</span>
              {folder._count.documents > 0 && (
                <Badge variant="secondary" className="text-xs h-5 shrink-0">
                  {folder._count.documents}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Subfolder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteFolderId(folder.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isExpanded && hasChildren && renderFolderTree(folder.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-400px)] min-h-[500px]">
      {/* Folder Sidebar */}
      <Card className="w-64 shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Folders</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleCreateFolder(null)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100%-40px)]">
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer mb-1",
                selectedFolderId === null ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              )}
              onClick={() => setSelectedFolderId(null)}
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm">All Documents</span>
            </div>
            {foldersLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              renderFolderTree(folderTree)
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedFolderId
                  ? folders.find((f: FolderNode) => f.id === selectedFolderId)?.name || "Documents"
                  : "All Documents"}
              </CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              <DocumentUploader
                dealId={dealId}
                folderId={selectedFolderId || undefined}
                onUploadComplete={() => refetchDocs()}
                trigger={
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-1">No documents</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery
                  ? "No documents match your search"
                  : "Upload your first document to get started"}
              </p>
              {!searchQuery && (
                <DocumentUploader
                  dealId={dealId}
                  folderId={selectedFolderId || undefined}
                  onUploadComplete={() => refetchDocs()}
                />
              )}
            </div>
          ) : viewMode === "list" ? (
            <DraggableDocumentList
              documents={documents}
              folders={folders}
              onMoveToFolder={handleMoveToFolder}
              onDelete={(docId) => setDeleteDocId(docId)}
              onPreview={(doc) => setPreviewDoc({
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
                url: doc.url,
              })}
              onDownload={(doc) => doc.url && window.open(doc.url, "_blank")}
            />
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.mimeType);
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col items-center p-4 rounded-md border hover:bg-muted group cursor-pointer"
                    onClick={() => setPreviewDoc({
                      id: doc.id,
                      name: doc.name,
                      mimeType: doc.mimeType,
                      url: doc.url,
                    })}
                  >
                    <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-center truncate w-full">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {CATEGORY_LABELS[doc.category]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        dealId={dealId}
        parentId={createFolderParentId}
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
      />

      {/* Delete Document Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={() => setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Documents inside will be moved to the parent folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Preview */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
