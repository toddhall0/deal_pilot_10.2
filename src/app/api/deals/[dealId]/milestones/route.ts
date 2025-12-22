import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { milestoneCreateSchema } from "@/lib/validations/milestone";

// GET /api/deals/[dealId]/milestones - List milestones for a deal
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

    // Verify deal exists and get timeline
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        client: { select: { firmId: true } },
        timeline: {
          include: {
            milestones: {
              where: { parentId: null },
              orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
              include: {
                children: {
                  orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
                },
                tasks: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
          },
        },
      },
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

    return NextResponse.json({
      timeline: deal.timeline,
      milestones: deal.timeline?.milestones || [],
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

// POST /api/deals/[dealId]/milestones - Create a milestone
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

    // Get or create timeline for the deal
    let timeline = await prisma.timeline.findUnique({
      where: { dealId },
    });

    if (!timeline) {
      timeline = await prisma.timeline.create({
        data: { dealId },
      });
    }

    const body = await request.json();
    const validatedData = milestoneCreateSchema.parse({ ...body, timelineId: timeline.id });

    const milestone = await prisma.milestone.create({
      data: validatedData,
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
        action: "CREATED",
        entityType: "MILESTONE",
        entityId: milestone.id,
        entityName: milestone.name,
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
