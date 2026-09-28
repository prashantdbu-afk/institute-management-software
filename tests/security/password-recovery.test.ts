import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { getSafeRecoveryDestination, PASSWORD_RESET_PATH } from "../../lib/auth/recovery"

describe("password recovery", () => {
  it("rejects open redirects from the auth callback", () => {
    expect(getSafeRecoveryDestination("https://attacker.example")).toBe(PASSWORD_RESET_PATH)
    expect(getSafeRecoveryDestination("//attacker.example")).toBe(PASSWORD_RESET_PATH)
    expect(getSafeRecoveryDestination("/dashboard")).toBe(PASSWORD_RESET_PATH)
    expect(getSafeRecoveryDestination(PASSWORD_RESET_PATH)).toBe(PASSWORD_RESET_PATH)
  })

  it("uses a PKCE callback and does not expose account existence", () => {
    const forgot = readFileSync("app/auth/forgot-password/page.tsx", "utf8")
    const callback = readFileSync("app/auth/callback/route.ts", "utf8")
    expect(forgot).toContain("resetPasswordForEmail")
    expect(forgot).toContain("If an account exists for that email")
    expect(callback).toContain("exchangeCodeForSession")
    expect(callback).not.toContain("access_token")
  })

  it("requires a valid recovery user before changing the password", () => {
    const reset = readFileSync("app/auth/reset-password/page.tsx", "utf8")
    expect(reset).toContain("supabase.auth.getUser()")
    expect(reset).toContain("supabase.auth.updateUser({ password })")
    expect(reset).toContain('signOut({ scope: "local" })')
    expect(reset).toContain("password.length < 8")
    expect(reset).toContain("password !== confirmation")
  })
})
