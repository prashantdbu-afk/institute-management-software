import { createClient } from "./server"
import {
  branchDatabaseRowSchema,
  type BranchCreatePayload,
  type BranchDatabaseRow,
  type BranchUpdatePayload,
} from "@/lib/branches/model"

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

export async function getProfiles() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createProfile(profile: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").insert([profile]).select()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function getCourses() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createCourse(course: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").insert([course]).select()
  if (error) throw error
  return data
}

export async function updateCourse(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("courses").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("courses").delete().eq("id", id)
  if (error) throw error
}

export async function getAdmissions() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createAdmission(admission: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").insert([admission]).select()
  if (error) throw error
  return data
}

export async function updateAdmission(id: string, updates: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("admissions").update(updates).eq("id", id).select()
  if (error) throw error
  return data
}

export async function deleteAdmission(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("admissions").delete().eq("id", id)
  if (error) throw error
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
