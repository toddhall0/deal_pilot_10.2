import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dealUpdateSchema } from "@/lib/validations/deal";

// GET /api/deals/[id] - Get single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        transactionSummary: true,
        timeline: {
          include: {
            milestones: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        financials: {
          include: {
            deposits: { orderBy: { dueDate: "asc" } },
            lineItems: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            notes: true,
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "CLIENT" && deal.clientId !== session.user.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "ATTORNEY" && deal.client.firmId !== session.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: { dealId: id },
      _count: { id: true },
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { dealId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ...deal,
      taskStats: taskStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 });
  }
}

// PATCH /api/deals/[id] - Update deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = dealUpdateSchema.parse(body);

    // Verify deal exists and user has access
    const existingDeal = await prisma.deal.findUnique({
      where: { id },
      include: { client: { select: { firmId: true } } },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (session.user.role === "ATTORNEY" && existingDeal.client.firmId !== session.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Track changes for activity log
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(validatedData)) {
      const oldValue = existingDeal[key as keyof typeof existingDeal];
      if (oldValue !== value) {
        changes[key] = { from: oldValue, to: value };
      }
    }

    // Update deal
    const deal = await prisma.deal.update({
      where: { id },
      data: validatedData,
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log activity if changes were made
    if (Object.keys(changes).length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          dealId: deal.id,
          action: "UPDATED",
          entityType: "DEAL",
          entityId: deal.id,
          entityName: deal.name,
          changes: JSON.parse(JSON.stringify(changes)),
        },
      });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}

// DELETE /api/deals/[id] - Delete deal (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete deals
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Soft delete by updating status to TERMINATED
    await prisma.deal.update({
      where: { id },
      data: { status: "TERMINATED" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId: id,
        action: "DELETED",
        entityType: "DEAL",
        entityId: id,
        entityName: deal.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 });
  }
}
