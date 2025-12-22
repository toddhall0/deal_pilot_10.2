import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/team - Get team members for task assignment
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where clause based on user's access
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    // Attorneys can only see users in their firm
    if (session.user.role === "ATTORNEY" && session.user.firmId) {
      where.firmId = session.user.firmId;
    }

    // Clients can only see attorneys assigned to their client
    if (session.user.role === "CLIENT" && session.user.clientId) {
      where.OR = [
        { clientId: session.user.clientId },
        {
          managedClients: {
            some: { clientId: session.user.clientId },
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        title: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
