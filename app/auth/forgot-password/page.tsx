"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PASSWORD_RECOVERY_CALLBACK_PATH, PASSWORD_RESET_PATH } from "@/lib/auth/recovery"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")

    const redirectTo = new URL(PASSWORD_RECOVERY_CALLBACK_PATH, window.location.origin)
    redirectTo.searchParams.set("next", PASSWORD_RESET_PATH)
    const { error: requestError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo.toString(),
    })

    setBusy(false)
    if (requestError) {
      setError("We could not send a reset email right now. Please wait a moment and try again.")
      return
    }
    setSent(true)
  }

  return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your account email and we will send you a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? <div role="status" className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">
          If an account exists for that email, a password-reset link has been sent. Use the newest email and check your spam folder.
        </div> : <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium" htmlFor="recovery-email">
            Email address
            <Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} required />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</Button>
        </form>}
        <p className="text-center text-sm text-muted-foreground"><Link href="/" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
      </CardContent>
    </Card>
  </main>
}
