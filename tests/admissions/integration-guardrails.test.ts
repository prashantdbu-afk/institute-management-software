import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sql = readFileSync("scripts/014_admissions_enrollment_phase2.sql", "utf8").toLowerCase()
const normalized = sql.replace(/\s+/g, " ")

describe("Phase 2C integration guardrails", () => {
  it("authorizes pages and every mutation using authoritative roles", () => {
    expect(readFileSync("app/dashboard/admissions/page.tsx", "utf8")).toContain('requireRole(["admin", "branch_manager"])')
    expect(readFileSync("app/dashboard/students/page.tsx", "utf8")).toContain('requireRole(["admin", "branch_manager"])')
    expect(readFileSync("app/dashboard/admissions/actions.ts", "utf8").match(/requireRole\(\["admin", "branch_manager"\]\)/g)).toHaveLength(5)
  })
  it("is transactional, repeatable, and preserves institutional data", () => {
    expect(normalized).toContain("begin;")
    expect(normalized.trim().endsWith("commit;")).toBe(true)
    expect(sql).toContain("create table if not exists public.student_enrollments")
    expect(sql).toContain("drop policy if exists student_enrollments_select_scoped")
    expect(sql).not.toContain("on delete cascade")
  })
  it("enforces consistent branches and one enrollment per admission", () => {
    expect(sql).toContain("admission_id uuid not null unique")
    expect(sql).toContain("foreign key (course_id, branch_id)")
    expect(sql).toContain("foreign key (batch_id, course_id, branch_id)")
    expect(sql).toContain("on conflict (admission_id) do nothing")
    expect(sql).toContain("for update")
  })
  it("tightly scopes enrollment reads and writes", () => {
    expect(normalized).toContain("current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()")
    expect(normalized).not.toContain("current_user_role() = 'student'")
    expect(normalized).not.toContain("current_user_role() = 'teacher'")
  })
  it("does not trust the UI to approve or reject", () => {
    expect(sql).toContain("security invoker")
    expect(sql).toContain("grant execute on function public.approve_admission(uuid) to authenticated")
    expect(sql).toContain("grant execute on function public.reject_admission(uuid) to authenticated")
    expect(readFileSync("components/dashboard/admission-form.tsx", "utf8")).not.toMatch(/name=["']status["']/)
  })

  it("rejecting does not create an enrollment and enrolled admissions cannot be deleted", () => {
    const rejectFunction = normalized.match(/create or replace function public\.reject_admission.*?\$\$;/)?.[0] ?? ""
    expect(rejectFunction).not.toContain("insert into public.student_enrollments")
    expect(sql).toContain("admission_id uuid not null unique references public.admissions(id)")
  })

  it("removes Admissions and Students browser persistence and fake metrics", () => {
    const migratedFiles = ["app/dashboard/admissions/page.tsx", "app/dashboard/students/page.tsx", "components/dashboard/admission-form.tsx", "components/dashboard/admissions-client.tsx", "components/dashboard/students-client.tsx"].map((file) => readFileSync(file, "utf8")).join("\n")
    expect(migratedFiles).not.toContain("localStorage")
    expect(migratedFiles).not.toContain("92%")
    expect(migratedFiles).not.toContain("₹2.4L")
  })
})
