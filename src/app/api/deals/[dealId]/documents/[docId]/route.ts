import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  deleteFile,
  getSignedDownloadUrl,
} from "@/lib/storage";

type DocumentCategory =
  | "CONTRACT"
  | "AMENDMENT"
  | "TITLE"
  | "SURVEY"
  | "ENVIRONMENTAL"
  | "FINANCIAL"
  | "LEGAL"
  | "CORRESPONDENCE"
  | "CLOSING"
  | "OTHER";

// GET /api/deals/[dealId]/documents/[docId] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; docId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, docId } = await params;

    const document = await prisma.document.findFirst({
      where: { id: docId, dealId },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
        previousVersion: {
          select: { id: true, name: true, version: true, createdAt: true },
        },
        newerVersions: {
          select: { id: true, name: true, version: true, createdAt: true },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Generate fresh signed URL
    const downloadUrl = await getSignedDownloadUrl(document.fileKey);

    return NextResponse.json({
      ...document,
      mimeType: document.fileType,
      url: downloadUrl,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH /api/deals/[dealId]/documents/[docId] - Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; docId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, docId } = await params;
    const body = await request.json();

    // Verify document exists and belongs to deal
    const existingDoc = await prisma.document.findFirst({
      where: { id: docId, dealId },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category as DocumentCategory;
    if (body.folderId !== undefined) {
      updateData.folder = body.folderId
        ? { connect: { id: body.folderId } }
        : { disconnect: true };
    }
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isPrimaryContract !== undefined) updateData.isPrimaryContract = body.isPrimaryContract;
    if (body.isAnalyzed !== undefined) updateData.isAnalyzed = body.isAnalyzed;

    const document = await prisma.document.update({
      where: { id: docId },
      data: updateData,
      include: {
        uploadedBy: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "UPDATED",
        entityType: "DOCUMENT",
        entityId: document.id,
        entityName: document.name,
      },
    });

    return NextResponse.json({
      ...document,
      mimeType: document.fileType,
      url: document.fileUrl,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[dealId]/documents/[docId] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; docId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, docId } = await params;

    // Verify document exists and belongs to deal
    const document = await prisma.document.findFirst({
      where: { id: docId, dealId },
      include: {
        newerVersions: { select: { id: true, fileKey: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from S3/R2
    try {
      await deleteFile(document.fileKey);
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document record (cascade will handle versions if needed)
    await prisma.document.delete({
      where: { id: docId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "DELETED",
        entityType: "DOCUMENT",
        entityId: docId,
        entityName: document.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
