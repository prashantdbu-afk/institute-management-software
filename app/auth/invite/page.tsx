"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = fragment.get("access_token")
      const refreshToken = fragment.get("refresh_token")
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        window.history.replaceState({}, "", "/auth/invite")
        if (sessionError) { setError("This invitation is invalid or has expired. Ask an administrator to resend it."); return }
      }
      const code = new URLSearchParams(window.location.search).get("code")
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        window.history.replaceState({}, "", "/auth/invite")
        if (exchangeError) { setError("This invitation is invalid or has expired. Ask an administrator to resend it."); return }
      }
      const { data } = await supabase.auth.getSession()
      setReady(!!data.session)
      if (!data.session) setError("This invitation is invalid or has expired. Ask an administrator to resend it.")
    })()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) return setError("Password must contain at least 8 characters.")
    setBusy(true); setError("")
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) { setError("We could not finish accepting this invitation. Please request a new invitation."); setBusy(false); return }
    router.replace("/dashboard"); router.refresh()
  }

  return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
    <Card className="w-full max-w-md"><CardHeader><CardTitle>Accept invitation</CardTitle><CardDescription>Create a password to finish activating your institute account.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-4"><label className="block space-y-2 text-sm font-medium">New password<Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={!ready || busy} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={!ready || busy}>{busy ? "Activating..." : "Activate account"}</Button></form></CardContent>
    </Card>
  </main>
}
