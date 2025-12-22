import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const noteCreateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, "Content is required"),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPinned: z.boolean().optional(),
});

// GET /api/deals/[dealId]/notes - List notes for a deal
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

    const notes = await prisma.note.findMany({
      where: { dealId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/deals/[dealId]/notes - Create a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId } = await params;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = noteCreateSchema.parse(body);

    // Extract plain text from content (simple strip for now)
    const plainText = validatedData.content.replace(/<[^>]*>/g, "");

    const note = await prisma.note.create({
      data: {
        ...validatedData,
        plainText,
        dealId,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "CREATED",
        entityType: "NOTE",
        entityId: note.id,
        entityName: note.title || "Note",
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
