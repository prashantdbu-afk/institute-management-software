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
import { Plus, Edit2, Trash2, BookOpen, Users } from "lucide-react"
import { TeacherForm } from "@/components/dashboard/teacher-form"

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  qualification: string
  specialization: string
  assignedCourses: string[]
  experience: number
  status: "active" | "inactive"
  joiningDate: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Load teachers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("teachers")
    const initial: Teacher[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "John Doe",
            email: "john@institute.com",
            phone: "+91-98765-43210",
            qualification: "B.Tech",
            specialization: "Web Development",
            assignedCourses: ["Web Development"],
            experience: 8,
            status: "active",
            joiningDate: "2020-01-15",
          },
          {
            id: "2",
            name: "Jane Smith",
            email: "jane@institute.com",
            phone: "+91-98765-43211",
            qualification: "B.Sc",
            specialization: "Python",
            assignedCourses: ["Python Basics"],
            experience: 5,
            status: "active",
            joiningDate: "2021-06-01",
          },
        ]
    setTeachers(initial)
    setFilteredTeachers(initial)
  }, [])

  // Save to localStorage
  const saveTeachers = (updatedTeachers: Teacher[]) => {
    localStorage.setItem("teachers", JSON.stringify(updatedTeachers))
    setTeachers(updatedTeachers)
  }

  // Filter teachers
  useEffect(() => {
    const filtered = teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredTeachers(filtered)
  }, [searchTerm, teachers])

  const handleAddTeacher = (formData: Omit<Teacher, "id">) => {
    const newTeacher: Teacher = {
      ...formData,
      id: Date.now().toString(),
    }
    saveTeachers([...teachers, newTeacher])
    setOpenDialog(false)
  }

  const handleUpdateTeacher = (formData: Omit<Teacher, "id">) => {
    if (!editingTeacher) return
    const updated = teachers.map((t) => (t.id === editingTeacher.id ? { ...t, ...formData } : t))
    saveTeachers(updated)
    setEditingTeacher(null)
    setOpenDialog(false)
  }

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      saveTeachers(teachers.filter((t) => t.id !== id))
    }
  }

  const stats = [
    { label: "Total Teachers", value: teachers.length, icon: Users },
    { label: "Active Teachers", value: teachers.filter((t) => t.status === "active").length, icon: BookOpen },
    {
      label: "Avg. Experience",
      value:
        teachers.length > 0
          ? ((teachers.reduce((sum, t) => sum + t.experience, 0) / teachers.length) | 0) + " yrs"
          : "0 yrs",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground mt-2">Manage faculty and instructors</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTeacher(null)} className="gap-2">
              <Plus size={20} />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
              <DialogDescription>
                {editingTeacher ? "Update teacher details" : "Hire a new faculty member"}
              </DialogDescription>
            </DialogHeader>
            <TeacherForm
              initialData={editingTeacher}
              onSubmit={editingTeacher ? handleUpdateTeacher : handleAddTeacher}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  <Icon size={20} className="text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No teachers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{teacher.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            teacher.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">Email:</span> {teacher.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {teacher.phone}
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span> {teacher.experience} years
                        </div>
                        <div>
                          <span className="font-medium">Qualification:</span> {teacher.qualification}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm font-medium">Specialization:</span>
                        <div className="flex gap-2 mt-1">
                          {teacher.assignedCourses.map((course) => (
                            <span key={course} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTeacher(teacher)
                          setOpenDialog(true)
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
