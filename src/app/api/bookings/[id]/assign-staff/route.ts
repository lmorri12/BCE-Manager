import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";
import { notifyStaffAssigned, notifyAllTasksComplete } from "@/lib/notifications";
import type { StaffType, TaskArea } from "@prisma/client";
import { auditLog } from "@/lib/audit";

const STAFF_TYPE_TO_TASK_AREA: Partial<Record<StaffType, TaskArea>> = {
  TECHNICIAN: "TECH",
  BAR_VOLUNTEER: "BAR",
  FOH_VOLUNTEER: "FOH",
  DUTY_MANAGER: "FOH",
  STAIR_CLIMBER_OPERATOR: "STAIR_CLIMBER",
};

const ROLE_ALLOWED_STAFF_TYPES: Record<string, StaffType[]> = {
  SUPER_USER: ["TECHNICIAN", "BAR_VOLUNTEER", "FOH_VOLUNTEER", "DUTY_MANAGER", "STAIR_CLIMBER_OPERATOR"],
  BOOKINGS_ADMIN: ["FOH_VOLUNTEER", "DUTY_MANAGER", "STAIR_CLIMBER_OPERATOR"],
  TECH_ADMIN: ["TECHNICIAN", "STAIR_CLIMBER_OPERATOR"],
  BAR_ADMIN: ["BAR_VOLUNTEER"],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { staffName, staffPhone, role } = await request.json() as {
      staffName: string;
      staffPhone?: string;
      role: StaffType;
    };

    if (!staffName?.trim()) {
      return NextResponse.json({ error: "Staff name is required" }, { status: 400 });
    }

    // Check user can assign this staff type
    const allowed = ROLE_ALLOWED_STAFF_TYPES[session.user.role] || [];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: "You don't have permission to assign this staff type" },
        { status: 403 }
      );
    }

    const assignment = await prisma.eventStaff.create({
      data: {
        bookingId: id,
        role,
        staffName: staffName.trim(),
        staffPhone: staffPhone?.trim() || null,
      },
    });

    // Auto-complete the corresponding booking task
    const taskArea = STAFF_TYPE_TO_TASK_AREA[role];
    if (taskArea) {
      await prisma.bookingTask.updateMany({
        where: {
          bookingId: id,
          area: taskArea,
          completed: false,
        },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    // Check if all tasks are now complete
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (booking) {
      const allComplete = booking.tasks.every((t) => t.completed);
      if (allComplete && booking.tasks.length > 0) {
        await prisma.booking.update({
          where: { id },
          data: { status: "READY" },
        });
        await notifyAllTasksComplete(booking);
      }

      if (taskArea) {
        await notifyStaffAssigned(booking, taskArea);
      }
    }

    const eventName = booking?.eventName || booking?.eventNameTBC || "Unnamed";
    await auditLog({
      action: "STAFF_ASSIGNED",
      entity: "Booking",
      entityId: id,
      summary: `Assigned ${staffName} as ${role.replace(/_/g, " ")} to "${eventName}"`,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
    }

    const assignment = await prisma.eventStaff.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.bookingId !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowed = ROLE_ALLOWED_STAFF_TYPES[session.user.role] || [];
    if (!allowed.includes(assignment.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.eventStaff.delete({ where: { id: assignmentId } });

    // Reopen the corresponding task if no other staff of matching type remain
    const taskArea = STAFF_TYPE_TO_TASK_AREA[assignment.role];
    if (taskArea) {
      const remaining = await prisma.eventStaff.count({
        where: { bookingId: id, role: assignment.role },
      });
      if (remaining === 0) {
        await prisma.bookingTask.updateMany({
          where: { bookingId: id, area: taskArea },
          data: { completed: false, completedAt: null },
        });
        await prisma.booking.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
