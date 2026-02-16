import { Session } from "next-auth"
import type { ProjectMember } from "@/generated/prisma/client"

export function isAdmin(session: Session): boolean {
  return session.user.role === "ADMIN"
}

export function getUserFilter(session: Session): string | undefined {
  return isAdmin(session) ? undefined : session.user.id
}

export function canAccessProject(
  session: Session,
  members: Pick<ProjectMember, "userId">[]
): boolean {
  if (isAdmin(session)) return true
  return members.some((m) => m.userId === session.user.id)
}

export function canManageProject(
  session: Session,
  members: Pick<ProjectMember, "userId" | "role">[]
): boolean {
  if (isAdmin(session)) return true
  return members.some(
    (m) => m.userId === session.user.id && m.role === "OWNER"
  )
}
