"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { userSchema, userEditSchema, UserFormValues, UserEditFormValues } from "@/lib/validations/user"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface MemberFormProps {
  mode: "create" | "edit"
  defaultValues?: Partial<UserEditFormValues>
  onSubmit: (data: UserFormValues | UserEditFormValues) => void
  isLoading?: boolean
}

export function MemberForm({
  mode,
  defaultValues,
  onSubmit,
  isLoading,
}: MemberFormProps) {
  const form = useForm<UserFormValues | UserEditFormValues>({
    resolver: zodResolver(mode === "create" ? userSchema : userEditSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      password: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İsim</FormLabel>
              <FormControl>
                <Input placeholder="Ahmet Yılmaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="ahmet@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Şifre {mode === "edit" && "(Değiştirmek için doldurun)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={mode === "edit" ? "Boş bırakın..." : "En az 6 karakter"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Kaydediliyor..."
              : mode === "create"
              ? "Üye Ekle"
              : "Güncelle"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
