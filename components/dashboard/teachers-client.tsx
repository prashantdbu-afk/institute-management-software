"use client"

import { useMemo, useState } from "react"
import { BookOpen, Edit2, Plus, UserMinus, Users } from "lucide-react"
import { archiveTeacherAction, provisionTeacherAction, updateTeacherAction } from "@/app/dashboard/teachers/actions"
import { TeacherForm } from "@/components/dashboard/teacher-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { filterTeachers, replaceTeacher, type TeacherFormData, type TeacherViewModel } from "@/lib/teachers/model"

interface TeachersClientProps {
  initialTeachers: TeacherViewModel[]
  branches: { id: string; name: string }[]
  courses: { id: string; name: string; branchId: string }[]
  canProvision: boolean
}

export function TeachersClient({ initialTeachers, branches, courses, canProvision }: TeachersClientProps) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherViewModel | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const filtered = useMemo(() => filterTeachers(teachers, search), [teachers, search])

  const openCreate = () => { setEditing(null); setMessage(""); setOpen(true) }
  const openEdit = (teacher: TeacherViewModel) => { setEditing(teacher); setMessage(""); setOpen(true) }
  const changeDialog = (value: boolean) => {
    if (busy) return
    setOpen(value)
    if (!value) { setEditing(null); setMessage("") }
  }
  const submit = async (data: TeacherFormData) => {
    setBusy(true); setMessage("")
    try {
      const result = editing ? await updateTeacherAction(editing.id, data) : await provisionTeacherAction(data)
      if (!result.ok) return setMessage(result.error)
      setTeachers((current) => editing ? replaceTeacher(current, result.teacher) : [result.teacher, ...current])
      setOpen(false); setEditing(null)
      if ("invitationSent" in result && result.invitationSent === false) {
        setMessage("Teacher created, but the email rate limit prevented delivery. Resend the invitation from Supabase Auth later.")
      }
    } catch { setMessage("Unable to save this teacher. Please try again.") }
    finally { setBusy(false) }
  }
  const archive = async (teacher: TeacherViewModel) => {
    if (!window.confirm(`Archive ${teacher.fullName}? Their Auth account is preserved.`)) return
    setBusy(true); setMessage("")
    try {
      const result = await archiveTeacherAction(teacher.id)
      if (!result.ok) return setMessage(result.error)
      setTeachers((current) => replaceTeacher(current, result.teacher))
    } catch { setMessage("Unable to archive this teacher.") }
    finally { setBusy(false) }
  }

  const active = teachers.filter((teacher) => teacher.status === "active").length
  const average = teachers.length ? Math.floor(teachers.reduce((sum, teacher) => sum + teacher.experienceYears, 0) / teachers.length) : 0

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold">Teachers</h1><p className="mt-2 text-muted-foreground">Manage Auth-backed faculty and course assignments</p></div>
      <Dialog open={open} onOpenChange={changeDialog}>
        {canProvision && <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus size={20} />Add Teacher</Button></DialogTrigger>}
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Teacher" : "Invite New Teacher"}</DialogTitle><DialogDescription>{editing ? "Update faculty details and assignments." : "Send an Auth invitation and create the teacher profile."}</DialogDescription></DialogHeader>
          <TeacherForm key={editing?.id ?? "new"} initialData={editing} branches={branches} courses={courses} onSubmit={submit} isSubmitting={busy} error={open ? message : ""} canChangeBranch={!editing && canProvision} />
        </DialogContent>
      </Dialog>
    </div>
    {message && !open && <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Stat label="Total Teachers" value={String(teachers.length)} icon={<Users size={20} />} />
      <Stat label="Active Teachers" value={String(active)} icon={<BookOpen size={20} />} />
      <Stat label="Avg. Experience" value={`${average} yrs`} icon={<Users size={20} />} />
    </div>
    <Card><CardHeader><Input placeholder="Search by name, email, specialization, or branch..." value={search} onChange={(event) => setSearch(event.target.value)} /></CardHeader>
      <CardContent>{filtered.length === 0 ? <div className="py-12 text-center text-muted-foreground">{teachers.length ? "No teachers found" : "No teachers have been provisioned"}</div> :
        <div className="space-y-3">{filtered.map((teacher) => <div key={teacher.id} className="rounded-lg border p-4 hover:bg-muted/50">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1">
            <div className="flex items-center gap-3"><h3 className="font-semibold">{teacher.fullName}</h3><span className={`rounded-full px-2 py-1 text-xs ${teacher.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{teacher.status}</span></div>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-4"><span>{teacher.email}</span><span>{teacher.phone || "No phone"}</span><span>{teacher.experienceYears} years</span><span>{teacher.branchName}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">{teacher.courseNames.length ? teacher.courseNames.map((name) => <span key={name} className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">{name}</span>) : <span className="text-sm text-muted-foreground">No course assignments</span>}</div>
          </div><div className="flex gap-2">
            <Button variant="outline" size="sm" aria-label={`Edit ${teacher.fullName}`} disabled={busy} onClick={() => openEdit(teacher)}><Edit2 size={16} /></Button>
            <Button variant="destructive" size="sm" aria-label={`Archive ${teacher.fullName}`} disabled={busy || teacher.status === "inactive"} onClick={() => archive(teacher)}><UserMinus size={16} /></Button>
          </div></div>
        </div>)}</div>}
      </CardContent>
    </Card>
  </div>
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card><CardHeader className="pb-2"><div className="flex justify-between text-sm text-muted-foreground"><span>{label}</span>{icon}</div></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
}
