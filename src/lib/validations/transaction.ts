import { z } from "zod"

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Tutar pozitif olmalıdır"),
  description: z.string().min(1, "Açıklama gereklidir"),
  date: z.string().min(1, "Tarih gereklidir"),
  categoryId: z.string().min(1, "Kategori seçiniz"),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
