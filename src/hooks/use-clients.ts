"use client";

import { useQuery } from "@tanstack/react-query";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  _count: { deals: number };
}

async function fetchClients(search?: string): Promise<{ clients: Client[] }> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const url = "/api/clients" + (params.toString() ? "?" + params.toString() : "");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch clients");
  }
  return response.json();
}

export function useClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: () => fetchClients(search),
  });
}
