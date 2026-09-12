import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAppUrl } from "@/lib/server-env"
import { publicSignupSchema } from "@/lib/auth/signup"

export async function POST(request: Request) {
  let input
  try {
    input = publicSignupSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid signup request" }, { status: 400 })
  }

  const { email, password, firstName, lastName } = input

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      emailRedirectTo: `${getAppUrl(request.url)}/dashboard`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      requiresEmailConfirmation: !data.session,
    },
    { status: 201 },
  )
}
