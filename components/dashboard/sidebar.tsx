"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  DollarSign,
  Building2,
  LogOut,
  Settings,
  Menu,
  X,
  Package,
  FileText,
  ClipboardList,
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import type { AuthoritativeUser } from "@/lib/auth/permissions"

interface SidebarProps {
  user: AuthoritativeUser
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/")
    router.refresh()
  }

  const navItems = {
    admin: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Branches", icon: Building2, href: "/dashboard/branches" },
      { label: "Users", icon: Users, href: "/dashboard/users" },
      { label: "Courses", icon: BookOpen, href: "/dashboard/courses" },
      { label: "Admissions", icon: Users, href: "/dashboard/admissions" },
      { label: "Students", icon: Users, href: "/dashboard/students" },
      { label: "Timetable", icon: Clock, href: "/dashboard/timetable" },
      { label: "Fees", icon: DollarSign, href: "/dashboard/fees" },
      { label: "Stock", icon: Package, href: "/dashboard/stock" },
      { label: "Homework", icon: FileText, href: "/dashboard/homework" },
      { label: "Test Results", icon: ClipboardList, href: "/dashboard/test-results" },
    ],
    branch_manager: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Courses & Batches", icon: BookOpen, href: "/dashboard/courses" },
      { label: "Students", icon: Users, href: "/dashboard/students" },
      { label: "Teachers", icon: Users, href: "/dashboard/teachers" },
      { label: "Admissions", icon: Users, href: "/dashboard/admissions" },
      { label: "Timetable", icon: Clock, href: "/dashboard/timetable" },
      { label: "Fees", icon: DollarSign, href: "/dashboard/fees" },
      { label: "Stock", icon: Package, href: "/dashboard/stock" },
      { label: "Homework", icon: FileText, href: "/dashboard/homework" },
      { label: "Test Results", icon: ClipboardList, href: "/dashboard/test-results" },
    ],
    teacher: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "My Classes", icon: BookOpen, href: "/dashboard/classes" },
      { label: "Timetable", icon: Clock, href: "/dashboard/timetable" },
      { label: "Assignments", icon: BookOpen, href: "/dashboard/assignments" },
      { label: "Homework", icon: FileText, href: "/dashboard/homework" },
      { label: "Test Results", icon: ClipboardList, href: "/dashboard/test-results" },
    ],
    student: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Timetable", icon: Clock, href: "/dashboard/timetable" },
      { label: "Fees", icon: DollarSign, href: "/dashboard/fees" },
      { label: "Assignments", icon: BookOpen, href: "/dashboard/assignments" },
      { label: "Homework", icon: FileText, href: "/dashboard/homework" },
      { label: "Test Results", icon: ClipboardList, href: "/dashboard/test-results" },
    ],
  }

  const items = navItems[user?.role as keyof typeof navItems] || navItems.student

  return (
    <>
      {/* Mobile menu button */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 lg:hidden">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-0 z-40 w-64 bg-sidebar border-r border-sidebar-border
        transition-transform lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border mt-16 lg:mt-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="Genius Park Academy" fill className="object-contain" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground">Genius Park</div>
              <div className="text-xs text-sidebar-accent-foreground">Academy</div>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <p className="text-sm font-medium text-sidebar-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          <p className="text-xs text-sidebar-accent-foreground truncate">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }
                `}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            href="#settings"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-3 bg-transparent">
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
