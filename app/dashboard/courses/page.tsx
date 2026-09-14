import { CoursesBatchesClient } from "@/components/dashboard/courses-batches-client"
import { requireRole } from "@/lib/auth/server"
import { mapBatchRow } from "@/lib/batches/model"
import { mapCourseRow } from "@/lib/courses/model"
import { getBatches, getCourseReferences, getCourses } from "@/lib/supabase/queries"

export default async function CoursesPage() {
  await requireRole(["admin", "branch_manager"])
  const [courseRows, batchRows, references] = await Promise.all([getCourses(), getBatches(), getCourseReferences()])
  const courses = courseRows.map((row) => mapCourseRow(row, references.branches, references.teachers))
  const batches = batchRows.map((row) => mapBatchRow(row, courses, references.teachers))

  return <CoursesBatchesClient initialCourses={courses} initialBatches={batches} branches={references.branches} teachers={references.teachers} />
}
