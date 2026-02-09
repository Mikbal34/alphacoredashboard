"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Settings, User, Lock, Mail } from "lucide-react"
import { toast } from "sonner"

const profileSchema = z.object({
  name: z.string().min(1, "İsim gereklidir"),
  email: z.string().email("Geçerli bir email giriniz"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name,
        email: session.user.email,
      })
    }
  }, [session])

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    setIsUpdatingProfile(true)
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
        },
      })

      toast.success("Profil başarıyla güncellendi")
    } catch (error: any) {
      toast.error(error.message || "Profil güncellenirken hata oluştu")
      console.error(error)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (data: PasswordFormValues) => {
    setIsUpdatingPassword(true)
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name,
          email: session?.user?.email,
          password: data.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update password")
      }

      toast.success("Şifre başarıyla güncellendi")
      passwordForm.reset()
    } catch (error: any) {
      toast.error(error.message || "Şifre güncellenirken hata oluştu")
      console.error(error)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Hesap ayarlarınızı yönetin
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Bilgileri
            </CardTitle>
            <CardDescription>
              İsim ve email adresinizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleUpdateProfile)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="ahmet@example.com"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Şifre Değiştir
            </CardTitle>
            <CardDescription>
              Hesap güvenliğiniz için güçlü bir şifre kullanın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handleUpdatePassword)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Şifre</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
