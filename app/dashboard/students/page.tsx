"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, BarChart3, TrendingUp, DollarSign } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  course: string
  batch: string
  enrollmentDate: string
  status: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Load approved admissions as students
    const saved = localStorage.getItem("admissions")
    if (saved) {
      const admissions = JSON.parse(saved)
      const enrolledStudents = admissions
        .filter((a: any) => a.status === "approved")
        .map((a: any) => ({
          id: a.id,
          name: a.studentName,
          email: a.email,
          course: a.course,
          batch: a.batch,
          enrollmentDate: a.enrollmentDate || new Date().toISOString().split("T")[0],
          status: "active",
        }))
      setStudents(enrolledStudents)
      setFilteredStudents(enrolledStudents)
    }
  }, [])

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredStudents(filtered)
  }, [searchTerm, students])

  const stats = [
    { label: "Total Students", value: students.length, icon: Users },
    { label: "Active Courses", value: new Set(students.map((s) => s.course)).size, icon: BarChart3 },
    { label: "Avg. Enrollment Rate", value: "92%", icon: TrendingUp },
    { label: "Total Fees Collected", value: "₹2.4L", icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-2">Manage enrolled students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Students List */}
      <Card>
        <CardHeader>
          <Input
            placeholder="Search by name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Course</th>
                    <th className="text-left py-3 px-4 font-semibold">Batch</th>
                    <th className="text-left py-3 px-4 font-semibold">Enrollment Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{student.name}</td>
                      <td className="py-3 px-4">{student.email}</td>
                      <td className="py-3 px-4">{student.course}</td>
                      <td className="py-3 px-4">{student.batch}</td>
                      <td className="py-3 px-4">{student.enrollmentDate}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
