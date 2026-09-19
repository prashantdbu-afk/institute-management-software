import { TimetableClient } from "@/components/dashboard/timetable-client"
import { requireRole } from "@/lib/auth/server"
import { getTimetable, getTimetableReferences } from "@/lib/supabase/queries"
import { mapTimetableRow } from "@/lib/timetable/model"

export default async function TimetablePage(){
  const user=await requireRole(["admin","branch_manager","teacher","student"])
  const [rows,references]=await Promise.all([getTimetable(),getTimetableReferences()])
  return <TimetableClient initialEntries={rows.map(row=>mapTimetableRow(row,references))} references={references} canManage={user.role==="admin"||user.role==="branch_manager"} lockedBranchId={user.role==="branch_manager"?user.branchId:null}/>
}
