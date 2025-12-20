import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dealCreateSchema } from "@/lib/validations/deal";
import { generateDealNumber } from "@/lib/db-utils";
import { Prisma, DealStatus, DealType, PropertyType } from "@prisma/client";

// GET /api/deals - List deals with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DealWhereInput = {};

    // Status filter
    const status = searchParams.get("status");
    if (status) {
      const statuses = status.split(",") as DealStatus[];
      where.status = { in: statuses };
    }

    // Client filter
    const clientId = searchParams.get("clientId");
    if (clientId) {
      where.clientId = clientId;
    }

    // Deal type filter
    const dealType = searchParams.get("type");
    if (dealType) {
      where.type = dealType as DealType;
    }

    // Property type filter
    const propertyType = searchParams.get("propertyType");
    if (propertyType) {
      where.propertyType = propertyType as PropertyType;
    }

    // Search filter
    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { dealNumber: { contains: search, mode: "insensitive" } },
        { propertyAddress: { contains: search, mode: "insensitive" } },
        { propertyCity: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date range filters
    const createdFrom = searchParams.get("createdFrom");
    const createdTo = searchParams.get("createdTo");
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

    // Authorization: Non-admins see only their deals
    if (session.user.role === "CLIENT" && session.user.clientId) {
      where.clientId = session.user.clientId;
    } else if (session.user.role === "ATTORNEY" && session.user.firmId) {
      where.client = { firmId: session.user.firmId };
    }

    // Sorting
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const orderBy: Prisma.DealOrderByWithRelationInput = { [sortField]: sortOrder };

    // Execute query
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          client: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { tasks: true, documents: true, notes: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

// POST /api/deals - Create new deal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only attorneys and admins can create deals
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = dealCreateSchema.parse(body);

    // Verify client access
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
      select: { firmId: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify user has access to this client
    if (session.user.role === "ATTORNEY" && client.firmId !== session.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate deal number
    const dealNumber = await generateDealNumber(prisma);

    // Create deal with associated records
    const deal = await prisma.deal.create({
      data: {
        ...validatedData,
        dealNumber,
        createdById: session.user.id,
        // Create associated timeline
        timeline: {
          create: {},
        },
        // Create associated financials
        financials: {
          create: {},
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        timeline: true,
        financials: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId: deal.id,
        action: "CREATED",
        entityType: "DEAL",
        entityId: deal.id,
        entityName: deal.name,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
