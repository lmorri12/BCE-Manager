import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER");
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER");
    const { id } = await params;

    const { name, email, role, active, resetPassword } = await request.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;

    if (resetPassword) {
      data.passwordHash = await bcrypt.hash(resetPassword, 12);
      data.mustChangePassword = true;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("SUPER_USER");
    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot archive your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "SUPER_USER") {
      const remainingSuperUsers = await prisma.user.count({
        where: {
          role: "SUPER_USER",
          id: { not: id },
        },
      });

      if (remainingSuperUsers === 0) {
        return NextResponse.json(
          { error: "You cannot archive the last super user" },
          { status: 400 }
        );
      }
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "This user is already archived" },
        { status: 400 }
      );
    }

    const archivedUser = await prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    await auditLog({
      action: "USER_ARCHIVED",
      entity: "User",
      entityId: user.id,
      summary: `Archived user "${user.name}"`,
      changes: {
        active: { from: true, to: false },
      },
    });

    return NextResponse.json(archivedUser);
  } catch (error) {
    return handleApiError(error);
  }
}
