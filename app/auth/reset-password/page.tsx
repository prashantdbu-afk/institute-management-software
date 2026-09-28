"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setReady(Boolean(data.user))
      setChecking(false)
    })
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (password.length < 8) return setError("Password must contain at least 8 characters.")
    if (password !== confirmation) return setError("Passwords do not match.")

    setBusy(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError("This reset link is invalid or has expired. Request a new password-reset email.")
      setBusy(false)
      return
    }
    await supabase.auth.signOut({ scope: "local" })
    setComplete(true)
    setBusy(false)
  }

  return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a new password</CardTitle>
        <CardDescription>Choose a new password for your institute account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {complete ? <>
          <div role="status" className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">Your password has been updated successfully.</div>
          <Button asChild className="w-full"><Link href="/">Return to sign in</Link></Button>
        </> : checking ? <p role="status" className="text-sm text-muted-foreground">Validating reset link...</p> : !ready ? <>
          <p role="alert" className="text-sm text-destructive">This password-reset link is invalid or has expired.</p>
          <Button asChild className="w-full"><Link href="/auth/forgot-password">Request a new reset link</Link></Button>
        </> : <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium" htmlFor="new-password">New password
            <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} required />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="confirm-password">Confirm new password
            <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} required />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Updating..." : "Update password"}</Button>
        </form>}
      </CardContent>
    </Card>
  </main>
}
