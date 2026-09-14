"use client"
import { useMemo, useState } from "react"
import { BarChart3, UserCheck, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { StudentEnrollmentViewModel } from "@/lib/enrollments/model"

export function StudentsClient({ students }: { students: StudentEnrollmentViewModel[] }) {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return students.filter((item) => !query || [item.name, item.email, item.course, item.batch].some((value) => value.toLowerCase().includes(query))) }, [students, search])
  const stats = [{ label: "Total Enrollments", value: students.length, icon: Users }, { label: "Active Enrollments", value: students.filter((item) => item.status === "active").length, icon: UserCheck }, { label: "Active Courses", value: new Set(students.filter((item) => item.status === "active").map((item) => item.course)).size, icon: BarChart3 }]
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Students</h1><p className="mt-2 text-muted-foreground">View student enrollments created from approved admissions</p></div>
    <div className="grid gap-4 md:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">{label}</span><Icon size={20} className="text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>)}</div>
    <Card><CardHeader><Input aria-label="Search enrollments" placeholder="Search by name, email, course, or batch..." value={search} onChange={(e) => setSearch(e.target.value)} /></CardHeader><CardContent>{!filtered.length ? <p className="py-12 text-center text-muted-foreground">No student enrollments found</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Course</th><th className="px-4 py-3 text-left">Batch</th><th className="px-4 py-3 text-left">Enrollment Date</th><th className="px-4 py-3 text-left">Status</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b"><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.email || "—"}</td><td className="px-4 py-3">{item.course}</td><td className="px-4 py-3">{item.batch}</td><td className="px-4 py-3">{item.enrollmentDate}</td><td className="px-4 py-3 capitalize">{item.status}</td></tr>)}</tbody></table></div>}</CardContent></Card>
  </div>
}
