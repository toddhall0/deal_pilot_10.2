import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { milestoneUpdateSchema } from "@/lib/validations/milestone";

// PATCH /api/deals/[dealId]/milestones/[milestoneId] - Update milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; milestoneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealId, milestoneId } = await params;
    const body = await request.json();
    const validatedData = milestoneUpdateSchema.parse(body);

    // Verify milestone exists and belongs to deal
    const existing = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        timeline: { dealId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const wasCompleted = validatedData.status === "COMPLETED" && existing.status !== "COMPLETED";

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...validatedData,
        completedDate: wasCompleted ? new Date() : validatedData.completedDate,
      },
      include: {
        children: true,
        tasks: { select: { id: true, title: true, status: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: validatedData.status !== existing.status ? "STATUS_CHANGED" : "UPDATED",
        entityType: "MILESTONE",
        entityId: milestone.id,
        entityName: milestone.name,
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

// DELETE /api/deals/[dealId]/milestones/[milestoneId] - Delete milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; milestoneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealId, milestoneId } = await params;

    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        timeline: { dealId },
      },
      select: { id: true, name: true },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    await prisma.milestone.delete({
      where: { id: milestoneId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "DELETED",
        entityType: "MILESTONE",
        entityId: milestoneId,
        entityName: milestone.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
