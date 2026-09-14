import "server-only"

import { mapBatchRow } from "@/lib/batches/model"
import { mapCourseRow } from "@/lib/courses/model"
import { getBatches, getCourseReferences, getCourses } from "@/lib/supabase/queries"

export async function getAdmissionCatalog() {
  const [courseRows, batchRows, references] = await Promise.all([getCourses(), getBatches(), getCourseReferences()])
  const courses = courseRows.map((row) => mapCourseRow(row, references.branches, references.teachers))
  const batches = batchRows.map((row) => mapBatchRow(row, courses, references.teachers))
  return { branches: references.branches, courses, batches }
}
