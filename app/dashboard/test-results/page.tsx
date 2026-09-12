"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, ClipboardList } from "lucide-react"

interface TestResult {
  id: string
  studentName: string
  studentId: string
  subject: string
  testName: string
  totalMarks: number
  marksObtained: number
  percentage: number
  date: string
  notes?: string
}

export default function TestResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    subject: "",
    testName: "",
    totalMarks: 100,
    marksObtained: 0,
    date: "",
    notes: "",
  })

  useEffect(() => {
    const saved = localStorage.getItem("test_results")
    if (saved) setResults(JSON.parse(saved))
    else {
      const initialResults: TestResult[] = [
        {
          id: "1",
          studentName: "John Doe",
          studentId: "STU001",
          subject: "Mathematics",
          testName: "Mid-Term Test",
          totalMarks: 100,
          marksObtained: 85,
          percentage: 85,
          date: "2024-01-15",
        },
        {
          id: "2",
          studentName: "Jane Smith",
          studentId: "STU002",
          subject: "English",
          testName: "Unit Test",
          totalMarks: 50,
          marksObtained: 42,
          percentage: 84,
          date: "2024-01-16",
        },
        {
          id: "3",
          studentName: "John Doe",
          studentId: "STU001",
          subject: "Science",
          testName: "Quiz",
          totalMarks: 30,
          marksObtained: 24,
          percentage: 80,
          date: "2024-01-17",
        },
      ]
      setResults(initialResults)
      localStorage.setItem("test_results", JSON.stringify(initialResults))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const percentage =
      (Number.parseFloat(formData.marksObtained.toString()) / Number.parseFloat(formData.totalMarks.toString())) * 100
    const newResult = {
      ...formData,
      percentage: Math.round(percentage * 100) / 100,
      id: editingId || Date.now().toString(),
    }

    const updatedResults = editingId
      ? results.map((r) => (r.id === editingId ? newResult : r))
      : [...results, newResult]

    setResults(updatedResults)
    localStorage.setItem("test_results", JSON.stringify(updatedResults))
    setFormData({
      studentName: "",
      studentId: "",
      subject: "",
      testName: "",
      totalMarks: 100,
      marksObtained: 0,
      date: "",
      notes: "",
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: TestResult) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const updated = results.filter((r) => r.id !== id)
    setResults(updated)
    localStorage.setItem("test_results", JSON.stringify(updated))
  }

  const subjects = [...new Set(results.map((r) => r.subject))]
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterSubject === "all") return matchesSearch
    return matchesSearch && r.subject === filterSubject
  })

  const avgPercentage =
    results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + r.percentage, 0) / results.length) * 100) / 100
      : 0
  const topScore = results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0
  const lowScore = results.length > 0 ? Math.min(...results.map((r) => r.percentage)) : 0

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="text-primary" />
            Test Results Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage student test scores</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              studentName: "",
              studentId: "",
              subject: "",
              testName: "",
              totalMarks: 100,
              marksObtained: 0,
              date: "",
              notes: "",
            })
          }}
        >
          <Plus size={20} />
          {showForm ? "Cancel" : "Add Result"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Results</p>
          <p className="text-2xl font-bold text-primary">{results.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-2xl font-bold text-primary">{avgPercentage}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Highest Score</p>
          <p className="text-2xl font-bold text-green-600">{topScore}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lowest Score</p>
          <p className="text-2xl font-bold text-destructive">{lowScore}%</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Test Result" : "Add New Test Result"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Student Name *</label>
              <Input
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Student name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Student ID</label>
              <Input
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="Student ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics, English"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Test Name</label>
              <Input
                value={formData.testName}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                placeholder="e.g., Mid-Term, Quiz"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Total Marks</label>
              <Input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: Number.parseFloat(e.target.value) })}
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Marks Obtained *</label>
              <Input
                type="number"
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: Number.parseFloat(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Test Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                {editingId ? "Update Result" : "Add Result"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by student name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
        >
          <option value="all">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Results List */}
      <div className="grid gap-4">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{result.studentName}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{result.studentId}</span>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${
                        result.percentage >= 80
                          ? "bg-green-100 text-green-800"
                          : result.percentage >= 60
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      Grade: {getGrade(result.percentage)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subject</p>
                      <p className="font-medium">{result.subject}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test</p>
                      <p className="font-medium">{result.testName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Score</p>
                      <p className="font-medium">
                        {result.marksObtained}/{result.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Percentage</p>
                      <p className="font-bold text-primary">{result.percentage}%</p>
                    </div>
                  </div>
                  {result.notes && <p className="text-sm mt-2 text-muted-foreground">Notes: {result.notes}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(result)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(result.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No test results found</p>
          </Card>
        )}
      </div>
    </div>
  )
}
