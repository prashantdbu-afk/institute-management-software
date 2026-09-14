import { TeachersClient } from "@/components/dashboard/teachers-client"
import { requireRole } from "@/lib/auth/server"
import { mapBranchRow } from "@/lib/branches/model"
import { mapCourseRow } from "@/lib/courses/model"
import { mapTeacher } from "@/lib/teachers/model"
import { getBranches, getCourseReferences, getCourses, getProfiles, getTeacherAssignments, getTeacherDetails } from "@/lib/supabase/queries"

export default async function TeachersPage() {
  const actor = await requireRole(["admin", "branch_manager"])
  const [profiles, details, assignments, branchRows, courseRows, references] = await Promise.all([getProfiles(), getTeacherDetails(), getTeacherAssignments(), getBranches(), getCourses(), getCourseReferences()])
  const branches = branchRows.map(mapBranchRow)
  const courses = courseRows.map((row) => mapCourseRow(row, references.branches, references.teachers))
  const teachers = details.map((detail) => mapTeacher(profiles.find((profile) => profile.id === detail.teacher_id), detail, assignments, branches, courses.map(({ id, name, branchId }) => ({ id, name, branchId }))))
  return <TeachersClient initialTeachers={teachers} branches={branches.map(({ id, name }) => ({ id, name }))} courses={courses.map(({ id, name, branchId }) => ({ id, name, branchId }))} canProvision={actor.role === "admin"} />
}
