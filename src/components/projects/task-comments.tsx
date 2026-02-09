"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  createdAt: Date | string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface TaskCommentsProps {
  taskId: string
  initialComments: Comment[]
  currentUserId: string
}

export function TaskComments({
  taskId,
  initialComments,
  currentUserId,
}: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Yorum eklenemedi")
      }

      const comment = await response.json()
      setComments([...comments, comment])
      setNewComment("")
      toast.success("Yorum eklendi")
    } catch (error) {
      console.error("Add comment error:", error)
      toast.error("Yorum eklenirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Yorumlar</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">Henüz yorum yok</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.image || undefined} />
                <AvatarFallback>
                  {comment.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Yorum ekle..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yorum Ekle
          </Button>
        </div>
      </form>
    </div>
  )
}
