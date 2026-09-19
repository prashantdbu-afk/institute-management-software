import { HomeworkClient } from "@/components/dashboard/homework-client"
import { requireRole } from "@/lib/auth/server"
import { mapHomework,mapSubmission } from "@/lib/homework/model"
import { getHomework,getHomeworkReferences,getHomeworkStudentNames,getHomeworkSubmissions } from "@/lib/supabase/queries"

export default async function HomeworkPage(){const user=await requireRole(["admin","branch_manager","teacher","student"]);const[rows,references,submissionRows]=await Promise.all([getHomework(),getHomeworkReferences(),getHomeworkSubmissions()]);const names=await getHomeworkStudentNames([...new Set(submissionRows.map(x=>x.student_id))]);const submissions=submissionRows.map(x=>mapSubmission(x,names));return <HomeworkClient initialHomework={rows.map(x=>mapHomework(x,references,submissions,user))} references={references} user={user}/>}
