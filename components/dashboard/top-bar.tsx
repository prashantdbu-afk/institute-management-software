"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Bell, Settings } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export function TopBar() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10">
          <Image src="/logo.png" alt="Genius Park Academy" fill className="object-contain" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Genius Park Academy</h2>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell size={20} />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings size={20} />
        </Button>
        <Button onClick={handleLogout} variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <LogOut size={20} />
        </Button>
      </div>
    </header>
  )
}
