import{AssessmentsClient}from"@/components/dashboard/assessments-client"
import{requireRole}from"@/lib/auth/server"
import{mapAssessment}from"@/lib/assessments/model"
import{getAcademicReferences,getAssessments}from"@/lib/supabase/queries"
export default async function Page(){const user=await requireRole(["admin","branch_manager","teacher","student"]);const[rows,refs]=await Promise.all([getAssessments(),getAcademicReferences()]);return <AssessmentsClient user={user} initialRows={rows.map(x=>mapAssessment(x,refs))} refs={refs}/>}
