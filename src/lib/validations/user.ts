import { z } from "zod"

export const userSchema = z.object({
  name: z.string().min(1, "İsim gereklidir"),
  email: z.string().email("Geçerli bir email giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
})

export const userEditSchema = z.object({
  name: z.string().min(1, "İsim gereklidir"),
  email: z.string().email("Geçerli bir email giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır").optional().or(z.literal("")),
})

export type UserFormValues = z.infer<typeof userSchema>
export type UserEditFormValues = z.infer<typeof userEditSchema>
