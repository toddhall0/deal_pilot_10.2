"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, FileIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useDocumentUpload } from "@/hooks/use-document-upload";
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

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "CONTRACT", label: "Contract" },
  { value: "AMENDMENT", label: "Amendment" },
  { value: "TITLE", label: "Title" },
  { value: "SURVEY", label: "Survey" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "LEGAL", label: "Legal" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "CLOSING", label: "Closing" },
  { value: "OTHER", label: "Other" },
];

interface DocumentUploaderProps {
  dealId: string;
  folderId?: string;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

export function DocumentUploader({
  dealId,
  folderId,
  onUploadComplete,
  trigger,
}: DocumentUploaderProps) {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("OTHER");
  const [description, setDescription] = useState("");

  const { uploadFiles, uploads, isUploading, clearUploads } =
    useDocumentUpload(dealId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadFiles(selectedFiles, {
        category,
        folderId,
        description: description || undefined,
      });
      onUploadComplete?.();
      // Keep dialog open to show results
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      setSelectedFiles([]);
      setCategory("OTHER");
      setDescription("");
      clearUploads();
    }
  };

  const allComplete = uploads.length > 0 && uploads.every((u) => u.status === "complete");
  const hasErrors = uploads.some((u) => u.status === "error");

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Drag and drop files or click to browse. Maximum file size: 100MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop Zone */}
            {uploads.length === 0 && (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-primary">Drop files here...</p>
                ) : (
                  <div>
                    <p className="font-medium">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT, CSV
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && uploads.length === 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploads.length > 0 && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {uploads.map((upload) => (
                    <div
                      key={upload.file}
                      className="flex items-center gap-2 p-2 bg-muted rounded-md"
                    >
                      {upload.status === "complete" ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : upload.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <FileIcon className="h-4 w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">
                          {upload.file}
                        </span>
                        {upload.status === "error" && (
                          <span className="text-xs text-destructive">
                            {upload.error}
                          </span>
                        )}
                        {upload.status === "uploading" && (
                          <Progress value={upload.progress} className="h-1 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            {uploads.length === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as DocumentCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {allComplete || hasErrors ? (
              <Button onClick={handleClose}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                >
                  {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? "s" : ""}`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
