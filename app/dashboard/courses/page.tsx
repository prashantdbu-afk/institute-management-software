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
import { Plus, Edit2, Trash2, BookOpen, Users, Layers } from "lucide-react"
import { CourseForm } from "@/components/dashboard/course-form"

interface Course {
  id: string
  name: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  maxStudents: number
  enrolledStudents: number
  instructor: string
  price: number
  createdAt: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLevel, setFilterLevel] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Load courses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("courses")
    const initial: Course[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "Web Development",
            description: "Learn HTML, CSS, JavaScript, React, and Node.js",
            level: "Beginner",
            duration: "3 months",
            maxStudents: 30,
            enrolledStudents: 24,
            instructor: "John Doe",
            price: 5000,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Python Basics",
            description: "Master Python programming fundamentals",
            level: "Beginner",
            duration: "2 months",
            maxStudents: 25,
            enrolledStudents: 18,
            instructor: "Jane Smith",
            price: 4000,
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Advanced React",
            description: "Deep dive into React patterns and performance optimization",
            level: "Advanced",
            duration: "2 months",
            maxStudents: 20,
            enrolledStudents: 15,
            instructor: "Mike Johnson",
            price: 7000,
            createdAt: new Date().toISOString(),
          },
        ]
    setCourses(initial)
    setFilteredCourses(initial)
  }, [])

  // Save to localStorage
  const saveCourses = (updatedCourses: Course[]) => {
    localStorage.setItem("courses", JSON.stringify(updatedCourses))
    setCourses(updatedCourses)
  }

  // Filter courses
  useEffect(() => {
    let filtered = courses.filter(
      (course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterLevel) {
      filtered = filtered.filter((course) => course.level === filterLevel)
    }

    setFilteredCourses(filtered)
  }, [searchTerm, filterLevel, courses])

  const handleAddCourse = (formData: Omit<Course, "id" | "createdAt">) => {
    const newCourse: Course = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    saveCourses([...courses, newCourse])
    setOpenDialog(false)
  }

  const handleUpdateCourse = (formData: Omit<Course, "id" | "createdAt">) => {
    if (!editingCourse) return
    const updated = courses.map((c) => (c.id === editingCourse.id ? { ...c, ...formData } : c))
    saveCourses(updated)
    setEditingCourse(null)
    setOpenDialog(false)
  }

  const handleDeleteCourse = (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      saveCourses(courses.filter((c) => c.id !== id))
    }
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Beginner: "bg-blue-100 text-blue-800",
      Intermediate: "bg-orange-100 text-orange-800",
      Advanced: "bg-red-100 text-red-800",
    }
    return colors[level] || ""
  }

  const stats = [
    { label: "Total Courses", value: courses.length, icon: BookOpen },
    { label: "Total Students", value: courses.reduce((sum, c) => sum + c.enrolledStudents, 0), icon: Users },
    {
      label: "Avg. Enrollment",
      value:
        courses.length > 0
          ? ((courses.reduce((sum, c) => sum + c.enrolledStudents, 0) / courses.length) | 0) + "%"
          : "0%",
      icon: Layers,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-2">Manage institute courses and levels</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCourse(null)} className="gap-2">
              <Plus size={20} />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              <DialogDescription>{editingCourse ? "Update course details" : "Create a new course"}</DialogDescription>
            </DialogHeader>
            <CourseForm initialData={editingCourse} onSubmit={editingCourse ? handleUpdateCourse : handleAddCourse} />
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

      {/* Courses List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by course name or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{course.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span> {course.duration}
                        </div>
                        <div>
                          <span className="font-medium">Instructor:</span> {course.instructor}
                        </div>
                        <div>
                          <span className="font-medium">Students:</span> {course.enrolledStudents}/{course.maxStudents}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> ₹{course.price}
                        </div>
                      </div>
                      <div className="mt-3 bg-muted rounded-full h-2 w-32 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(course.enrolledStudents / course.maxStudents) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCourse(course)
                          setOpenDialog(true)
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCourse(course.id)}>
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
