"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { permissions, type Permission } from "@/lib/auth-utils";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const isAuthenticated = status === "authenticated" && !!user;
  const isLoading = status === "loading";

  const isAdmin = user?.role === "ADMIN";
  const isAttorney = user?.role === "ATTORNEY";
  const isClient = user?.role === "CLIENT";

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const allowedRoles = permissions[permission] as readonly UserRole[];
    return allowedRoles.includes(user.role);
  };

  const canAccess = (resource: string, action: "read" | "write" | "delete"): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return hasPermission(permission);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isAttorney,
    isClient,
    hasRole,
    hasPermission,
    canAccess,
  };
}
