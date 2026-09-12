"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit2, Trash2, CheckCircle, Clock, XCircle } from "lucide-react"
import { AdmissionForm } from "@/components/dashboard/admission-form"

interface Admission {
  id: string
  studentName: string
  parentName: string
  email: string
  phone: string
  course: string
  batch: string
  status: "pending" | "approved" | "rejected"
  appliedDate: string
  enrollmentDate?: string
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [filteredAdmissions, setFilteredAdmissions] = useState<Admission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null)

  // Load admissions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admissions")
    const initial: Admission[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            studentName: "Aditya Sharma",
            parentName: "Rajesh Sharma",
            email: "aditya@example.com",
            phone: "+91-98765-43210",
            course: "Web Development",
            batch: "Batch A",
            status: "approved",
            appliedDate: "2024-12-15",
            enrollmentDate: "2025-01-01",
          },
          {
            id: "2",
            studentName: "Priya Patel",
            parentName: "Vikram Patel",
            email: "priya@example.com",
            phone: "+91-98765-43211",
            course: "Python Basics",
            batch: "Batch B",
            status: "pending",
            appliedDate: "2025-01-10",
          },
        ]
    setAdmissions(initial)
    setFilteredAdmissions(initial)
  }, [])

  // Save to localStorage
  const saveAdmissions = (updatedAdmissions: Admission[]) => {
    localStorage.setItem("admissions", JSON.stringify(updatedAdmissions))
    setAdmissions(updatedAdmissions)
  }

  // Filter admissions
  useEffect(() => {
    let filtered = admissions.filter(
      (adm) =>
        adm.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.phone.includes(searchTerm),
    )

    if (filterStatus !== "all") {
      filtered = filtered.filter((adm) => adm.status === filterStatus)
    }

    setFilteredAdmissions(filtered)
  }, [searchTerm, filterStatus, admissions])

  const handleAddAdmission = (formData: Omit<Admission, "id" | "appliedDate">) => {
    const newAdmission: Admission = {
      ...formData,
      id: Date.now().toString(),
      appliedDate: new Date().toISOString().split("T")[0],
    }
    saveAdmissions([...admissions, newAdmission])
    setOpenDialog(false)
  }

  const handleUpdateAdmission = (formData: Omit<Admission, "id" | "appliedDate">) => {
    if (!editingAdmission) return
    const updated = admissions.map((a) =>
      a.id === editingAdmission.id ? { ...a, ...formData, appliedDate: editingAdmission.appliedDate } : a,
    )
    saveAdmissions(updated)
    setEditingAdmission(null)
    setOpenDialog(false)
  }

  const handleApproveAdmission = (id: string) => {
    const updated = admissions.map((a) =>
      a.id === id ? { ...a, status: "approved", enrollmentDate: new Date().toISOString().split("T")[0] } : a,
    )
    saveAdmissions(updated)
  }

  const handleRejectAdmission = (id: string) => {
    const updated = admissions.map((a) => (a.id === id ? { ...a, status: "rejected" } : a))
    saveAdmissions(updated)
  }

  const handleDeleteAdmission = (id: string) => {
    if (window.confirm("Are you sure you want to delete this admission?")) {
      saveAdmissions(admissions.filter((a) => a.id !== id))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-600" size={20} />
      case "rejected":
        return <XCircle className="text-red-600" size={20} />
      default:
        return <Clock className="text-yellow-600" size={20} />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    }
    return badges[status] || ""
  }

  const stats = {
    total: admissions.length,
    pending: admissions.filter((a) => a.status === "pending").length,
    approved: admissions.filter((a) => a.status === "approved").length,
    rejected: admissions.filter((a) => a.status === "rejected").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admissions</h1>
          <p className="text-muted-foreground mt-2">Manage student admissions and enrollment</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAdmission(null)} className="gap-2">
              <Plus size={20} />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAdmission ? "Edit Admission" : "New Admission Application"}</DialogTitle>
              <DialogDescription>
                {editingAdmission ? "Update admission details" : "Register a new student admission"}
              </DialogDescription>
            </DialogHeader>
            <AdmissionForm
              initialData={editingAdmission}
              onSubmit={editingAdmission ? handleUpdateAdmission : handleAddAdmission}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-medium text-muted-foreground">Total Applications</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-medium text-yellow-600">Pending</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-medium text-green-600">Approved</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-medium text-red-600">Rejected</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all" onValueChange={setFilterStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={filterStatus} className="space-y-4 mt-4">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {filteredAdmissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No admissions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdmissions.map((admission) => (
                    <div key={admission.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{admission.studentName}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(admission.status)}`}
                            >
                              {admission.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Parent: {admission.parentName}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Email:</span> {admission.email}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone:</span> {admission.phone}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Course:</span> {admission.course}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Batch:</span> {admission.batch}
                            </div>
                          </div>
                          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
                            <span>Applied: {admission.appliedDate}</span>
                            {admission.enrollmentDate && <span>Enrolled: {admission.enrollmentDate}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          {admission.status === "pending" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleApproveAdmission(admission.id)}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectAdmission(admission.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAdmission(admission)
                              setOpenDialog(true)
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteAdmission(admission.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
