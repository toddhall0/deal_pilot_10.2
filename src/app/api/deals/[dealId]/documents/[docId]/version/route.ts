import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  uploadFile,
  generateFileKey,
  isValidFileType,
  MAX_FILE_SIZE,
  formatFileSize,
} from "@/lib/storage";

// POST /api/deals/[dealId]/documents/[docId]/version - Upload new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string; docId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dealId, docId } = await params;

    // Get existing document
    const existingDoc = await prisma.document.findFirst({
      where: { id: docId, dealId },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${formatFileSize(MAX_FILE_SIZE)}` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type, file.name)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate new file key with version
    const newVersion = existingDoc.version + 1;
    const fileKey = generateFileKey(
      dealId,
      existingDoc.category,
      file.name,
      `v${newVersion}-${Date.now()}`
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3/R2
    const { url } = await uploadFile(fileKey, buffer, file.type, {
      originalName: file.name,
      dealId,
      uploadedBy: session.user.id,
      version: newVersion.toString(),
    });

    // Create new document version linked to previous
    const newDocument = await prisma.document.create({
      data: {
        dealId,
        folderId: existingDoc.folderId,
        name: existingDoc.name, // Keep same name
        originalName: file.name,
        description: existingDoc.description,
        category: existingDoc.category,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: url,
        fileKey,
        uploadedById: session.user.id,
        version: newVersion,
        previousVersionId: docId,
        isPrimaryContract: existingDoc.isPrimaryContract,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
        previousVersion: {
          select: { id: true, name: true, version: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "UPLOADED",
        entityType: "DOCUMENT",
        entityId: newDocument.id,
        entityName: `${newDocument.name} (v${newVersion})`,
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error("Error uploading new version:", error);
    return NextResponse.json(
      { error: "Failed to upload new version" },
      { status: 500 }
    );
  }
}
