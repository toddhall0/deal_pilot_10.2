"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ExternalLink, X, FileText, FileImage, FileSpreadsheet, Presentation, File } from "lucide-react";

interface DocumentPreviewProps {
  document: {
    id: string;
    name: string;
    mimeType: string;
    url?: string;
  };
  onClose: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType.includes("pdf") || mimeType.includes("word")) return FileText;
  return File;
}

function canPreviewInBrowser(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  );
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const canPreview = canPreviewInBrowser(document.mimeType);
  const FileIcon = getFileIcon(document.mimeType);

  useEffect(() => {
    // Reset loading state when document changes
    setLoading(true);
  }, [document.id]);

  const handleLoad = () => {
    setLoading(false);
  };

  const renderPreview = () => {
    if (!document.url) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <FileIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Preview not available</p>
        </div>
      );
    }

    if (!canPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <FileIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">{document.name}</p>
          <p className="text-muted-foreground mb-4">
            Preview not available for this file type
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.open(document.url, "_blank")}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={() => window.open(document.url, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      );
    }

    if (document.mimeType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          {loading && <Skeleton className="absolute inset-4" />}
          <img
            src={document.url}
            alt={document.name}
            className="max-h-full max-w-full object-contain"
            onLoad={handleLoad}
          />
        </div>
      );
    }

    if (document.mimeType === "application/pdf") {
      return (
        <div className="h-full w-full">
          {loading && <Skeleton className="absolute inset-0" />}
          <iframe
            src={document.url}
            className="h-full w-full"
            title={document.name}
            onLoad={handleLoad}
          />
        </div>
      );
    }

    if (document.mimeType === "text/plain" || document.mimeType === "text/csv") {
      return (
        <div className="h-full w-full p-4 overflow-auto">
          {loading && <Skeleton className="absolute inset-0" />}
          <iframe
            src={document.url}
            className="h-full w-full border rounded"
            title={document.name}
            onLoad={handleLoad}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-8">{document.name}</DialogTitle>
          <div className="flex items-center gap-2">
            {document.url && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(document.url, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(document.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 relative overflow-hidden bg-muted/50">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
