import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Açıklama gereklidir"),
  quantity: z.number().positive("Miktar pozitif olmalıdır"),
  unitPrice: z.number().min(0, "Birim fiyat 0 veya daha büyük olmalıdır"),
})

export const invoiceSchema = z.object({
  clientName: z.string().min(1, "Müşteri adı gereklidir"),
  clientEmail: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
  issueDate: z.date(),
  dueDate: z.date(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "En az bir ürün eklenmelidir"),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>
