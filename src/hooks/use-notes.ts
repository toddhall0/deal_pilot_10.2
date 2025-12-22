"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Note {
  id: string;
  title?: string | null;
  content: string;
  plainText?: string | null;
  category?: string | null;
  tags: string[];
  isPinned: boolean;
  author: { id: string; name: string; avatar?: string | null };
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteInput {
  title?: string;
  content: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
}

async function fetchNotes(dealId: string): Promise<Note[]> {
  const res = await fetch(`/api/deals/${dealId}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

async function createNote(dealId: string, data: CreateNoteInput): Promise<Note> {
  const res = await fetch(`/api/deals/${dealId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export function useNotes(dealId: string) {
  return useQuery({
    queryKey: ["notes", dealId],
    queryFn: () => fetchNotes(dealId),
    enabled: !!dealId,
  });
}

export function useNoteMutations(dealId: string) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: CreateNoteInput) => createNote(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    },
  });

  return { create };
}
