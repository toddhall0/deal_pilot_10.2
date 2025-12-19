import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "ATTORNEY", "CLIENT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  firmId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

// GET /api/users/[id] - Get user details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can view their own profile, admins can view all
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        title: true,
        avatar: true,
        firmId: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        firm: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        managedClients: {
          select: {
            id: true,
            isPrimary: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can update their own profile (limited fields), admins can update all
    const isAdmin = session.user.role === "ADMIN";
    const isOwnProfile = session.user.id === id;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Non-admins can only update certain fields
    if (!isAdmin) {
      const allowedFields = ["name", "phone", "title", "password"];
      Object.keys(data).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete data[key as keyof typeof data];
        }
      });
    }

    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          id: { not: id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 409 });
      }

      data.email = data.email.toLowerCase();
    }

    // Hash password if being updated
    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
      delete data.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        title: true,
        firmId: true,
        clientId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Deactivate user (Admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow deleting yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }

    // Soft delete by setting status to INACTIVE
    const user = await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({ message: "User deactivated", user });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
