"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

export function useRequireAuth(roles?: UserRole[]) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (roles && !roles.includes(session.user.role)) {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, roles, router]);

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthorized: session?.user && (!roles || roles.includes(session.user.role)),
  };
}
