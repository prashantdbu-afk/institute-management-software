import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { authorizeDashboardRequest, isUserRole } from "@/lib/auth/permissions"
import { getSupabaseEnvironment } from "@/lib/env"

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnvironment()
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    let role = null

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      role = isUserRole(profile?.role) ? profile.role : null
    }

    const decision = authorizeDashboardRequest(Boolean(user), role, request.nextUrl.pathname)
    if (decision !== "allow") {
      const url = request.nextUrl.clone()
      url.pathname = decision === "forbidden" ? "/dashboard" : "/"
      if (decision === "forbidden") url.searchParams.set("denied", "1")
      if (decision === "invalid-profile") url.searchParams.set("error", "account_configuration")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
