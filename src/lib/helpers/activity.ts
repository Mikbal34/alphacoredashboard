import { prisma } from "@/lib/prisma"

export async function logActivity({
  action,
  entityType,
  entityId,
  userId,
  metadata,
}: {
  action: string
  entityType: string
  entityId: string
  userId: string
  metadata?: Record<string, string | number | boolean | null>
}) {
  return prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata: metadata ?? undefined,
    },
  })
}
