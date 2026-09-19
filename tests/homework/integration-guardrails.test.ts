import {readFileSync} from "node:fs"
import {describe,expect,it} from "vitest"
const sql=readFileSync("scripts/017_homework_submissions_phase2.sql","utf8").replace(/\s+/g," ")
const sources=["app/dashboard/homework/page.tsx","components/dashboard/homework-client.tsx","components/dashboard/homework-form.tsx"].map(x=>readFileSync(x,"utf8")).join("\n")
describe("Homework Phase 2F guardrails",()=>{
 it("is transactional and repeatable",()=>{expect(sql).toMatch(/^--.* begin;/);expect(sql.trim()).toMatch(/commit;$/);expect(sql).toContain("if not exists");expect(sql).toContain("drop policy if exists")})
 it("enables RLS without anonymous access",()=>{expect(sql).toContain("alter table public.homework enable row level security");expect(sql).toContain("alter table public.homework_submissions enable row level security");expect(sql).toContain("revoke all on public.homework,public.homework_submissions from anon,public")})
 it("requires exact active enrollment for student reads and inserts",()=>{expect(sql.match(/e.status='active'/g)?.length).toBeGreaterThanOrEqual(2);for(const field of["e.branch_id=homework.branch_id","e.course_id=homework.course_id","e.batch_id=homework.batch_id"])expect(sql).toContain(field);expect(sql).toContain("student_id=auth.uid()")})
 it("scopes teachers to owned homework and submissions",()=>{expect(sql).toContain("public.current_user_role()='teacher' and teacher_id=auth.uid()");expect(sql).toContain("h.teacher_id=auth.uid()")})
 it("exposes only relationship-required profile names",()=>{expect(sql).toContain("role='student' and public.current_user_role()='teacher'");expect(sql).toContain("s.student_id=profiles.id and h.teacher_id=auth.uid()")})
 it("prevents impersonation and duplicate submissions",()=>{expect(sql).toContain("new.student_id<>auth.uid()");expect(sql).toContain("unique index if not exists homework_submissions_homework_student_key")})
 it("protects ownership fields during review",()=>{expect(sql).toContain("grant update(status,marks,teacher_feedback)");expect(sql).not.toContain("grant update(student_id")})
 it("blocks destructive homework cascade",()=>{expect(sql).toContain("on delete restrict");expect(sql).toContain("homework_has_submissions");expect(sql).not.toMatch(/references public\.homework\(id\) on delete cascade/)})
 it("does not silently delete duplicate legacy submissions",()=>{expect(sql).toContain("Duplicate legacy homework submissions must be resolved");expect(sql).not.toContain("delete from public.homework_submissions a using")})
 it("derives late status in the database",()=>expect(sql).toContain("case when new.submitted_date>h.due_date then 'late' else 'submitted' end"))
 it("removes browser-local and demo behavior",()=>{expect(sources).not.toContain("localStorage");expect(sources).not.toContain("Date.now()");expect(sources).not.toContain("John Smith");expect(sources).not.toContain("Climate Change")})
})
