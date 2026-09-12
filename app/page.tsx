"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.log("[v0] Auth error:", authError.message)
        setError(authError.message || "Invalid email or password")
        return
      }

      if (data.user) {
        console.log("[v0] Login successful for user:", data.user.email)
        // Store user info in localStorage for client-side use
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.user.email,
            id: data.user.id,
            role: data.user.user_metadata?.role || "student",
            loginTime: new Date().toISOString(),
          }),
        )
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.log("[v0] Login error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { email: "admin@genius.com", password: "admin123", role: "Admin" },
    { email: "manager@genius.com", password: "manager123", role: "Branch Manager" },
    { email: "teacher@genius.com", password: "teacher123", role: "Teacher" },
    { email: "student@genius.com", password: "student123", role: "Student" },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Genius Park Academy" className="h-24 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">Genius Park Academy</CardTitle>
            <CardDescription className="text-base">One Goal, One Passion - Child Development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@genius.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t space-y-3">
              <p className="text-xs text-muted-foreground font-semibold">Demo Accounts:</p>
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                  className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors border border-transparent hover:border-muted-foreground/20"
                >
                  <div className="font-medium text-foreground">{account.role}</div>
                  <div className="text-muted-foreground text-xs">{account.email}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
