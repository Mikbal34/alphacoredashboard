import { z } from "zod"

export const projectSchema = z.object({
  name: z.string().min(1, "Proje adı gereklidir"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  color: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
