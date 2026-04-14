import { prisma } from "./db";
import { auth } from "./auth";

type LogParams = {
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
};

export async function auditLog(params: LogParams) {
  const session = await auth();

  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id || null,
      userName: session?.user?.name || "System",
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      summary: params.summary,
      changes: params.changes ? JSON.stringify(params.changes) : null,
    },
  });
}

/**
 * Compare two objects and return a diff of changed fields.
 * Only includes fields that actually changed.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fieldsToTrack: string[]
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of fieldsToTrack) {
    const fromVal = before[field];
    const toVal = after[field];

    // Normalise for comparison
    const fromStr = fromVal == null ? "" : String(fromVal);
    const toStr = toVal == null ? "" : String(toVal);

    if (fromStr !== toStr) {
      changes[field] = { from: fromVal ?? null, to: toVal ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
