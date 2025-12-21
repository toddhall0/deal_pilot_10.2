import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

// PATCH /api/deals/[dealId]/folders/[folderId] - Update folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; folderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, folderId } = await params;
    const body = await request.json();

    // Verify folder exists and belongs to deal
    const existingFolder = await prisma.documentFolder.findFirst({
      where: { id: folderId, dealId },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.parentId !== undefined) {
      // Prevent moving folder into itself or its descendants
      if (body.parentId === folderId) {
        return NextResponse.json(
          { error: "Cannot move folder into itself" },
          { status: 400 }
        );
      }
      updateData.parentId = body.parentId || null;
    }

    const folder = await prisma.documentFolder.update({
      where: { id: folderId },
      data: updateData,
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[dealId]/folders/[folderId] - Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; folderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, folderId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const moveToParent = searchParams.get("moveToParent") === "true";

    // Verify folder exists and belongs to deal
    const folder = await prisma.documentFolder.findFirst({
      where: { id: folderId, dealId },
      include: {
        documents: { select: { id: true, fileKey: true } },
        children: { select: { id: true } },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (moveToParent) {
      // Move documents and subfolders to parent folder
      await prisma.document.updateMany({
        where: { folderId },
        data: { folderId: folder.parentId },
      });

      await prisma.documentFolder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId },
      });
    } else {
      // Delete all documents in folder from storage
      for (const doc of folder.documents) {
        try {
          await deleteFile(doc.fileKey);
        } catch (e) {
          console.error(`Failed to delete file ${doc.fileKey}:`, e);
        }
      }

      // Recursively delete child folders
      const deleteChildFolders = async (parentId: string) => {
        const children = await prisma.documentFolder.findMany({
          where: { parentId },
          include: { documents: { select: { fileKey: true } } },
        });

        for (const child of children) {
          // Delete documents
          for (const doc of child.documents) {
            try {
              await deleteFile(doc.fileKey);
            } catch (e) {
              console.error(`Failed to delete file ${doc.fileKey}:`, e);
            }
          }
          await deleteChildFolders(child.id);
        }

        await prisma.document.deleteMany({ where: { folderId: parentId } });
        await prisma.documentFolder.deleteMany({ where: { parentId } });
      };

      await deleteChildFolders(folderId);
      await prisma.document.deleteMany({ where: { folderId } });
    }

    // Delete the folder itself
    await prisma.documentFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
