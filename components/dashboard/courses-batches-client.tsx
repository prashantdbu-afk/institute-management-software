"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarDays, Edit2, Layers, Plus, Trash2, Users } from "lucide-react"
import {
  createBatchAction,
  createCourseAction,
  deleteBatchAction,
  deleteCourseAction,
  updateBatchAction,
  updateCourseAction,
} from "@/app/dashboard/courses/actions"
import { BatchForm } from "@/components/dashboard/batch-form"
import { CourseForm } from "@/components/dashboard/course-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { replaceBatch, type BatchFormData, type BatchViewModel } from "@/lib/batches/model"
import {
  courseLevels,
  filterCourses,
  replaceCourse,
  type BranchOption,
  type CourseFormData,
  type CourseViewModel,
  type TeacherOption,
} from "@/lib/courses/model"
import { formatINR } from "@/lib/locale/india"

interface CoursesBatchesClientProps {
  initialCourses: CourseViewModel[]
  initialBatches: BatchViewModel[]
  branches: BranchOption[]
  teachers: TeacherOption[]
}

export function CoursesBatchesClient({ initialCourses, initialBatches, branches, teachers }: CoursesBatchesClientProps) {
  const [courses, setCourses] = useState(initialCourses)
  const [batches, setBatches] = useState(initialBatches)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLevel, setFilterLevel] = useState("")
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseViewModel | null>(null)
  const [editingBatch, setEditingBatch] = useState<BatchViewModel | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [mutationError, setMutationError] = useState("")
  const filteredCourses = useMemo(() => filterCourses(courses, searchTerm, filterLevel), [courses, filterLevel, searchTerm])
  const totalCapacity = batches.reduce((sum, batch) => sum + batch.capacity, 0)
  const totalEnrollment = batches.reduce((sum, batch) => sum + batch.currentEnrollment, 0)

  const openCourseDialog = (course: CourseViewModel | null = null) => {
    setEditingCourse(course)
    setMutationError("")
    setCourseDialogOpen(true)
  }

  const openBatchDialog = (batch: BatchViewModel | null = null) => {
    setEditingBatch(batch)
    setMutationError("")
    setBatchDialogOpen(true)
  }

  const closeCourseDialog = (open: boolean) => {
    if (isMutating) return
    setCourseDialogOpen(open)
    if (!open) setEditingCourse(null)
  }

  const closeBatchDialog = (open: boolean) => {
    if (isMutating) return
    setBatchDialogOpen(open)
    if (!open) setEditingBatch(null)
  }

  const handleCourseSubmit = async (data: CourseFormData) => {
    setIsMutating(true)
    setMutationError("")
    try {
      const result = editingCourse ? await updateCourseAction(editingCourse.id, data) : await createCourseAction(data)
      if (!result.ok) return setMutationError(result.error)
      setCourses((current) => editingCourse ? replaceCourse(current, result.course) : [result.course, ...current])
      setCourseDialogOpen(false)
      setEditingCourse(null)
    } catch {
      setMutationError(`Unable to ${editingCourse ? "update" : "create"} the course. Please try again.`)
    } finally {
      setIsMutating(false)
    }
  }

  const handleBatchSubmit = async (data: BatchFormData) => {
    setIsMutating(true)
    setMutationError("")
    try {
      const result = editingBatch ? await updateBatchAction(editingBatch.id, data) : await createBatchAction(data)
      if (!result.ok) return setMutationError(result.error)
      setBatches((current) => editingBatch ? replaceBatch(current, result.batch) : [result.batch, ...current])
      setBatchDialogOpen(false)
      setEditingBatch(null)
    } catch {
      setMutationError(`Unable to ${editingBatch ? "update" : "create"} the batch. Please try again.`)
    } finally {
      setIsMutating(false)
    }
  }

  const handleCourseDelete = async (course: CourseViewModel) => {
    if (!window.confirm(`Delete ${course.name}? Related batches must be removed first.`)) return
    setIsMutating(true)
    setMutationError("")
    try {
      const result = await deleteCourseAction(course.id)
      if (!result.ok) return setMutationError(result.error)
      setCourses((current) => current.filter((item) => item.id !== course.id))
    } catch {
      setMutationError("Unable to delete the course. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleBatchDelete = async (batch: BatchViewModel) => {
    if (!window.confirm(`Delete ${batch.name}?`)) return
    setIsMutating(true)
    setMutationError("")
    try {
      const result = await deleteBatchAction(batch.id)
      if (!result.ok) return setMutationError(result.error)
      setBatches((current) => current.filter((item) => item.id !== batch.id))
    } catch {
      setMutationError("Unable to delete the batch. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Courses &amp; Batches</h1>
        <p className="mt-2 text-muted-foreground">Manage institute courses and their scheduled batches</p>
      </div>

      {mutationError && !courseDialogOpen && !batchDialogOpen ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{mutationError}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Courses", value: courses.length, icon: BookOpen },
          { label: "Total Batches", value: batches.length, icon: Layers },
          { label: "Batch Enrollment", value: `${totalEnrollment}/${totalCapacity}`, icon: Users },
        ].map((stat) => {
          const Icon = stat.icon
          return <Card key={stat.label}><CardHeader className="pb-2"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{stat.label}</span><Icon size={20} className="text-primary" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent></Card>
        })}
      </div>

      <Tabs defaultValue="courses">
        <TabsList><TabsTrigger value="courses">Courses</TabsTrigger><TabsTrigger value="batches">Batches</TabsTrigger></TabsList>
        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => openCourseDialog()} disabled={branches.length === 0}><Plus size={18} />Add Course</Button></div>
          <Card>
            <CardHeader><div className="flex flex-col gap-4 md:flex-row"><Input placeholder="Search by course, instructor, or branch..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="flex-1" /><select aria-label="Filter by level" value={filterLevel} onChange={(event) => setFilterLevel(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2"><option value="">All Levels</option>{courseLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></div></CardHeader>
            <CardContent>
              {filteredCourses.length === 0 ? (
                <div className="py-12 text-center"><p className="font-medium">{courses.length === 0 ? "No courses have been added yet" : "No courses found"}</p><p className="mt-1 text-sm text-muted-foreground">{branches.length === 0 ? "Create a branch before adding a course." : courses.length === 0 ? "Add the first course to get started." : "Try different filters."}</p>{courses.length === 0 && branches.length > 0 ? <Button className="mt-4" onClick={() => openCourseDialog()}><Plus size={18} />Add Course</Button> : null}</div>
              ) : <div className="grid gap-4">{filteredCourses.map((course) => <div key={course.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{course.name}</h3><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{course.level}</span></div>{course.description ? <p className="mt-1 text-sm text-muted-foreground">{course.description}</p> : null}<div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><span><strong>Branch:</strong> {course.branchName}</span><span><strong>Duration:</strong> {course.durationHours} hours</span><span><strong>Instructor:</strong> {course.instructorName ?? "Unassigned"}</span><span><strong>Price:</strong> {formatINR(course.price)}</span></div></div><div className="flex gap-2"><Button variant="outline" size="sm" aria-label={`Edit ${course.name}`} disabled={isMutating} onClick={() => openCourseDialog(course)}><Edit2 size={16} /></Button><Button variant="destructive" size="sm" aria-label={`Delete ${course.name}`} disabled={isMutating} onClick={() => handleCourseDelete(course)}><Trash2 size={16} /></Button></div></div></div>)}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => openBatchDialog()} disabled={courses.length === 0}><Plus size={18} />Add Batch</Button></div>
          <Card><CardContent className="pt-6">{batches.length === 0 ? <div className="py-12 text-center"><p className="font-medium">No batches have been added yet</p><p className="mt-1 text-sm text-muted-foreground">{courses.length === 0 ? "Create a course before adding a batch." : "Add the first batch to get started."}</p>{courses.length > 0 ? <Button className="mt-4" onClick={() => openBatchDialog()}><Plus size={18} />Add Batch</Button> : null}</div> : <div className="grid gap-4">{batches.map((batch) => <div key={batch.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">{batch.name}</h3><p className="text-sm text-muted-foreground">{batch.courseName}</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><span><strong>Teacher:</strong> {batch.teacherName ?? "Unassigned"}</span><span><strong>Capacity:</strong> {batch.currentEnrollment}/{batch.capacity}</span><span className="flex items-center gap-1"><CalendarDays size={15} /><strong>Dates:</strong> {batch.startDate || "TBD"} – {batch.endDate || "TBD"}</span></div></div><div className="flex gap-2"><Button variant="outline" size="sm" aria-label={`Edit ${batch.name}`} disabled={isMutating} onClick={() => openBatchDialog(batch)}><Edit2 size={16} /></Button><Button variant="destructive" size="sm" aria-label={`Delete ${batch.name}`} disabled={isMutating} onClick={() => handleBatchDelete(batch)}><Trash2 size={16} /></Button></div></div></div>)}</div>}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={courseDialogOpen} onOpenChange={closeCourseDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle><DialogDescription>{editingCourse ? "Update course details" : "Create a course linked to a real branch"}</DialogDescription></DialogHeader><CourseForm key={editingCourse?.id ?? "new-course"} initialData={editingCourse} branches={branches} teachers={teachers} onSubmit={handleCourseSubmit} isSubmitting={isMutating} error={mutationError} /></DialogContent></Dialog>
      <Dialog open={batchDialogOpen} onOpenChange={closeBatchDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingBatch ? "Edit Batch" : "Add New Batch"}</DialogTitle><DialogDescription>{editingBatch ? "Update batch details" : "Create a batch linked to a real course"}</DialogDescription></DialogHeader><BatchForm key={editingBatch?.id ?? "new-batch"} initialData={editingBatch} courses={courses} teachers={teachers} onSubmit={handleBatchSubmit} isSubmitting={isMutating} error={mutationError} /></DialogContent></Dialog>
    </div>
  )
}
