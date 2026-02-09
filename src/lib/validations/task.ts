import { z } from "zod"

export const taskSchema = z.object({
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, "Proje seçiniz"),
  assigneeId: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>
