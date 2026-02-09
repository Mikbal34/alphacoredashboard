"use client"

import { useEffect, useState } from "react"
import { MemberCard } from "@/components/team/member-card"
import { MemberForm } from "@/components/team/member-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error("Kullanıcılar yüklenirken hata oluştu")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (data: any) => {
    setIsCreating(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      toast.success("Üye başarıyla eklendi")
      setDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || "Üye eklenirken hata oluştu")
      console.error(error)
    } finally {
      setIsCreating(false)
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
            <h1 className="text-3xl font-bold tracking-tight">Takım</h1>
            <p className="text-muted-foreground">
              Takım üyelerini görüntüleyin ve yönetin
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Üye Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yeni Üye Ekle</DialogTitle>
              </DialogHeader>
              <MemberForm
                mode="create"
                onSubmit={handleCreateUser}
                isLoading={isCreating}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-muted-foreground">
        <Users className="h-4 w-4 inline mr-1" />
        {users.length} üye
      </div>

      {/* Member Grid */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Üye bulunamadı</h3>
          <p className="text-muted-foreground mt-2">
            Henüz hiç üye eklenmemiş
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <MemberCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
