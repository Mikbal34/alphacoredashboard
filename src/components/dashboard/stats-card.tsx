import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  trend?: number
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const isPositiveTrend = trend && trend > 0
  const isNegativeTrend = trend && trend < 0

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-muted rounded-lg">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
            {trend !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isPositiveTrend && "text-green-600",
                  isNegativeTrend && "text-red-600"
                )}
              >
                {isPositiveTrend && <TrendingUp className="h-3 w-3" />}
                {isNegativeTrend && <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
