import { createClient } from "./server"
import {
  branchDatabaseRowSchema,
  type BranchCreatePayload,
  type BranchDatabaseRow,
  type BranchUpdatePayload,
} from "@/lib/branches/model"
import {
  branchOptionRowSchema,
  courseDatabaseRowSchema,
  mapTeacherOption,
  teacherOptionRowSchema,
  type BranchOption,
  type CourseCreatePayload,
  type CourseDatabaseRow,
  type CourseUpdatePayload,
  type TeacherOption,
} from "@/lib/courses/model"
import {
  batchDatabaseRowSchema,
  type BatchCreatePayload,
  type BatchDatabaseRow,
  type BatchUpdatePayload,
} from "@/lib/batches/model"
import {
  admissionDatabaseRowSchema,
  type AdmissionCreatePayload,
  type AdmissionDatabaseRow,
  type AdmissionUpdatePayload,
} from "@/lib/admissions/model"
import { enrollmentDatabaseRowSchema, type EnrollmentDatabaseRow } from "@/lib/enrollments/model"
import { profileDatabaseRowSchema, type ProfileDatabaseRow } from "@/lib/users/model"
import { teacherAssignmentRowSchema, teacherDetailRowSchema, type TeacherAssignmentRow, type TeacherDetailRow } from "@/lib/teachers/model"

const branchColumns = "id, name, address, city, phone, email, principal_name, created_at, updated_at"

export async function getBranches(): Promise<BranchDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("branches").select(branchColumns).order("created_at", { ascending: false })
  if (error) throw error
  return branchDatabaseRowSchema.array().parse(data)
}

export async function createBranch(branch: BranchCreatePayload): Promise<BranchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("branches").insert(branch).select(branchColumns).single()
  if (error) throw error
  return branchDatabaseRowSchema.parse(data)
}

export async function updateBranch(id: string, updates: BranchUpdatePayload): Promise<BranchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("branches")
    .update(updates)
    .eq("id", id)
    .select(branchColumns)
    .single()
  if (error) throw error
  return branchDatabaseRowSchema.parse(data)
}

export async function deleteBranch(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("branches").delete().eq("id", id).select("id").single()
  if (error) throw error
}

const profileColumns = "id, email, full_name, phone, role, branch_id, status, created_at, updated_at"

export async function getProfiles(): Promise<ProfileDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select(profileColumns).order("created_at", { ascending: false })
  if (error) throw error
  return profileDatabaseRowSchema.array().parse(data)
}

export async function updateProfile(id: string, updates: Partial<Pick<ProfileDatabaseRow, "email" | "full_name" | "phone" | "role" | "branch_id" | "status">>): Promise<ProfileDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select(profileColumns).single()
  if (error) throw error
  return profileDatabaseRowSchema.parse(data)
}

export async function updateTeacherIdentity(id: string, fullName: string, phone: string): Promise<ProfileDatabaseRow> {
  const supabase = await createClient(); const { data, error } = await supabase.rpc("update_teacher_identity", { p_teacher_id: id, p_full_name: fullName, p_phone: phone })
  if (error) throw error; return profileDatabaseRowSchema.parse(data)
}

export async function getTeacherDetails(): Promise<TeacherDetailRow[]> { const supabase=await createClient(); const {data,error}=await supabase.from("teacher_details").select("teacher_id, branch_id, qualification, specialization, experience_years, status, joining_date, created_at, updated_at").order("created_at",{ascending:false}); if(error) throw error; return teacherDetailRowSchema.array().parse(data) }
export async function getTeacherAssignments(): Promise<TeacherAssignmentRow[]> { const supabase=await createClient(); const {data,error}=await supabase.from("teacher_course_assignments").select("id, teacher_id, course_id, branch_id, status, created_at, updated_at"); if(error) throw error; return teacherAssignmentRowSchema.array().parse(data) }
export async function upsertTeacherDetail(detail: Omit<TeacherDetailRow,"created_at"|"updated_at">): Promise<TeacherDetailRow> { const supabase=await createClient(); const {data,error}=await supabase.from("teacher_details").upsert(detail,{onConflict:"teacher_id"}).select().single(); if(error) throw error; return teacherDetailRowSchema.parse(data) }
export async function replaceTeacherAssignments(teacherId:string, branchId:string, courseIds:string[]) { const supabase=await createClient(); const {data,error}=await supabase.rpc("replace_teacher_course_assignments",{p_teacher_id:teacherId,p_branch_id:branchId,p_course_ids:courseIds}); if(error) throw error; return teacherAssignmentRowSchema.array().parse(data) }

const courseColumns = "id, name, description, level, duration_hours, instructor_id, price, branch_id, created_at, updated_at"
const batchColumns = "id, name, course_id, start_date, end_date, teacher_id, capacity, current_enrollment, branch_id, created_at, updated_at"

export async function getCourseReferences(): Promise<{ branches: BranchOption[]; teachers: TeacherOption[] }> {
  const supabase = await createClient()
  const [branchesResult, teachersResult] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, email, branch_id").eq("role", "teacher").order("full_name"),
  ])
  if (branchesResult.error) throw branchesResult.error
  if (teachersResult.error) throw teachersResult.error
  return {
    branches: branchOptionRowSchema.array().parse(branchesResult.data),
    teachers: teacherOptionRowSchema.array().parse(teachersResult.data).map(mapTeacherOption),
  }
}

export async function getCourses(): Promise<CourseDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").select(courseColumns).order("created_at", { ascending: false })
  if (error) throw error
  return courseDatabaseRowSchema.array().parse(data)
}

export async function getCourseById(id: string): Promise<CourseDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").select(courseColumns).eq("id", id).single()
  if (error) throw error
  return courseDatabaseRowSchema.parse(data)
}

export async function createCourse(course: CourseCreatePayload): Promise<CourseDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").insert(course).select(courseColumns).single()
  if (error) throw error
  return courseDatabaseRowSchema.parse(data)
}

export async function updateCourse(id: string, updates: CourseUpdatePayload): Promise<CourseDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").update(updates).eq("id", id).select(courseColumns).single()
  if (error) throw error
  return courseDatabaseRowSchema.parse(data)
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("courses").delete().eq("id", id).select("id").single()
  if (error) throw error
}

export async function getBatches(): Promise<BatchDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("batches").select(batchColumns).order("created_at", { ascending: false })
  if (error) throw error
  return batchDatabaseRowSchema.array().parse(data)
}

export async function createBatch(batch: BatchCreatePayload): Promise<BatchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("batches").insert(batch).select(batchColumns).single()
  if (error) throw error
  return batchDatabaseRowSchema.parse(data)
}

export async function updateBatch(id: string, updates: BatchUpdatePayload): Promise<BatchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("batches").update(updates).eq("id", id).select(batchColumns).single()
  if (error) throw error
  return batchDatabaseRowSchema.parse(data)
}

export async function deleteBatch(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("batches").delete().eq("id", id).select("id").single()
  if (error) throw error
}

const admissionColumns = "id, student_name, parent_name, email, phone, dob, address, course_id, batch_id, branch_id, status, notes, enrollment_date, created_at, updated_at"
const enrollmentColumns = "id, student_id, admission_id, branch_id, course_id, batch_id, status, enrollment_date, created_at, updated_at"

export async function getAdmissions(): Promise<AdmissionDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").select(admissionColumns).order("created_at", { ascending: false })
  if (error) throw error
  return admissionDatabaseRowSchema.array().parse(data)
}

export async function getAdmissionById(id: string): Promise<AdmissionDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").select(admissionColumns).eq("id", id).single()
  if (error) throw error
  return admissionDatabaseRowSchema.parse(data)
}

export async function createAdmission(admission: AdmissionCreatePayload): Promise<AdmissionDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").insert(admission).select(admissionColumns).single()
  if (error) throw error
  return admissionDatabaseRowSchema.parse(data)
}

export async function updateAdmission(id: string, updates: AdmissionUpdatePayload): Promise<AdmissionDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").update(updates).eq("id", id).select(admissionColumns).single()
  if (error) throw error
  return admissionDatabaseRowSchema.parse(data)
}

export async function approveAdmission(id: string): Promise<EnrollmentDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("approve_admission", { p_admission_id: id })
  if (error) throw error
  return enrollmentDatabaseRowSchema.parse(data)
}

export async function rejectAdmission(id: string): Promise<AdmissionDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("reject_admission", { p_admission_id: id })
  if (error) throw error
  return admissionDatabaseRowSchema.parse(data)
}

export async function deleteAdmission(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("admissions").delete().eq("id", id).select("id").single()
  if (error) throw error
}

export async function getStudentEnrollments(): Promise<EnrollmentDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("student_enrollments").select(enrollmentColumns).order("enrollment_date", { ascending: false })
  if (error) throw error
  return enrollmentDatabaseRowSchema.array().parse(data)
}

export async function getTimetable() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").select("*").order("day_of_week", { ascending: true })
  if (error) throw error
  return data
}

export async function createTimetableEntry(entry: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").insert([entry]).select()
  if (error) throw error
  return data
}

export async function updateTimetableEntry(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteTimetableEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("timetable").delete().eq("id", id)
  if (error) throw error
}

export async function getStock() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stock").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createStockItem(item: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stock").insert([item]).select()
  if (error) throw error
  return data
}

export async function updateStockItem(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stock").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteStockItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("stock").delete().eq("id", id)
  if (error) throw error
}

export async function getHomework() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("homework").select("*").order("due_date", { ascending: true })
  if (error) throw error
  return data
}

export async function createHomework(homework: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("homework").insert([homework]).select()
  if (error) throw error
  return data
}

export async function updateHomework(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("homework").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteHomework(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("homework").delete().eq("id", id)
  if (error) throw error
}

export async function getTestResults() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("test_results").select("*").order("test_date", { ascending: false })
  if (error) throw error
  return data
}

export async function createTestResult(result: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("test_results").insert([result]).select()
  if (error) throw error
  return data
}

export async function updateTestResult(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("test_results").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteTestResult(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("test_results").delete().eq("id", id)
  if (error) throw error
}

export async function getFees() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("fees").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createFee(fee: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("fees").insert([fee]).select()
  if (error) throw error
  return data
}

export async function updateFee(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("fees").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteFee(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("fees").delete().eq("id", id)
  if (error) throw error
}
