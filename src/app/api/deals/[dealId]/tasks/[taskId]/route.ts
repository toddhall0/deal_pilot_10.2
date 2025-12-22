import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { taskUpdateSchema } from "@/lib/validations/task";

// GET /api/deals/[dealId]/tasks/[taskId] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId, dealId },
      include: {
        deal: { select: { id: true, name: true, dealNumber: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
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
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PATCH /api/deals/[dealId]/tasks/[taskId] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealId, taskId } = await params;
    const body = await request.json();
    const validatedData = taskUpdateSchema.parse(body);

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, dealId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Track status changes
    const statusChanged = validatedData.status && validatedData.status !== existingTask.status;
    const wasCompleted = validatedData.status === "COMPLETED" && existingTask.status !== "COMPLETED";

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validatedData,
        completedAt: wasCompleted ? new Date() : validatedData.completedAt,
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
        action: statusChanged ? "STATUS_CHANGED" : "UPDATED",
        entityType: "TASK",
        entityId: task.id,
        entityName: task.title,
        changes: JSON.parse(JSON.stringify({
          ...(statusChanged && { status: { from: existingTask.status, to: task.status } }),
        })),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/deals/[dealId]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealId, taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId, dealId },
      select: { id: true, title: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "DELETED",
        entityType: "TASK",
        entityId: taskId,
        entityName: task.title,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
