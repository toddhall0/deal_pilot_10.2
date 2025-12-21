"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

interface UploadProgress {
  file: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface UploadOptions {
  category?: DocumentCategory;
  folderId?: string;
  description?: string;
}

export function useDocumentUpload(dealId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const updateProgress = useCallback(
    (fileName: string, update: Partial<UploadProgress>) => {
      setUploads((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(fileName);
        newMap.set(fileName, { ...existing, ...update } as UploadProgress);
        return newMap;
      });
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[], options: UploadOptions = {}) => {
      if (files.length === 0) return [];

      setIsUploading(true);

      // Initialize progress for all files
      const initialProgress = new Map<string, UploadProgress>();
      files.forEach((file) => {
        initialProgress.set(file.name, {
          file: file.name,
          progress: 0,
          status: "pending",
        });
      });
      setUploads(initialProgress);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      if (options.category) formData.append("category", options.category);
      if (options.folderId) formData.append("folderId", options.folderId);
      if (options.description) formData.append("description", options.description);

      try {
        // Mark all as uploading
        files.forEach((file) => {
          updateProgress(file.name, { status: "uploading", progress: 50 });
        });

        const response = await fetch(`/api/deals/${dealId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();

        // Mark successful uploads
        result.documents?.forEach((doc: { originalName: string }) => {
          updateProgress(doc.originalName, { status: "complete", progress: 100 });
        });

        // Mark errors
        result.errors?.forEach((err: { file: string; error: string }) => {
          updateProgress(err.file, { status: "error", error: err.error });
        });

        // Invalidate documents query
        queryClient.invalidateQueries({ queryKey: ["documents", dealId] });

        return result.documents || [];
      } catch (error) {
        // Mark all as failed
        files.forEach((file) => {
          updateProgress(file.name, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        });
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [dealId, queryClient, updateProgress]
  );

  const uploadVersion = useCallback(
    async (docId: string, file: File) => {
      setIsUploading(true);
      setUploads(
        new Map([
          [
            file.name,
            { file: file.name, progress: 0, status: "uploading" },
          ],
        ])
      );

      const formData = new FormData();
      formData.append("file", file);

      try {
        updateProgress(file.name, { progress: 50 });

        const response = await fetch(
          `/api/deals/${dealId}/documents/${docId}/version`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();
        updateProgress(file.name, { status: "complete", progress: 100 });

        queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
        queryClient.invalidateQueries({ queryKey: ["document", dealId, docId] });

        return result;
      } catch (error) {
        updateProgress(file.name, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        });
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [dealId, queryClient, updateProgress]
  );

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploadFiles,
    uploadVersion,
    uploads: Array.from(uploads.values()),
    isUploading,
    clearUploads,
  };
}
