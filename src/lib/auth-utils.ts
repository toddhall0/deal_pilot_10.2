import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@/types/prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

// Define the authenticated user type
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  firmId: string | null;
  clientId: string | null;
  image?: string | null;
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Check if attorney can access client
export async function canAccessClient(
  userId: string,
  userRole: UserRole,
  clientId: string
): Promise<boolean> {
  if (userRole === "ADMIN") {
    return true;
  }

  if (userRole === "ATTORNEY") {
    const clientUser = await prisma.clientUser.findUnique({
      where: {
        attorneyId_clientId: {
          attorneyId: userId,
          clientId: clientId,
        },
      },
    });
    return !!clientUser;
  }

  if (userRole === "CLIENT") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });
    return user?.clientId === clientId;
  }

  return false;
}

// Check if user can access deal
export async function canAccessDeal(
  userId: string,
  userRole: UserRole,
  dealId: string
): Promise<boolean> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { clientId: true },
  });

  if (!deal) {
    return false;
  }

  return canAccessClient(userId, userRole, deal.clientId);
}

// Server component helper - requires authentication
export async function requireAuth(roles?: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (roles && !hasRole(session.user.role, roles)) {
    redirect("/unauthorized");
  }

  return session.user;
}

// Get current user from session (returns null if not authenticated)
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

// API route protection wrapper
export function withAuth(
  handler: (request: Request, context: { user: AuthUser }) => Promise<Response>,
  options: { roles?: UserRole[] } = {}
) {
  return async (request: Request) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (options.roles && !hasRole(session.user.role, options.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(request, { user: session.user });
  };
}

// RBAC permission definitions
export const permissions = {
  // Firm management
  "firm:read": ["ADMIN"],
  "firm:write": ["ADMIN"],

  // Client management
  "client:read": ["ADMIN", "ATTORNEY"],
  "client:write": ["ADMIN", "ATTORNEY"],

  // User management
  "user:read": ["ADMIN"],
  "user:write": ["ADMIN"],
  "user:read:own": ["ADMIN", "ATTORNEY", "CLIENT"],
  "user:write:own": ["ADMIN", "ATTORNEY", "CLIENT"],

  // Deal management
  "deal:read": ["ADMIN", "ATTORNEY", "CLIENT"],
  "deal:write": ["ADMIN", "ATTORNEY"],
  "deal:delete": ["ADMIN"],

  // Task management
  "task:read": ["ADMIN", "ATTORNEY", "CLIENT"],
  "task:write": ["ADMIN", "ATTORNEY", "CLIENT"],
  "task:delete": ["ADMIN", "ATTORNEY"],

  // Document management
  "document:read": ["ADMIN", "ATTORNEY", "CLIENT"],
  "document:write": ["ADMIN", "ATTORNEY"],
  "document:delete": ["ADMIN", "ATTORNEY"],

  // Note management
  "note:read": ["ADMIN", "ATTORNEY", "CLIENT"],
  "note:write": ["ADMIN", "ATTORNEY", "CLIENT"],
  "note:delete": ["ADMIN", "ATTORNEY"],

  // Report management
  "report:read": ["ADMIN", "ATTORNEY", "CLIENT"],
  "report:write": ["ADMIN", "ATTORNEY"],
} as const;

export type Permission = keyof typeof permissions;

// Check if user has permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = permissions[permission] as readonly UserRole[];
  return allowedRoles.includes(userRole);
}
