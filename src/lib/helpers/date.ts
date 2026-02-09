import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy", { locale: tr })
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy HH:mm", { locale: tr })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr })
}
