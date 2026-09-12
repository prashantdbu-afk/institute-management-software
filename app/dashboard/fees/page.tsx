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
import { Plus, Edit2, Trash2, Download, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { FeeForm } from "@/components/dashboard/fee-form"

interface Fee {
  id: string
  studentName: string
  studentEmail: string
  course: string
  amount: number
  dueDate: string
  paidDate?: string
  status: "pending" | "paid" | "overdue"
  paymentMethod?: string
}

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [filteredFees, setFilteredFees] = useState<Fee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)

  // Load fees from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fees")
    const initial: Fee[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            studentName: "Aditya Sharma",
            studentEmail: "aditya@example.com",
            course: "Web Development",
            amount: 5000,
            dueDate: "2025-01-25",
            paidDate: "2025-01-20",
            status: "paid",
            paymentMethod: "Online Transfer",
          },
          {
            id: "2",
            studentName: "Priya Patel",
            studentEmail: "priya@example.com",
            course: "Python Basics",
            amount: 4000,
            dueDate: "2025-01-25",
            status: "pending",
          },
          {
            id: "3",
            studentName: "Rahul Kumar",
            studentEmail: "rahul@example.com",
            course: "Advanced React",
            amount: 7000,
            dueDate: "2025-01-10",
            status: "overdue",
          },
        ]
    setFees(initial)
    setFilteredFees(initial)
  }, [])

  // Save to localStorage
  const saveFees = (updatedFees: Fee[]) => {
    localStorage.setItem("fees", JSON.stringify(updatedFees))
    setFees(updatedFees)
  }

  // Filter fees
  useEffect(() => {
    let filtered = fees.filter(
      (fee) =>
        fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.course.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterStatus !== "all") {
      filtered = filtered.filter((fee) => fee.status === filterStatus)
    }

    setFilteredFees(filtered)
  }, [searchTerm, filterStatus, fees])

  const handleAddFee = (formData: Omit<Fee, "id">) => {
    const newFee: Fee = {
      ...formData,
      id: Date.now().toString(),
    }
    saveFees([...fees, newFee])
    setOpenDialog(false)
  }

  const handleUpdateFee = (formData: Omit<Fee, "id">) => {
    if (!editingFee) return
    const updated = fees.map((f) => (f.id === editingFee.id ? { ...f, ...formData } : f))
    saveFees(updated)
    setEditingFee(null)
    setOpenDialog(false)
  }

  const handleMarkPaid = (id: string) => {
    const updated = fees.map((f) =>
      f.id === id
        ? {
            ...f,
            status: "paid" as const,
            paidDate: new Date().toISOString().split("T")[0],
            paymentMethod: "Received",
          }
        : f,
    )
    saveFees(updated)
  }

  const handleDeleteFee = (id: string) => {
    if (window.confirm("Are you sure you want to delete this fee record?")) {
      saveFees(fees.filter((f) => f.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
    }
    return colors[status] || ""
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      paid: "✓",
      pending: "⏱",
      overdue: "!",
    }
    return icons[status] || "?"
  }

  const stats = {
    total: fees.length,
    paid: fees.filter((f) => f.status === "paid").length,
    pending: fees.filter((f) => f.status === "pending").length,
    overdue: fees.filter((f) => f.status === "overdue").length,
    totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
    paidAmount: fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0),
    pendingAmount: fees
      .filter((f) => f.status === "pending" || f.status === "overdue")
      .reduce((sum, f) => sum + f.amount, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fees Management</h1>
          <p className="text-muted-foreground mt-2">Track student fee payments</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFee(null)} className="gap-2">
              <Plus size={20} />
              Add Fee Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFee ? "Edit Fee Record" : "Add New Fee"}</DialogTitle>
              <DialogDescription>
                {editingFee ? "Update fee payment details" : "Create a new fee record for student"}
              </DialogDescription>
            </DialogHeader>
            <FeeForm initialData={editingFee} onSubmit={editingFee ? handleUpdateFee : handleAddFee} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
              <DollarSign size={20} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.total} records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-green-600">Paid Amount</div>
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.paid} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-yellow-600">Pending Amount</div>
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pending + stats.overdue} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-medium text-muted-foreground">Collection Rate</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Of total fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all" onValueChange={setFilterStatus}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download size={16} />
                Export
              </Button>
            </div>

            <TabsContent value={filterStatus} className="space-y-4 mt-4">
              <Input
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {filteredFees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No fees found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Student</th>
                        <th className="text-left py-3 px-4 font-semibold">Course</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFees.map((fee) => {
                        const today = new Date().toISOString().split("T")[0]
                        const isOverdue = fee.status === "pending" && fee.dueDate < today

                        return (
                          <tr key={fee.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{fee.studentName}</div>
                                <div className="text-xs text-muted-foreground">{fee.studentEmail}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">{fee.course}</td>
                            <td className="py-3 px-4 text-right font-medium">₹{fee.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">{fee.dueDate}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  isOverdue ? getStatusColor("overdue") : getStatusColor(fee.status)
                                }`}
                              >
                                {getStatusIcon(isOverdue ? "overdue" : fee.status)}
                                {isOverdue ? "Overdue" : fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                              {fee.status === "pending" && (
                                <Button size="sm" onClick={() => handleMarkPaid(fee.id)}>
                                  Mark Paid
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingFee(fee)
                                  setOpenDialog(true)
                                }}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteFee(fee.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
