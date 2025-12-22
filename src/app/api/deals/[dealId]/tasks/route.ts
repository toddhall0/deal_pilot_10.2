import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { taskCreateSchema } from "@/lib/validations/task";

// GET /api/deals/[dealId]/tasks - List tasks for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");

    // Verify deal exists and user has access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { client: { select: { firmId: true } } },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (session.user.role === "CLIENT" && deal.clientId !== session.user.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "ATTORNEY" && deal.client.firmId !== session.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause
    const where: Record<string, unknown> = { dealId, parentId: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        milestone: { select: { id: true, name: true } },
        subtasks: {
          orderBy: { sortOrder: "asc" },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
        checklists: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: { orderBy: { sortOrder: "asc" } },
          },
        },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/deals/[dealId]/tasks - Create a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealId } = await params;

    // Verify deal exists and user has access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { client: { select: { firmId: true } } },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (session.user.role === "ATTORNEY" && deal.client.firmId !== session.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = taskCreateSchema.parse({ ...body, dealId });

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "CREATED",
        entityType: "TASK",
        entityId: task.id,
        entityName: task.title,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
