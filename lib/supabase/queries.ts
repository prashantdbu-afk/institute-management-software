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
import { timetableDatabaseRowSchema, type TimetableCreatePayload, type TimetableDatabaseRow, type TimetableReferences, type TimetableUpdatePayload } from "@/lib/timetable/model"
import { homeworkDatabaseRowSchema, submissionDatabaseRowSchema, type HomeworkCreatePayload, type HomeworkDatabaseRow, type HomeworkReferences, type HomeworkUpdatePayload, type SubmissionCreatePayload, type SubmissionDatabaseRow, type SubmissionReviewPayload } from "@/lib/homework/model"
import {assessmentRowSchema,type AssessmentFormData,type AssessmentRefs} from "@/lib/assessments/model"
import {feeRowSchema,type FeeFormData,type FeeRefs} from "@/lib/fees/model"
import {stockRowSchema,type StockFormData} from "@/lib/stock/model"
import{emptyDashboardMetrics,type DashboardMetrics}from"@/lib/dashboard/metrics"
import type{AuthoritativeUser}from"@/lib/auth/permissions"

const branchColumns = "id,name,address,address_line_1,address_line_2,city,district,state,pin_code,country,phone,email,principal_name,created_at,updated_at"

export async function getBranches(): Promise<BranchDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("branches").select(branchColumns).order("created_at", { ascending: false })
  if (error) throw error
  return branchDatabaseRowSchema.array().parse(data)
}

const branchPayload=(branch:BranchCreatePayload)=>({name:branch.name,address:branch.addressLine1,address_line_1:branch.addressLine1,address_line_2:branch.addressLine2||null,city:branch.city,district:branch.district||null,state:branch.state,pin_code:branch.pinCode,country:"India",phone:branch.phone||null,email:branch.email})
export async function createBranch(branch: BranchCreatePayload): Promise<BranchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("branches").insert(branchPayload(branch)).select(branchColumns).single()
  if (error) throw error
  return branchDatabaseRowSchema.parse(data)
}

export async function updateBranch(id: string, updates: BranchUpdatePayload): Promise<BranchDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("branches")
    .update(branchPayload(updates as BranchCreatePayload))
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

const timetableColumns = "id, day_of_week, start_time, end_time, course_id, batch_id, teacher_id, room_number, branch_id, created_at, updated_at"

export async function getTimetable(): Promise<TimetableDatabaseRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").select(timetableColumns).order("day_of_week").order("start_time")
  if (error) throw error
  return timetableDatabaseRowSchema.array().parse(data)
}

export async function getTimetableEntry(id:string):Promise<TimetableDatabaseRow>{ const supabase=await createClient();const {data,error}=await supabase.from("timetable").select(timetableColumns).eq("id",id).single();if(error)throw error;return timetableDatabaseRowSchema.parse(data) }

export async function getTimetableReferences():Promise<TimetableReferences>{
  const supabase=await createClient()
  const [branches,courses,batches,teachers,assignments]=await Promise.all([
    supabase.from("branches").select("id,name").order("name"),
    supabase.from("courses").select("id,name,branch_id").order("name"),
    supabase.from("batches").select("id,name,course_id,branch_id").order("name"),
    supabase.from("profiles").select("id,full_name,email,branch_id").eq("role","teacher").eq("status","active").order("full_name"),
    supabase.from("teacher_course_assignments").select("teacher_id,course_id,branch_id").eq("status","active"),
  ])
  for(const result of [branches,courses,batches,teachers,assignments]) if(result.error) throw result.error
  return {
    branches:(branches.data??[]).map(row=>({id:String(row.id),name:String(row.name)})),
    courses:(courses.data??[]).filter(row=>row.branch_id).map(row=>({id:String(row.id),name:String(row.name),branchId:String(row.branch_id)})),
    batches:(batches.data??[]).filter(row=>row.branch_id).map(row=>({id:String(row.id),name:String(row.name),courseId:String(row.course_id),branchId:String(row.branch_id)})),
    teachers:(teachers.data??[]).filter(row=>row.branch_id).map(row=>({id:String(row.id),name:String(row.full_name||row.email),branchId:String(row.branch_id)})),
    assignments:(assignments.data??[]).map(row=>({teacherId:String(row.teacher_id),courseId:String(row.course_id),branchId:String(row.branch_id)})),
  }
}

export async function createTimetableEntry(entry: TimetableCreatePayload):Promise<TimetableDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").insert(entry).select(timetableColumns).single()
  if (error) throw error
  return timetableDatabaseRowSchema.parse(data)
}

export async function updateTimetableEntry(id: string, updates: TimetableUpdatePayload):Promise<TimetableDatabaseRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").update(updates).eq("id", id).select(timetableColumns).single()
  if (error) throw error
  return timetableDatabaseRowSchema.parse(data)
}

export async function deleteTimetableEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("timetable").delete().eq("id", id).select("id").single()
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

const homeworkColumns="id,title,description,course_id,batch_id,teacher_id,assigned_date,due_date,branch_id,created_at,updated_at"
const submissionColumns="id,homework_id,student_id,submitted_date,submitted_at,submission_content,status,marks,teacher_feedback,created_at,updated_at"
export async function getHomework():Promise<HomeworkDatabaseRow[]>{const s=await createClient();const{data,error}=await s.from("homework").select(homeworkColumns).order("due_date");if(error)throw error;return homeworkDatabaseRowSchema.array().parse(data)}
export async function getHomeworkEntry(id:string):Promise<HomeworkDatabaseRow>{const s=await createClient();const{data,error}=await s.from("homework").select(homeworkColumns).eq("id",id).single();if(error)throw error;return homeworkDatabaseRowSchema.parse(data)}
export async function getHomeworkSubmissions():Promise<SubmissionDatabaseRow[]>{const s=await createClient();const{data,error}=await s.from("homework_submissions").select(submissionColumns).order("created_at");if(error)throw error;return submissionDatabaseRowSchema.array().parse(data)}
export async function getHomeworkStudentNames(ids:string[]){if(!ids.length)return new Map<string,string>();const s=await createClient();const{data,error}=await s.from("profiles").select("id,full_name,email").in("id",ids);if(error)throw error;return new Map((data??[]).map(x=>[String(x.id),String(x.full_name||x.email)]))}
export async function getHomeworkReferences():Promise<HomeworkReferences>{const s=await createClient();const [branches,courses,batches,teachers,assignments]=await Promise.all([s.from("branches").select("id,name").order("name"),s.from("courses").select("id,name,branch_id").order("name"),s.from("batches").select("id,name,course_id,branch_id").order("name"),s.from("profiles").select("id,full_name,email,branch_id").eq("role","teacher").eq("status","active").order("full_name"),s.from("teacher_course_assignments").select("teacher_id,course_id,branch_id").eq("status","active")]);for(const r of[branches,courses,batches,teachers,assignments])if(r.error)throw r.error;return{branches:(branches.data??[]).map(x=>({id:String(x.id),name:String(x.name)})),courses:(courses.data??[]).filter(x=>x.branch_id).map(x=>({id:String(x.id),name:String(x.name),branchId:String(x.branch_id)})),batches:(batches.data??[]).filter(x=>x.branch_id).map(x=>({id:String(x.id),name:String(x.name),courseId:String(x.course_id),branchId:String(x.branch_id)})),teachers:(teachers.data??[]).filter(x=>x.branch_id).map(x=>({id:String(x.id),name:String(x.full_name||x.email),branchId:String(x.branch_id)})),assignments:(assignments.data??[]).map(x=>({teacherId:String(x.teacher_id),courseId:String(x.course_id),branchId:String(x.branch_id)}))}}
export async function createHomework(homework:HomeworkCreatePayload):Promise<HomeworkDatabaseRow>{const s=await createClient();const{data,error}=await s.from("homework").insert(homework).select(homeworkColumns).single();if(error)throw error;return homeworkDatabaseRowSchema.parse(data)}
export async function updateHomework(id:string,updates:HomeworkUpdatePayload):Promise<HomeworkDatabaseRow>{const s=await createClient();const{data,error}=await s.from("homework").update(updates).eq("id",id).select(homeworkColumns).single();if(error)throw error;return homeworkDatabaseRowSchema.parse(data)}
export async function deleteHomework(id:string){const s=await createClient();const{error}=await s.from("homework").delete().eq("id",id).select("id").single();if(error)throw error}
export async function createHomeworkSubmission(payload:SubmissionCreatePayload):Promise<SubmissionDatabaseRow>{const s=await createClient();const{data,error}=await s.from("homework_submissions").insert(payload).select(submissionColumns).single();if(error)throw error;return submissionDatabaseRowSchema.parse(data)}
export async function reviewHomeworkSubmission(id:string,payload:SubmissionReviewPayload):Promise<SubmissionDatabaseRow>{const s=await createClient();const{data,error}=await s.from("homework_submissions").update(payload).eq("id",id).select(submissionColumns).single();if(error)throw error;return submissionDatabaseRowSchema.parse(data)}

const assessmentColumns="id,student_id,course_id,batch_id,teacher_id,branch_id,test_name,subject,marks_obtained,total_marks,percentage,grade,test_date,notes,created_at,updated_at"
export async function getAssessments(){const s=await createClient();const{data,error}=await s.from("test_results").select(assessmentColumns).order("test_date",{ascending:false});if(error)throw error;return assessmentRowSchema.array().parse(data)}
export async function createAssessment(x:AssessmentFormData){const s=await createClient();const{data,error}=await s.from("test_results").insert({student_id:x.studentId,course_id:x.courseId,batch_id:x.batchId,teacher_id:x.teacherId,branch_id:x.branchId,test_name:x.testName,subject:x.subject,marks_obtained:x.marksObtained,total_marks:x.totalMarks,test_date:x.testDate,notes:x.notes||null}).select(assessmentColumns).single();if(error)throw error;return assessmentRowSchema.parse(data)}
export async function updateAssessment(id:string,x:AssessmentFormData){const s=await createClient();const{data,error}=await s.from("test_results").update({student_id:x.studentId,course_id:x.courseId,batch_id:x.batchId,teacher_id:x.teacherId,branch_id:x.branchId,test_name:x.testName,subject:x.subject,marks_obtained:x.marksObtained,total_marks:x.totalMarks,test_date:x.testDate,notes:x.notes||null}).eq("id",id).select(assessmentColumns).single();if(error)throw error;return assessmentRowSchema.parse(data)}
export async function deleteAssessment(id:string){const s=await createClient();const{error}=await s.from("test_results").delete().eq("id",id).select("id").single();if(error)throw error}

export async function getAcademicReferences():Promise<AssessmentRefs>{const s=await createClient();const[branches,courses,batches,teachers,enrollments,students]=await Promise.all([s.from("branches").select("id,name"),s.from("courses").select("id,name,branch_id"),s.from("batches").select("id,name,course_id,branch_id"),s.from("profiles").select("id,full_name,email,branch_id").eq("role","teacher").eq("status","active"),s.from("student_enrollments").select("student_id,branch_id,course_id,batch_id").eq("status","active").not("student_id","is",null),s.from("profiles").select("id,full_name,email,branch_id").eq("role","student").eq("status","active")]);for(const r of[branches,courses,batches,teachers,enrollments,students])if(r.error)throw r.error;return{branches:(branches.data??[]).map(x=>({id:String(x.id),name:String(x.name)})),courses:(courses.data??[]).map(x=>({id:String(x.id),name:String(x.name),branchId:String(x.branch_id)})),batches:(batches.data??[]).map(x=>({id:String(x.id),name:String(x.name),courseId:String(x.course_id),branchId:String(x.branch_id)})),teachers:(teachers.data??[]).map(x=>({id:String(x.id),name:String(x.full_name||x.email),branchId:String(x.branch_id)})),students:(enrollments.data??[]).flatMap(e=>{const p=(students.data??[]).find(x=>x.id===e.student_id);return p?[{id:String(p.id),name:String(p.full_name||p.email),branchId:String(e.branch_id),courseId:String(e.course_id),batchId:String(e.batch_id)}]:[]})}}

const feeColumns="id,student_id,branch_id,course_id,batch_id,total_amount,amount_paid,due_date,payment_date,payment_method,status,notes,created_at,updated_at"
export async function getFeeRows(){const s=await createClient();const{data,error}=await s.from("fees").select(feeColumns).order("due_date");if(error)throw error;return feeRowSchema.array().parse(data)}
const feePayload=(x:FeeFormData)=>({student_id:x.studentId,branch_id:x.branchId,course_id:x.courseId,batch_id:x.batchId,total_amount:x.totalAmount,amount_paid:x.amountPaid,due_date:x.dueDate,payment_date:x.paymentDate||null,payment_method:x.paymentMethod||null,notes:x.notes||null,amount:x.totalAmount})
export async function createFeeRow(x:FeeFormData){const s=await createClient();const{data,error}=await s.from("fees").insert(feePayload(x)).select(feeColumns).single();if(error)throw error;return feeRowSchema.parse(data)}
export async function updateFeeRow(id:string,x:FeeFormData){const s=await createClient();const{data,error}=await s.from("fees").update(feePayload(x)).eq("id",id).select(feeColumns).single();if(error)throw error;return feeRowSchema.parse(data)}
export async function deleteFeeRow(id:string){const s=await createClient();const{error}=await s.from("fees").delete().eq("id",id).select("id").single();if(error)throw error}
export async function getFeeReferences():Promise<FeeRefs>{return getAcademicReferences()}

const stockColumns="id,item_name,category,quantity,minimum_stock,unit_price,supplier,branch_id,created_at,updated_at"
export async function getStockRows(){const s=await createClient();const{data,error}=await s.from("stock").select(stockColumns).order("item_name");if(error)throw error;return stockRowSchema.array().parse(data)}
const stockPayload=(x:StockFormData)=>({item_name:x.itemName,category:x.category||null,quantity:x.quantity,minimum_stock:x.minimumStock,unit_price:x.unitPrice,supplier:x.supplier||null,branch_id:x.branchId})
export async function createStockRow(x:StockFormData){const s=await createClient();const{data,error}=await s.from("stock").insert(stockPayload(x)).select(stockColumns).single();if(error)throw error;return stockRowSchema.parse(data)}
export async function updateStockRow(id:string,x:StockFormData){const s=await createClient();const{data,error}=await s.from("stock").update(stockPayload(x)).eq("id",id).select(stockColumns).single();if(error)throw error;return stockRowSchema.parse(data)}
export async function deleteStockRow(id:string){const s=await createClient();const{error}=await s.from("stock").delete().eq("id",id).select("id").single();if(error)throw error}

export async function getDashboardMetrics(user:AuthoritativeUser):Promise<DashboardMetrics>{const s=await createClient(),m=emptyDashboardMetrics();const count=async(table:string,configure?:(q:any)=>any)=>{let q=s.from(table).select("*",{count:"exact",head:true});if(configure)q=configure(q);const{count,error}=await q;if(error)throw error;return count??0};const [branches,courses,batches,enrollments,teachers,pending,homework,results,classes,fees]=await Promise.all([count("branches"),count("courses"),count("batches",q=>q.eq("status","active")),count("student_enrollments",q=>q.eq("status","active")),count("profiles",q=>q.eq("role","teacher").eq("status","active")),count("admissions",q=>q.eq("status","pending")),count("homework"),count("test_results"),count("timetable"),s.from("fees").select("total_amount,amount_paid")]);if(fees.error)throw fees.error;Object.assign(m,{branches,courses,batches,students:enrollments,teachers,pendingAdmissions:pending,homework,results,classes});for(const f of fees.data??[]){m.feesAssigned+=Number(f.total_amount);m.feesCollected+=Number(f.amount_paid);m.feesOutstanding+=Math.max(0,Number(f.total_amount)-Number(f.amount_paid))}if(user.role==="student")m.students=enrollments;return m}

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
