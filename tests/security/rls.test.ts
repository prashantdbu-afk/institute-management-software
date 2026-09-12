import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const migration = readFileSync(resolve(process.cwd(), "scripts/012_secure_auth_and_rls.sql"), "utf8")
const normalizedMigration = migration.replace(/\s+/g, " ")

function policy(name: string) {
  const match = normalizedMigration.match(new RegExp(`create policy ${name} .*?;`, "i"))
  if (!match) throw new Error(`Policy ${name} was not found`)
  return match[0]
}

describe("RLS security migration", () => {
  it("forces new Auth users to the student role", () => {
    const triggerFunction = normalizedMigration.match(
      /create or replace function public\.handle_new_auth_user\(\).*?\$\$;/i,
    )?.[0]

    expect(triggerFunction).toContain("'student'")
    expect(triggerFunction).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/)
    expect(triggerFunction).not.toContain("exception")
  })

  it("prevents browser clients from updating role or branch assignment", () => {
    expect(migration).toContain("revoke update on public.profiles from authenticated")
    expect(migration).toContain("grant update (full_name, phone) on public.profiles to authenticated")
  })

  it("removes anonymous access to business tables", () => {
    expect(migration).toMatch(/revoke all on public\.profiles,[\s\S]+from anon;/)
  })

  it("scopes a student fee read to their own profile ID", () => {
    const sql = policy("fees_select_scoped")
    expect(sql).toContain("student_id = auth.uid()")
    expect(sql).not.toMatch(/current_user_role\(\) = 'student'.*branch_id/)
  })

  it("scopes a student test-result read to their own profile ID", () => {
    const sql = policy("test_results_select_scoped")
    expect(sql).toContain("student_id = auth.uid()")
    expect(sql).not.toMatch(/current_user_role\(\) = 'student'.*branch_id/)
  })

  it("scopes a student homework-submission read to their own profile ID", () => {
    const sql = policy("submissions_select_scoped")
    expect(sql).toContain("student_id = auth.uid()")
    expect(sql).not.toMatch(/current_user_role\(\) = 'student'.*branch_id/)
  })

  it.each([
    "courses_select_scoped",
    "batches_select_scoped",
    "admissions_management_select",
    "timetable_select_scoped",
    "stock_management_select",
    "homework_select_scoped",
    "test_results_select_scoped",
    "fees_select_scoped",
  ])("requires branch managers to match their authoritative branch in %s", (name) => {
    const sql = policy(name)
    expect(sql).toContain("current_user_role() = 'branch_manager'")
    expect(sql).toMatch(/branch_id = public\.current_user_branch_id\(\)|id = public\.current_user_branch_id\(\)/)
  })

  it("never lets a user read a branch other than their authoritative branch", () => {
    expect(policy("branches_select_scoped")).toContain("id = public.current_user_branch_id()")
  })

  it.each([
    "courses_manage_scoped",
    "batches_manage_scoped",
    "admissions_management_write",
    "timetable_management_write",
    "stock_management_write",
    "homework_management_write",
    "submissions_staff_update",
    "test_results_staff_write",
    "fees_management_write",
  ])("prevents branch managers writing outside their authoritative branch in %s", (name) => {
    expect(policy(name)).toContain("branch_id = public.current_user_branch_id()")
  })

  it.each(["courses_select_scoped", "batches_select_scoped", "timetable_select_scoped", "homework_select_scoped"])(
    "does not grant students branch-wide access through %s",
    (name) => {
      expect(policy(name)).not.toContain("current_user_role() = 'student'")
    },
  )

  it("limits teacher test-result access to their assigned course and branch", () => {
    const sql = policy("test_results_select_scoped")
    expect(sql).toContain("c.instructor_id = auth.uid()")
    expect(sql).toContain("c.branch_id = public.current_user_branch_id()")
    expect(sql).toContain("branch_id = c.branch_id")
  })

  it("is transactional and drops every Phase 1 policy before recreating it", () => {
    expect(normalizedMigration.startsWith("-- Phase 1 security baseline.")).toBe(true)
    expect(normalizedMigration).toContain(" begin;")
    expect(normalizedMigration.trim().endsWith("commit;")).toBe(true)

    const createdPolicies = [...normalizedMigration.matchAll(/create policy (\w+)/gi)].map((match) => match[1])
    for (const name of createdPolicies) {
      expect(normalizedMigration).toContain(`drop policy if exists ${name}`)
    }
  })
})
