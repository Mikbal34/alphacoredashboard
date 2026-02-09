import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı gereklidir"),
  type: z.enum(["INCOME", "EXPENSE"], {
    message: "Kategori türü gereklidir"
  }),
  color: z.string().min(1),
  icon: z.string().optional(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
