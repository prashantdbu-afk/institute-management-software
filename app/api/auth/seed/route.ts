import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const demoUsers = [
      { email: "admin@genius.com", password: "admin123", role: "admin" },
      { email: "manager@genius.com", password: "manager123", role: "branch_manager" },
      { email: "teacher@genius.com", password: "teacher123", role: "teacher" },
      { email: "student@genius.com", password: "student123", role: "student" },
    ]

    const createdUsers = []

    for (const user of demoUsers) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          user_metadata: {
            role: user.role,
            first_name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            last_name: "User",
          },
          email_confirm: true,
        })

        if (error) {
          console.log(`[v0] Error creating user ${user.email}:`, error.message)
          // User might already exist, that's okay
        } else {
          createdUsers.push({
            email: user.email,
            role: user.role,
            id: data.user?.id,
          })
          console.log(`[v0] Created user: ${user.email}`)
        }
      } catch (err) {
        console.log(`[v0] Exception creating user ${user.email}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo users seeded successfully",
      users: createdUsers,
    })
  } catch (error: any) {
    console.log("[v0] Seed error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
