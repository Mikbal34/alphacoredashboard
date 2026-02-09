"use client"

import { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Generic DataTable Component
 *
 * Usage:
 * const columns = [
 *   { header: "Ad", accessorKey: "name" },
 *   { header: "Email", accessorKey: "email" },
 *   { header: "Durum", accessorKey: "status", cell: (row) => <Badge>{row.status}</Badge> }
 * ]
 *
 * <DataTable columns={columns} data={users} onRowClick={(row) => router.push(`/user/${row.id}`)} />
 */

export interface DataTableColumn<T = any> {
  header: string
  accessorKey: keyof T | string
  cell?: (row: T) => ReactNode
}

interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T = any>({
  columns,
  data,
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Veri bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell
                      ? column.cell(row)
                      : String(row[column.accessorKey as keyof T] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
