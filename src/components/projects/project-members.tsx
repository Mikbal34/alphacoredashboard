"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { UserPlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PROJECT_ROLE_LABELS } from "@/lib/constants"
import type { ProjectRole } from "@/generated/prisma/client"

interface Member {
  id: string
  role: ProjectRole
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface ProjectMembersProps {
  projectId: string
  members: Member[]
  onMembersChange: () => void
}

const ROLE_COLORS: Record<ProjectRole, string> = {
  OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  MEMBER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  VIEWER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

export function ProjectMembers({ projectId, members, onMembersChange }: ProjectMembersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("MEMBER")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchUsers()
    }
  }, [isAddDialogOpen])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const users = await response.json()
        setAllUsers(users)
      }
    } catch (error) {
      console.error("Fetch users error:", error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Üye eklenemedi")
      }

      toast.success("Üye başarıyla eklendi")
      setIsAddDialogOpen(false)
      setSelectedUserId("")
      setSelectedRole("MEMBER")
      onMembersChange()
    } catch (error: any) {
      toast.error(error.message || "Üye eklenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = async (memberId: string, role: ProjectRole) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) throw new Error("Rol güncellenemedi")

      toast.success("Rol güncellendi")
      onMembersChange()
    } catch {
      toast.error("Rol güncellenirken bir hata oluştu")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Üye çıkarılamadı")
      }

      toast.success("Üye projeden çıkarıldı")
      onMembersChange()
    } catch (error: any) {
      toast.error(error.message || "Üye çıkarılırken bir hata oluştu")
    }
  }

  const memberUserIds = new Set(members.map((m) => m.user.id))
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Proje Üyeleri ({members.length})
        </h3>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Üye Ekle
        </Button>
      </div>

      <div className="divide-y rounded-md border">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {member.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleRoleChange(member.id, value as ProjectRole)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Badge
                    variant="secondary"
                    className={ROLE_COLORS[member.role]}
                  >
                    {PROJECT_ROLE_LABELS[member.role]}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Sahip</SelectItem>
                  <SelectItem value="MEMBER">Üye</SelectItem>
                  <SelectItem value="VIEWER">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveMember(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Ekle</DialogTitle>
            <DialogDescription>
              Projeye yeni bir üye ekleyin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kullanıcı</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Eklenecek kullanıcı yok
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as ProjectRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Sahip</SelectItem>
                  <SelectItem value="MEMBER">Üye</SelectItem>
                  <SelectItem value="VIEWER">Görüntüleyici</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || isSubmitting}
            >
              {isSubmitting ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
