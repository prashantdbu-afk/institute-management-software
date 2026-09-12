import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const migration = readFileSync(resolve(process.cwd(), "scripts/012_secure_auth_and_rls.sql"), "utf8")

describe("RLS security migration", () => {
  it("forces new Auth users to the student role", () => {
    expect(migration).toContain("'student',")
    expect(migration).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/)
  })

  it("prevents browser clients from updating role or branch assignment", () => {
    expect(migration).toContain("revoke update on public.profiles from authenticated")
    expect(migration).toContain("grant update (full_name, phone) on public.profiles to authenticated")
  })

  it("removes anonymous access to business tables", () => {
    expect(migration).toMatch(/revoke all on public\.profiles,[\s\S]+from anon;/)
  })
})
