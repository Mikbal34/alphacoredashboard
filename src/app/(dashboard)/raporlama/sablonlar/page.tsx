"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Trash2, Edit, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface ReportSchedule {
  id: string
  name: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
  recipients: string[]
  isActive: boolean
  lastRunAt: string | null
  createdAt: string
  user: {
    name: string
  }
}

const scheduleSchema = z.object({
  name: z.string().min(1, "Rapor adı gereklidir"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  recipients: z.string().min(1, "En az bir alıcı gereklidir"),
  isActive: z.boolean(),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

const FREQUENCY_LABELS = {
  DAILY: "Günlük",
  WEEKLY: "Haftalık",
  MONTHLY: "Aylık",
}

const FREQUENCY_COLORS = {
  DAILY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WEEKLY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MONTHLY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

export default function ReportTemplatesPage() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: "",
      frequency: "WEEKLY",
      recipients: "",
      isActive: true,
    },
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  useEffect(() => {
    if (editingSchedule) {
      form.reset({
        name: editingSchedule.name,
        frequency: editingSchedule.frequency,
        recipients: editingSchedule.recipients.join(", "),
        isActive: editingSchedule.isActive,
      })
    }
  }, [editingSchedule])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/reports")
      if (!response.ok) throw new Error("Failed to fetch schedules")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      toast.error("Rapor programları yüklenirken hata oluştu")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSchedule = async (data: ScheduleFormValues) => {
    setIsCreating(true)
    try {
      const recipients = data.recipients
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          recipients,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create schedule")
      }

      toast.success("Rapor programı başarıyla oluşturuldu")
      setCreateDialogOpen(false)
      form.reset()
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || "Rapor programı oluşturulurken hata oluştu")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateSchedule = async (data: ScheduleFormValues) => {
    if (!editingSchedule) return

    setIsUpdating(true)
    try {
      const recipients = data.recipients
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)

      const response = await fetch(`/api/reports/${editingSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          recipients,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update schedule")
      }

      toast.success("Rapor programı başarıyla güncellendi")
      setEditingSchedule(null)
      form.reset()
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || "Rapor programı güncellenirken hata oluştu")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete schedule")
      }

      toast.success("Rapor programı başarıyla silindi")
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || "Rapor programı silinirken hata oluştu")
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleActive = async (schedule: ReportSchedule) => {
    try {
      const response = await fetch(`/api/reports/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !schedule.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle schedule")
      }

      toast.success(
        schedule.isActive
          ? "Rapor programı devre dışı bırakıldı"
          : "Rapor programı etkinleştirildi"
      )
      fetchSchedules()
    } catch (error) {
      toast.error("İşlem sırasında hata oluştu")
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapor Şablonları</h1>
            <p className="text-muted-foreground">
              Otomatik rapor programlarını yönetin
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Program Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yeni Rapor Programı</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateSchedule)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rapor Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Haftalık Finansal Özet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sıklık</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sıklık seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DAILY">Günlük</SelectItem>
                            <SelectItem value="WEEKLY">Haftalık</SelectItem>
                            <SelectItem value="MONTHLY">Aylık</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alıcılar</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email1@example.com, email2@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Virgül ile ayırarak birden fazla email girebilirsiniz
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Aktif</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Rapor otomatik olarak gönderilsin mi?
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">
              Henüz rapor programı yok
            </h3>
            <p className="text-muted-foreground mt-2">
              Yeni bir rapor programı oluşturarak başlayın
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {schedule.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Oluşturan: {schedule.user.name}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => handleToggleActive(schedule)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Badge
                      className={FREQUENCY_COLORS[schedule.frequency]}
                      variant="secondary"
                    >
                      {FREQUENCY_LABELS[schedule.frequency]}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 text-sm text-muted-foreground">
                      {schedule.recipients.join(", ")}
                    </div>
                  </div>

                  {schedule.lastRunAt && (
                    <div className="text-xs text-muted-foreground">
                      Son çalışma:{" "}
                      {format(new Date(schedule.lastRunAt), "d MMM yyyy, HH:mm", {
                        locale: tr,
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog
                      open={editingSchedule?.id === schedule.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingSchedule(null)
                          form.reset()
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Rapor Programını Düzenle</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(handleUpdateSchedule)}
                            className="space-y-4"
                          >
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rapor Adı</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="frequency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sıklık</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="DAILY">Günlük</SelectItem>
                                      <SelectItem value="WEEKLY">Haftalık</SelectItem>
                                      <SelectItem value="MONTHLY">Aylık</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="recipients"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alıcılar</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Aktif</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Kaydediliyor..." : "Kaydet"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu rapor programı kalıcı olarak silinecektir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={isDeleting === schedule.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting === schedule.id ? "Siliniyor..." : "Sil"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
