import { NextResponse, type NextRequest } from "next/server"
import { getSafeRecoveryDestination } from "@/lib/auth/recovery"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  const code = url.searchParams.get("code")
  const destination = getSafeRecoveryDestination(url.searchParams.get("next"))

  if (!code) {
    url.pathname = destination
    url.search = "?error=invalid_or_expired"
    return NextResponse.redirect(url)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  url.pathname = destination
  url.search = error ? "?error=invalid_or_expired" : ""
  return NextResponse.redirect(url)
}
