"use client"

import { useMemo, useState, useTransition } from "react"
import { CheckCircle, Clock, Edit2, Plus, Trash2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { approveAdmissionAction, createAdmissionAction, deleteAdmissionAction, rejectAdmissionAction, updateAdmissionAction } from "@/app/dashboard/admissions/actions"
import { AdmissionForm } from "@/components/dashboard/admission-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { filterAdmissions, replaceAdmission, type AdmissionFormData, type AdmissionViewModel } from "@/lib/admissions/model"
import type { BatchViewModel } from "@/lib/batches/model"
import type { BranchOption, CourseViewModel } from "@/lib/courses/model"

interface Props { initialAdmissions: AdmissionViewModel[]; branches: BranchOption[]; courses: CourseViewModel[]; batches: BatchViewModel[] }

export function AdmissionsClient({ initialAdmissions, branches, courses, batches }: Props) {
  const [admissions, setAdmissions] = useState(initialAdmissions)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdmissionViewModel | null>(null)
  const [isPending, startTransition] = useTransition()
  const filtered = useMemo(() => filterAdmissions(admissions, search, status), [admissions, search, status])
  const counts = useMemo(() => ({ total: admissions.length, pending: admissions.filter((a) => a.status === "pending").length, approved: admissions.filter((a) => a.status === "approved").length, rejected: admissions.filter((a) => a.status === "rejected").length }), [admissions])

  const save = (data: AdmissionFormData) => new Promise<void>((resolve) => startTransition(async () => {
    const result = editing ? await updateAdmissionAction(editing.id, data) : await createAdmissionAction(data)
    if (!result.ok) toast.error(result.error)
    else { setAdmissions((current) => editing ? replaceAdmission(current, result.admission) : [result.admission, ...current]); setOpen(false); setEditing(null); toast.success(editing ? "Admission updated." : "Application created.") }
    resolve()
  }))
  const changeStatus = (id: string, operation: "approve" | "reject") => startTransition(async () => {
    const result = operation === "approve" ? await approveAdmissionAction(id) : await rejectAdmissionAction(id)
    if (!result.ok) { toast.error(result.error); return }
    setAdmissions((current) => replaceAdmission(current, result.admission))
    toast.success(operation === "approve" ? "Admission approved and enrollment created." : "Admission rejected.")
  })
  const remove = (id: string) => {
    if (!window.confirm("Permanently delete this admission? This cannot be undone.")) return
    startTransition(async () => { const result = await deleteAdmissionAction(id); if (!result.ok) { toast.error(result.error); return }; setAdmissions((current) => current.filter((item) => item.id !== id)); toast.success("Admission deleted.") })
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold">Admissions</h1><p className="mt-2 text-muted-foreground">Manage student applications and enrollment approval</p></div>
      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null) }}><DialogTrigger asChild><Button disabled={!branches.length} onClick={() => setEditing(null)}><Plus className="mr-2" size={18} />New Application</Button></DialogTrigger><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? "Edit Admission" : "New Admission Application"}</DialogTitle><DialogDescription>Status is controlled by Approve and Reject actions.</DialogDescription></DialogHeader><AdmissionForm key={editing?.id ?? "new"} initialData={editing} branches={branches} courses={courses} batches={batches} isSubmitting={isPending} onSubmit={save} /></DialogContent></Dialog>
    </div>
    {!branches.length && <p role="alert" className="rounded-md border p-4 text-sm">Create a branch, course, and batch before adding an admission.</p>}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Object.entries(counts).map(([key, value]) => <Card key={key}><CardHeader className="pb-2 text-sm capitalize text-muted-foreground">{key === "total" ? "Total Applications" : key}</CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>)}</div>
    <Card><CardContent className="pt-6"><Tabs value={status} onValueChange={setStatus}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="approved">Approved</TabsTrigger><TabsTrigger value="rejected">Rejected</TabsTrigger></TabsList><TabsContent value={status} className="mt-4 space-y-4"><Input aria-label="Search admissions" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {!filtered.length ? <p className="py-12 text-center text-muted-foreground">No admissions found</p> : <div className="space-y-3">{filtered.map((item) => <article key={item.id} className="rounded-lg border p-4"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><StatusIcon status={item.status} /><h2 className="font-semibold">{item.studentName}</h2><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{item.status}</span></div><p className="mt-1 text-sm text-muted-foreground">Parent: {item.parentName || "Not provided"}</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><span>{item.email}</span><span>{item.phone || "No phone"}</span><span>{item.branchName} · {item.courseName}</span><span>{item.batchName}</span></div><p className="mt-3 text-xs text-muted-foreground">Applied: {item.appliedDate || "Unknown"}{item.enrollmentDate ? ` · Enrolled: ${item.enrollmentDate}` : ""}</p></div><div className="flex flex-wrap gap-2">{item.status === "pending" && <><Button size="sm" disabled={isPending} onClick={() => changeStatus(item.id, "approve")}>Approve</Button><Button size="sm" variant="destructive" disabled={isPending} onClick={() => changeStatus(item.id, "reject")}>Reject</Button><Button size="icon" variant="outline" aria-label={`Edit ${item.studentName}`} onClick={() => { setEditing(item); setOpen(true) }}><Edit2 size={16} /></Button></>}<Button size="icon" variant="destructive" aria-label={`Delete ${item.studentName}`} disabled={isPending} onClick={() => remove(item.id)}><Trash2 size={16} /></Button></div></div></article>)}</div>}
    </TabsContent></Tabs></CardContent></Card>
  </div>
}

function StatusIcon({ status }: { status: AdmissionViewModel["status"] }) {
  if (status === "approved") return <CheckCircle className="text-green-600" size={20} />
  if (status === "rejected") return <XCircle className="text-red-600" size={20} />
  return <Clock className="text-yellow-600" size={20} />
}
