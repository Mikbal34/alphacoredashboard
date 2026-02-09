"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const pathLabels: Record<string, string> = {
  dashboard: "Ana Sayfa",
  finans: "Finans Yönetimi",
  "gelir-gider": "Gelir / Gider",
  faturalar: "Faturalar",
  kategoriler: "Kategoriler",
  raporlar: "Raporlar",
  projeler: "Projeler",
  gorevler: "Görevlerim",
  raporlama: "Raporlama",
  sablonlar: "Şablonlar",
  "aktivite-log": "Aktivite Logu",
  takim: "Takım",
  ayarlar: "Ayarlar",
  liste: "Liste Görünümü",
}

export function Header() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = pathLabels[segment] || segment
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
