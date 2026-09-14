import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("course and batch integration guardrails", () => {
  it("authorizes the page and every mutation from authoritative roles", () => {
    const page = readFileSync("app/dashboard/courses/page.tsx", "utf8")
    const actions = readFileSync("app/dashboard/courses/actions.ts", "utf8")
    expect(page).toContain('requireRole(["admin", "branch_manager"])')
    expect(actions.match(/requireRole\(\["admin", "branch_manager"\]\)/g)).toHaveLength(6)
  })

  it("migration is transactional, repeatable, branch-consistent, and does not cascade", () => {
    const sql = readFileSync("scripts/013_courses_batches_phase2.sql", "utf8").toLowerCase()
    expect(sql).toContain("begin;")
    expect(sql).toContain("commit;")
    expect(sql).toContain("create unique index if not exists courses_id_branch_id_key")
    expect(sql).toContain("foreign key (course_id, branch_id)")
    expect(sql).toContain("not valid")
    expect(sql).not.toContain("on delete cascade")
  })
})
