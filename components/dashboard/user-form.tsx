"use client"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UserFormData, UserViewModel } from "@/lib/users/model"

export function UserForm({ initialData, branches, onSubmit, isSubmitting, error }: { initialData?: UserViewModel | null; branches: { id: string; name: string }[]; onSubmit: (data: UserFormData) => void; isSubmitting: boolean; error: string }) {
  const [data, setData] = useState<UserFormData>(initialData ? { fullName: initialData.fullName, email: initialData.email, phone: initialData.phone, role: initialData.role, branchId: initialData.branchId, status: initialData.status } : { fullName: "", email: "", phone: "", role: "student", branchId: branches[0]?.id ?? null, status: "active" })
  const change = (name: keyof UserFormData, value: string) => setData((current) => ({ ...current, [name]: name === "branchId" ? (value || null) : value }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ ...data, branchId: data.role === "admin" ? null : data.branchId }) }
  return <form onSubmit={submit} className="space-y-4">
    <label className="block space-y-2 text-sm font-medium">Full Name *<Input value={data.fullName} onChange={(event) => change("fullName", event.target.value)} required disabled={isSubmitting} /></label>
    <label className="block space-y-2 text-sm font-medium">Email *<Input type="email" value={data.email} onChange={(event) => change("email", event.target.value)} required disabled={isSubmitting || !!initialData} /></label>
    <label className="block space-y-2 text-sm font-medium">Phone<Input value={data.phone} onChange={(event) => change("phone", event.target.value)} disabled={isSubmitting} /></label>
    <label className="block space-y-2 text-sm font-medium">Role *<select className="w-full rounded-md border bg-background px-3 py-2" value={data.role} onChange={(event) => change("role", event.target.value)} disabled={isSubmitting}><option value="admin">Admin</option><option value="branch_manager">Branch Manager</option><option value="teacher">Teacher</option><option value="student">Student</option></select></label>
    {data.role !== "admin" && <label className="block space-y-2 text-sm font-medium">Branch *<select className="w-full rounded-md border bg-background px-3 py-2" value={data.branchId ?? ""} onChange={(event) => change("branchId", event.target.value)} required disabled={isSubmitting}><option value="">Select a branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
    <label className="block space-y-2 text-sm font-medium">Status<select className="w-full rounded-md border bg-background px-3 py-2" value={data.status} onChange={(event) => change("status", event.target.value)} disabled={isSubmitting}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Saving..." : initialData ? "Update User" : "Send Invitation"}</Button>
  </form>
}
