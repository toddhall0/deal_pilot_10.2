import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Default folder structure for new deals
export const DEFAULT_FOLDERS = [
  {
    name: "Purchase Agreement",
    children: [{ name: "Amendments" }],
  },
  {
    name: "Due Diligence",
    children: [
      { name: "Title" },
      { name: "Survey" },
      { name: "Environmental" },
      { name: "Financial" },
      { name: "Legal" },
      { name: "Physical/Property" },
    ],
  },
  { name: "Closing Documents" },
  { name: "Correspondence" },
];

// GET /api/deals/[dealId]/folders - List folders
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

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const folders = await prisma.documentFolder.findMany({
      where: { dealId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { documents: true, children: true } },
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { documents: true, children: true } },
          },
        },
      },
    });

    // Build hierarchical structure
    const rootFolders = folders.filter((f) => !f.parentId);

    return NextResponse.json({ folders: rootFolders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

// POST /api/deals/[dealId]/folders - Create folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId } = await params;
    const body = await request.json();

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const { name, parentId, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Folder name required" }, { status: 400 });
    }

    // Get max sort order for siblings
    const maxSortOrder = await prisma.documentFolder.aggregate({
      where: { dealId, parentId: parentId || null },
      _max: { sortOrder: true },
    });

    const folder = await prisma.documentFolder.create({
      data: {
        dealId,
        name,
        description,
        parentId: parentId || null,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// Helper function to create default folders for a deal
export async function createDefaultFolders(dealId: string): Promise<void> {
  const createFoldersRecursive = async (
    folders: typeof DEFAULT_FOLDERS,
    parentId: string | null = null
  ) => {
    for (let i = 0; i < folders.length; i++) {
      const folderDef = folders[i];
      const folder = await prisma.documentFolder.create({
        data: {
          dealId,
          name: folderDef.name,
          parentId,
          sortOrder: i,
        },
      });

      if ("children" in folderDef && folderDef.children) {
        await createFoldersRecursive(folderDef.children, folder.id);
      }
    }
  };

  await createFoldersRecursive(DEFAULT_FOLDERS);
}
