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
import { Plus, Edit2, Trash2, MapPin, Phone, Mail } from "lucide-react"
import { BranchForm } from "@/components/dashboard/branch-form"

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  students: number
  teachers: number
  createdAt: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  // Load branches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("branches")
    const initial: Branch[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "Main Campus",
            address: "123 Education St",
            city: "Mumbai",
            phone: "+91-22-1234-5678",
            email: "main@institute.com",
            students: 450,
            teachers: 35,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "West Branch",
            address: "456 Learning Ave",
            city: "Mumbai",
            phone: "+91-22-8765-4321",
            email: "west@institute.com",
            students: 320,
            teachers: 28,
            createdAt: new Date().toISOString(),
          },
        ]
    setBranches(initial)
    setFilteredBranches(initial)
  }, [])

  // Save to localStorage
  const saveBranches = (updatedBranches: Branch[]) => {
    localStorage.setItem("branches", JSON.stringify(updatedBranches))
    setBranches(updatedBranches)
    setFilteredBranches(updatedBranches)
  }

  // Filter branches
  useEffect(() => {
    const filtered = branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredBranches(filtered)
  }, [searchTerm, branches])

  const handleAddBranch = (formData: Omit<Branch, "id" | "createdAt">) => {
    const newBranch: Branch = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    saveBranches([...branches, newBranch])
    setOpenDialog(false)
  }

  const handleUpdateBranch = (formData: Omit<Branch, "id" | "createdAt">) => {
    if (!editingBranch) return
    const updated = branches.map((b) => (b.id === editingBranch.id ? { ...b, ...formData } : b))
    saveBranches(updated)
    setEditingBranch(null)
    setOpenDialog(false)
  }

  const handleDeleteBranch = (id: string) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      saveBranches(branches.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground mt-2">Manage all institute branches</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBranch(null)} className="gap-2">
              <Plus size={20} />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Update branch details" : "Create a new branch for your institute"}
              </DialogDescription>
            </DialogHeader>
            <BranchForm initialData={editingBranch} onSubmit={editingBranch ? handleUpdateBranch : handleAddBranch} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search branches by name, city, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No branches found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{branch.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>
                            {branch.address}, {branch.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span>{branch.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-6 mt-3 text-sm">
                        <span className="text-foreground font-medium">👥 {branch.students} Students</span>
                        <span className="text-foreground font-medium">👨‍🏫 {branch.teachers} Teachers</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBranch(branch)
                          setOpenDialog(true)
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBranch(branch.id)}>
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
