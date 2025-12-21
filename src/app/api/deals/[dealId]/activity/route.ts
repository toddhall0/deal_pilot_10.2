import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/deals/[dealId]/activity - Get deal activity log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId: id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Verify deal exists and user has access
    const deal = await prisma.deal.findUnique({
      where: { id },
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

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { dealId: id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where: { dealId: id } }),
    ]);

    // Get user details for activities
    const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const activitiesWithUsers = activities.map(activity => ({
      ...activity,
      user: activity.userId ? userMap.get(activity.userId) : null,
    }));

    return NextResponse.json({
      data: activitiesWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching deal activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
