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

// GET /api/deals/[dealId]/documents - List documents
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
    const searchParams = request.nextUrl.searchParams;

    // Verify deal access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, clientId: true, client: { select: { firmId: true } } },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Build where clause
    const where: Record<string, unknown> = { dealId };

    const folderId = searchParams.get("folderId");
    if (folderId) {
      where.folderId = folderId === "root" ? null : folderId;
    }

    const category = searchParams.get("category");
    if (category) {
      where.category = category as DocumentCategory;
    }

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sorting
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const documents = await prisma.document.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    // Add mimeType alias for fileType (for frontend compatibility)
    const documentsWithMimeType = documents.map((doc) => ({
      ...doc,
      mimeType: doc.fileType,
      url: doc.fileUrl,
    }));

    // Get folders for this deal
    const folders = await prisma.documentFolder.findMany({
      where: { dealId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    return NextResponse.json({
      documents: documentsWithMimeType,
      folders,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/deals/[dealId]/documents - Upload document(s)
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

    // Verify deal access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, name: true },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const category = (formData.get("category") as string) || "OTHER";
    const folderId = formData.get("folderId") as string | null;
    const description = formData.get("description") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedDocuments = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            file: file.name,
            error: `File exceeds maximum size of ${formatFileSize(MAX_FILE_SIZE)}`,
          });
          continue;
        }

        // Validate file type
        if (!isValidFileType(file.type, file.name)) {
          errors.push({
            file: file.name,
            error: "File type not allowed",
          });
          continue;
        }

        // Generate file key
        const fileKey = generateFileKey(dealId, category, file.name);

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3/R2
        const { url } = await uploadFile(fileKey, buffer, file.type, {
          originalName: file.name,
          dealId,
          uploadedBy: session.user.id,
        });

        // Create document record
        const document = await prisma.document.create({
          data: {
            dealId,
            folderId: folderId || null,
            name: file.name,
            originalName: file.name,
            description: description || null,
            category: category as DocumentCategory,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: url,
            fileKey,
            uploadedById: session.user.id,
          },
          include: {
            uploadedBy: { select: { id: true, name: true } },
            folder: { select: { id: true, name: true } },
          },
        });

        // Add mimeType and url aliases for frontend compatibility
        uploadedDocuments.push({
          ...document,
          mimeType: document.fileType,
          url: document.fileUrl,
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            dealId,
            action: "UPLOADED",
            entityType: "DOCUMENT",
            entityId: document.id,
            entityName: file.name,
          },
        });
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        errors.push({
          file: file.name,
          error: "Upload failed",
        });
      }
    }

    return NextResponse.json({
      documents: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading documents:", error);
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    );
  }
}
