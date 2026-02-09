import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"

interface MemberCardProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function MemberCard({ user }: MemberCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Link href={`/takim/${user.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
