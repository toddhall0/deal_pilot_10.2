"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type DocumentCategory =
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

interface DocumentFilters {
  folderId?: string;
  category?: DocumentCategory;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface DealDocument {
  id: string;
  name: string;
  originalName: string;
  description: string | null;
  category: DocumentCategory;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  fileKey: string;
  version: number;
  isPrimaryContract: boolean;
  isAnalyzed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy: { id: string; name: string | null };
  folder: { id: string; name: string } | null;
  url?: string;
}

export interface DocumentUpdateData {
  name?: string;
  description?: string | null;
  category?: DocumentCategory;
  folderId?: string | null;
  sortOrder?: number;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  _count: { documents: number; children: number };
  children?: DocumentFolder[];
}

async function fetchDocuments(
  dealId: string,
  filters?: DocumentFilters
): Promise<{ documents: DealDocument[]; folders: DocumentFolder[] }> {
  const params = new URLSearchParams();

  if (filters?.folderId) params.set("folderId", filters.folderId);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.sortField) params.set("sortField", filters.sortField);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  const url = `/api/deals/${dealId}/documents?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch documents");
  return response.json();
}

export function useDocuments(dealId: string, filters?: DocumentFilters) {
  return useQuery({
    queryKey: ["documents", dealId, filters],
    queryFn: () => fetchDocuments(dealId, filters),
    enabled: !!dealId,
  });
}

async function fetchDocument(
  dealId: string,
  docId: string
): Promise<DealDocument & { downloadUrl: string }> {
  const response = await fetch(`/api/deals/${dealId}/documents/${docId}`);
  if (!response.ok) throw new Error("Failed to fetch document");
  return response.json();
}

export function useDocument(dealId: string, docId: string) {
  return useQuery({
    queryKey: ["document", dealId, docId],
    queryFn: () => fetchDocument(dealId, docId),
    enabled: !!dealId && !!docId,
  });
}

export function useDocumentMutations(dealId: string) {
  const queryClient = useQueryClient();

  const updateDocument = useMutation({
    mutationFn: async ({
      docId,
      data,
    }: {
      docId: string;
      data: DocumentUpdateData;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const response = await fetch(`/api/deals/${dealId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  const moveDocument = useMutation({
    mutationFn: async ({
      docId,
      folderId,
    }: {
      docId: string;
      folderId: string | null;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!response.ok) throw new Error("Failed to move document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  const reorderDocuments = useMutation({
    mutationFn: async (
      updates: { id: string; sortOrder: number }[]
    ) => {
      await Promise.all(
        updates.map(({ id, sortOrder }) =>
          fetch(`/api/deals/${dealId}/documents/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  return { updateDocument, deleteDocument, moveDocument, reorderDocuments };
}
