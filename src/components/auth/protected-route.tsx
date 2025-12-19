import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export async function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (roles && !roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
