"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, FileText, CheckCircle } from "lucide-react"

interface HomeworkItem {
  id: string
  title: string
  subject: string
  course: string
  description: string
  dueDate: string
  assignedBy: string
  submittedBy?: string[]
}

export default function HomeworkPage() {
  const [assignments, setAssignments] = useState<HomeworkItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    course: "",
    description: "",
    dueDate: "",
    assignedBy: "",
  })

  useEffect(() => {
    const saved = localStorage.getItem("homework_assignments")
    if (saved) setAssignments(JSON.parse(saved))
    else {
      const initialAssignments: HomeworkItem[] = [
        {
          id: "1",
          title: "Chapter 5 Exercises",
          subject: "Mathematics",
          course: "Grade 10 Math",
          description: "Complete all exercises from Chapter 5 (Q1-50)",
          dueDate: "2024-01-20",
          assignedBy: "Mr. John Smith",
          submittedBy: ["student1", "student2"],
        },
        {
          id: "2",
          title: "Essay on Climate Change",
          subject: "Environmental Science",
          course: "Grade 10 Science",
          description: "Write a 500-word essay on climate change impacts",
          dueDate: "2024-01-22",
          assignedBy: "Ms. Sarah Johnson",
          submittedBy: [],
        },
      ]
      setAssignments(initialAssignments)
      localStorage.setItem("homework_assignments", JSON.stringify(initialAssignments))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedAssignments = editingId
      ? assignments.map((a) => (a.id === editingId ? { ...a, ...formData } : a))
      : [...assignments, { ...formData, id: Date.now().toString(), submittedBy: [] }]
    setAssignments(updatedAssignments)
    localStorage.setItem("homework_assignments", JSON.stringify(updatedAssignments))
    setFormData({ title: "", subject: "", course: "", description: "", dueDate: "", assignedBy: "" })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: HomeworkItem) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const updated = assignments.filter((a) => a.id !== id)
    setAssignments(updated)
    localStorage.setItem("homework_assignments", JSON.stringify(updated))
  }

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "pending") return matchesSearch && a.submittedBy!.length === 0
    if (filterStatus === "submitted") return matchesSearch && a.submittedBy!.length > 0
    return matchesSearch
  })

  const pendingCount = assignments.filter((a) => a.submittedBy!.length === 0).length
  const submittedCount = assignments.filter((a) => a.submittedBy!.length > 0).length
  const overduCount = assignments.filter((a) => new Date(a.dueDate) < new Date()).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="text-primary" />
            Homework Management
          </h1>
          <p className="text-muted-foreground mt-1">Create and track homework assignments</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ title: "", subject: "", course: "", description: "", dueDate: "", assignedBy: "" })
          }}
        >
          <Plus size={20} />
          {showForm ? "Cancel" : "Assign Homework"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Assignments</p>
          <p className="text-2xl font-bold text-primary">{assignments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Submission</p>
          <p className="text-2xl font-bold text-destructive">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-orange-600">{overduCount}</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Assignment" : "Create New Assignment"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Assignment title"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics, Science"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Course</label>
              <Input
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="Course name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Assignment details and instructions"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Assigned By</label>
              <Input
                value={formData.assignedBy}
                onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                placeholder="Teacher name"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                {editingId ? "Update Assignment" : "Create Assignment"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by title or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
            All
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "submitted" ? "default" : "outline"}
            onClick={() => setFilterStatus("submitted")}
          >
            Submitted
          </Button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                    {assignment.submittedBy!.length > 0 && <CheckCircle size={18} className="text-green-600" />}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subject</p>
                      <p className="font-medium">{assignment.subject}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course</p>
                      <p className="font-medium">{assignment.course}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p
                        className={`font-medium ${new Date(assignment.dueDate) < new Date() ? "text-destructive" : ""}`}
                      >
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assigned By</p>
                      <p className="font-medium">{assignment.assignedBy}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">{assignment.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No assignments found</p>
          </Card>
        )}
      </div>
    </div>
  )
}
