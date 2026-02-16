import type { TaskStatus, TaskPriority, ProjectStatus, ProjectRole } from "@/generated/prisma/client"

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Beklemede",
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam Ediyor",
  IN_REVIEW: "İncelemede",
  DONE: "Tamamlandı",
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planlama",
  ACTIVE: "Aktif",
  ON_HOLD: "Beklemede",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  TODO: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  OWNER: "Sahip",
  MEMBER: "Üye",
  VIEWER: "Görüntüleyici",
}

export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

export const DEFAULT_PAGE_SIZE = 10

export const MESSAGES = {
  SUCCESS: {
    CREATED: "Başarıyla oluşturuldu",
    UPDATED: "Başarıyla güncellendi",
    DELETED: "Başarıyla silindi",
  },
  ERROR: {
    GENERIC: "Bir hata oluştu. Lütfen tekrar deneyin",
    UNAUTHORIZED: "Bu işlem için yetkiniz yok",
    NOT_FOUND: "Kayıt bulunamadı",
  },
} as const
