"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { categorySchema, CategoryFormValues } from "@/lib/validations/category"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
  icon: string | null
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
]

export default function KategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      color: "#6366f1",
      icon: "",
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        type: editingCategory.type,
        color: editingCategory.color,
        icon: editingCategory.icon || "",
      })
    } else {
      form.reset({
        name: "",
        type: "EXPENSE",
        color: "#6366f1",
        icon: "",
      })
    }
  }, [editingCategory, form])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      } else {
        toast.error("Kategoriler yüklenemedi")
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast.error("Kategoriler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: CategoryFormValues) => {
    try {
      setSubmitting(true)

      if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          toast.success("Kategori güncellendi")
          fetchCategories()
          setDialogOpen(false)
          setEditingCategory(null)
        } else {
          toast.error("Kategori güncellenemedi")
        }
      } else {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          toast.success("Kategori oluşturuldu")
          fetchCategories()
          setDialogOpen(false)
          form.reset()
        } else {
          toast.error("Kategori oluşturulamadı")
        }
      }
    } catch (error) {
      console.error("Failed to submit category:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/categories/${deletingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Kategori silindi")
        fetchCategories()
        setDeleteDialogOpen(false)
        setDeletingId(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Kategori silinemedi")
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast.error("Bir hata oluştu")
    }
  }

  const incomeCategories = categories.filter((c) => c.type === "INCOME")
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground">
            Gelir ve gider kategorilerinizi yönetin
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingCategory(null)
              form.reset()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Kategori bilgilerini güncelleyin"
                  : "Yeni bir gelir veya gider kategorisi oluşturun"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Kategori adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tür</FormLabel>
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
                          <SelectItem value="INCOME">Gelir</SelectItem>
                          <SelectItem value="EXPENSE">Gider</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renk</FormLabel>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                field.value === color
                                  ? "border-foreground scale-110"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                        <FormControl>
                          <Input
                            type="color"
                            {...field}
                            className="h-10 w-full"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İkon (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input placeholder="home, shopping, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Gelir Kategorileri</h2>
            {incomeCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz gelir kategorisi bulunmuyor
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {incomeCategories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(category.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Gelir</span>
                        {category.icon && (
                          <>
                            <span>•</span>
                            <span>{category.icon}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Gider Kategorileri</h2>
            {expenseCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz gider kategorisi bulunmuyor
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(category.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Gider</span>
                        {category.icon && (
                          <>
                            <span>•</span>
                            <span>{category.icon}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Kategoriyi silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu kategoriye ait işlemler varsa kategori
              silinemez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
