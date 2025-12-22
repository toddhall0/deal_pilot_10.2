"use client";

import { useQuery } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  title?: string | null;
}

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch("/api/team");
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
  });
}
