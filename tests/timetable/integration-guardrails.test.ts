import { readFileSync } from "node:fs"
import { describe,expect,it } from "vitest"

const migration=readFileSync("scripts/016_timetable_phase2.sql","utf8").toLowerCase().replace(/\s+/g," ")
const ui=[readFileSync("app/dashboard/timetable/page.tsx","utf8"),readFileSync("components/dashboard/timetable-client.tsx","utf8"),readFileSync("components/dashboard/timetable-form.tsx","utf8")].join("\n")
const actions=readFileSync("app/dashboard/timetable/actions.ts","utf8")

describe("Phase 2E timetable guardrails",()=>{
  it("is transactional, repeatable, and enables RLS",()=>{expect(migration).toContain("begin;");expect(migration).toContain("commit;");expect(migration).toContain("if not exists");expect(migration).toContain("enable row level security")})
  it("uses non-cascading relational foreign keys",()=>{expect(migration).toContain("timetable_batch_course_branch_fkey");expect(migration).toContain("timetable_teacher_course_assignment_fkey");expect(migration).not.toContain("on delete cascade")})
  it("serializes and denies all three overlap classes",()=>{expect(migration).toContain("pg_advisory_xact_lock");expect(migration).toContain("timetable_teacher_conflict");expect(migration).toContain("timetable_batch_conflict");expect(migration).toContain("timetable_room_conflict")})
  it("limits mutations to admin and own-branch managers",()=>{expect(migration).toContain("create policy timetable_insert_scoped on public.timetable for insert to authenticated with check(public.is_admin() or (public.current_user_role()='branch_manager'");expect(actions.match(/requireRole\(\["admin","branch_manager"\]\)/g)?.length).toBe(3);expect(actions).toContain("canManageTimetable")})
  it("scopes teachers and enrolled students",()=>{expect(migration).toContain("current_user_role()='teacher' and teacher_id=auth.uid()");expect(migration).toContain("current_user_role()='student'");expect(migration).toContain("e.student_id=auth.uid()");expect(migration).toContain("e.status='active'")})
  it("removes local and demo persistence",()=>{expect(ui).not.toContain("localStorage");expect(ui).not.toContain("Date.now()");expect(ui).not.toContain("John Doe");expect(ui).not.toContain("Batch A")})
})
