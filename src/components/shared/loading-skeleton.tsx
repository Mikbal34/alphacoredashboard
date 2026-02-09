import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * LoadingSkeleton Component - Reusable loading skeleton for cards
 *
 * Usage:
 * <LoadingSkeleton count={3} /> // Shows 3 skeleton cards
 * <LoadingSkeleton /> // Shows 1 skeleton card by default
 */

interface LoadingSkeletonProps {
  count?: number
  className?: string
}

export function LoadingSkeleton({ count = 1, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * TableSkeleton - Skeleton for table loading state
 *
 * Usage:
 * <TableSkeleton rows={5} columns={4} />
 */

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
