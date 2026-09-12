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
import { Plus, Edit2, Trash2, Mail } from "lucide-react"
import { UserForm } from "@/components/dashboard/user-form"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "branch_manager" | "teacher" | "student"
  branch: string
  status: "active" | "inactive"
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Load users from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("users")
    const initial: User[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "Admin User",
            email: "admin@institute.com",
            role: "admin",
            branch: "All",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Manager One",
            email: "manager@institute.com",
            role: "branch_manager",
            branch: "Main Campus",
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ]
    setUsers(initial)
    setFilteredUsers(initial)
  }, [])

  // Save to localStorage
  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    setUsers(updatedUsers)
  }

  // Filter users
  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterRole) {
      filtered = filtered.filter((user) => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, filterRole, users])

  const handleAddUser = (formData: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...users, newUser]
    saveUsers(updated)
    setOpenDialog(false)
  }

  const handleUpdateUser = (formData: Omit<User, "id" | "createdAt">) => {
    if (!editingUser) return
    const updated = users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
    saveUsers(updated)
    setEditingUser(null)
    setOpenDialog(false)
  }

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      saveUsers(users.filter((u) => u.id !== id))
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      branch_manager: "bg-blue-100 text-blue-800",
      teacher: "bg-green-100 text-green-800",
      student: "bg-purple-100 text-purple-800",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    branch_manager: "Branch Manager",
    teacher: "Teacher",
    student: "Student",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">Manage system users and permissions</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)} className="gap-2">
              <Plus size={20} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>{editingUser ? "Update user details" : "Create a new system user"}</DialogDescription>
            </DialogHeader>
            <UserForm initialData={editingUser} onSubmit={editingUser ? handleUpdateUser : handleAddUser} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="branch_manager">Branch Manager</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Branch</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" />
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="py-3 px-4">{user.branch}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setOpenDialog(true)
                          }}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 size={16} />
                        </Button>
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
