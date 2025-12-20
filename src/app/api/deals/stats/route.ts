import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/deals/stats - Get deal statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where clause based on user role
    const where: Prisma.DealWhereInput = {};
    if (session.user.role === "CLIENT" && session.user.clientId) {
      where.clientId = session.user.clientId;
    } else if (session.user.role === "ATTORNEY" && session.user.firmId) {
      where.client = { firmId: session.user.firmId };
    }

    // Get counts by status
    const statusCounts = await prisma.deal.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    });

    // Get counts by type
    const typeCounts = await prisma.deal.groupBy({
      by: ["type"],
      where,
      _count: { id: true },
    });

    // Get counts by property type
    const propertyTypeCounts = await prisma.deal.groupBy({
      by: ["propertyType"],
      where: { ...where, propertyType: { not: null } },
      _count: { id: true },
    });

    // Get total value from financials
    const totalValue = await prisma.dealFinancials.aggregate({
      where: { deal: where },
      _sum: { contractPrice: true },
    });

    // Get deals created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const dealsThisMonth = await prisma.deal.count({
      where: { ...where, createdAt: { gte: startOfMonth } },
    });

    // Get deals closing this month
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const closingThisMonth = await prisma.deal.count({
      where: {
        ...where,
        timeline: {
          milestones: {
            some: {
              name: { contains: "closing", mode: "insensitive" },
              dueDate: { gte: startOfMonth, lt: endOfMonth },
            },
          },
        },
      },
    });

    return NextResponse.json({
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPropertyType: propertyTypeCounts.reduce((acc, item) => {
        if (item.propertyType) {
          acc[item.propertyType] = item._count.id;
        }
        return acc;
      }, {} as Record<string, number>),
      totalValue: totalValue._sum.contractPrice?.toNumber() || 0,
      dealsThisMonth,
      closingThisMonth,
      totalDeals: statusCounts.reduce((acc, item) => acc + item._count.id, 0),
    });
  } catch (error) {
    console.error("Error fetching deal stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
