"use client"

import type React from "react"
import type { AuthoritativeUser } from "@/lib/auth/permissions"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"

export function DashboardShell({ children, user }: { children: React.ReactNode; user: AuthoritativeUser }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
