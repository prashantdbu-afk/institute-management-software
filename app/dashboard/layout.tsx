import type React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireAuthoritativeUser } from "@/lib/auth/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuthoritativeUser()
  return <DashboardShell user={user}>{children}</DashboardShell>
}
