"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  _count: { documents: number; children: number };
  children?: Folder[];
}

async function fetchFolders(dealId: string): Promise<{ folders: Folder[] }> {
  const response = await fetch(`/api/deals/${dealId}/folders`);
  if (!response.ok) throw new Error("Failed to fetch folders");
  return response.json();
}

export function useDocumentFolders(dealId: string) {
  return useQuery({
    queryKey: ["folders", dealId],
    queryFn: () => fetchFolders(dealId),
    enabled: !!dealId,
  });
}

export function useFolderMutations(dealId: string) {
  const queryClient = useQueryClient();

  const createFolder = useMutation({
    mutationFn: async (data: {
      name: string;
      parentId?: string;
      description?: string;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", dealId] });
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: string;
      data: Partial<Folder>;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", dealId] });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async ({
      folderId,
      moveToParent = false,
    }: {
      folderId: string;
      moveToParent?: boolean;
    }) => {
      const url = `/api/deals/${dealId}/folders/${folderId}${
        moveToParent ? "?moveToParent=true" : ""
      }`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", dealId] });
      queryClient.invalidateQueries({ queryKey: ["documents", dealId] });
    },
  });

  const moveFolder = useMutation({
    mutationFn: async ({
      folderId,
      parentId,
    }: {
      folderId: string;
      parentId: string | null;
    }) => {
      const response = await fetch(`/api/deals/${dealId}/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId }),
      });
      if (!response.ok) throw new Error("Failed to move folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", dealId] });
    },
  });

  const reorderFolders = useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      await Promise.all(
        updates.map(({ id, sortOrder }) =>
          fetch(`/api/deals/${dealId}/folders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", dealId] });
    },
  });

  return {
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    reorderFolders,
  };
}
