import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/storage";

// GET /api/deals/[dealId]/documents/download/[docId] - Get download URL
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

    // Get document
    const document = await prisma.document.findFirst({
      where: { id: docId, dealId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Generate time-limited signed URL (15 minutes)
    const downloadUrl = await getSignedDownloadUrl(document.fileKey, 900);

    // Log download activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        dealId,
        action: "DOWNLOADED",
        entityType: "DOCUMENT",
        entityId: document.id,
        entityName: document.name,
      },
    });

    // Check if redirect is requested
    const redirect = request.nextUrl.searchParams.get("redirect");
    if (redirect === "true") {
      return NextResponse.redirect(downloadUrl);
    }

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
