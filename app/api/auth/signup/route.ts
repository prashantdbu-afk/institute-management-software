import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password, role, fullName } = await request.json()

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role || "student",
        full_name: fullName,
      },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create profile entry
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email,
        role: role || "student",
        full_name: fullName,
      },
    ])

    if (profileError) {
      console.error("Profile creation error:", profileError)
    }
  }

  return NextResponse.json(data, { status: 201 })
}
