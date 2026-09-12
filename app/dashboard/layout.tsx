"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { createClient } from "@/lib/supabase/client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      let currentUser = null
      if (session?.user) {
        currentUser = {
          email: session.user.email,
          role: session.user.user_metadata?.role || "student",
          id: session.user.id,
          loginTime: new Date().toISOString(),
        }
      } else {
        // Fallback to localStorage for demo accounts
        const storedUser = localStorage.getItem("user")
        if (!storedUser) {
          router.push("/")
          return
        }
        currentUser = JSON.parse(storedUser)
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
