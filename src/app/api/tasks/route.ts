import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/tasks - List all tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const limit = searchParams.get("limit");

    // Build where clause based on user's access
    const where: Record<string, unknown> = {
      parentId: null, // Only top-level tasks
    };

    // Filter by status
    if (status) {
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Access control based on role
    if (session.user.role === "CLIENT" && session.user.clientId) {
      where.deal = { clientId: session.user.clientId };
    } else if (session.user.role === "ATTORNEY" && session.user.firmId) {
      where.deal = { client: { firmId: session.user.firmId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      take: limit ? parseInt(limit) : 100,
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        deal: {
          select: {
            id: true,
            name: true,
            dealNumber: true,
          },
        },
        assignee: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
