"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { TimetableForm } from "@/components/dashboard/timetable-form"

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  course: string
  batch: string
  teacher: string
  room: string
}

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  // Load timetable from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("timetable")
    const initial: TimeSlot[] = saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            day: "Monday",
            startTime: "08:00",
            endTime: "09:00",
            course: "Web Development",
            batch: "Batch A",
            teacher: "John Doe",
            room: "Room 101",
          },
          {
            id: "2",
            day: "Monday",
            startTime: "09:00",
            endTime: "10:00",
            course: "Python Basics",
            batch: "Batch B",
            teacher: "Jane Smith",
            room: "Room 102",
          },
          {
            id: "3",
            day: "Tuesday",
            startTime: "10:00",
            endTime: "11:00",
            course: "Web Development",
            batch: "Batch A",
            teacher: "John Doe",
            room: "Room 101",
          },
        ]
    setSlots(initial)
  }, [])

  // Save to localStorage
  const saveSlots = (updatedSlots: TimeSlot[]) => {
    localStorage.setItem("timetable", JSON.stringify(updatedSlots))
    setSlots(updatedSlots)
  }

  const handleAddSlot = (formData: Omit<TimeSlot, "id">) => {
    const newSlot: TimeSlot = {
      ...formData,
      id: Date.now().toString(),
    }
    saveSlots([...slots, newSlot])
    setOpenDialog(false)
  }

  const handleUpdateSlot = (formData: Omit<TimeSlot, "id">) => {
    if (!editingSlot) return
    const updated = slots.map((s) => (s.id === editingSlot.id ? { ...s, ...formData } : s))
    saveSlots(updated)
    setEditingSlot(null)
    setOpenDialog(false)
  }

  const handleDeleteSlot = (id: string) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      saveSlots(slots.filter((s) => s.id !== id))
    }
  }

  const getDaySlots = (day: string) =>
    slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const getTimeColor = (index: number) => {
    const colors = [
      "bg-blue-50",
      "bg-green-50",
      "bg-purple-50",
      "bg-orange-50",
      "bg-pink-50",
      "bg-indigo-50",
      "bg-cyan-50",
      "bg-teal-50",
      "bg-rose-50",
      "bg-yellow-50",
    ]
    return colors[index % colors.length]
  }

  const daySlots = getDaySlots(selectedDay)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground mt-2">Manage class schedule</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSlot(null)} className="gap-2">
              <Plus size={20} />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSlot ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
              <DialogDescription>{editingSlot ? "Update class schedule" : "Create a new time slot"}</DialogDescription>
            </DialogHeader>
            <TimetableForm initialData={editingSlot} onSubmit={editingSlot ? handleUpdateSlot : handleAddSlot} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Day Selector */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <Button
                key={day}
                onClick={() => setSelectedDay(day)}
                variant={selectedDay === day ? "default" : "outline"}
              >
                {day}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Timetable Grid */}
      <div className="space-y-3">
        {daySlots.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">No classes scheduled for {selectedDay}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          daySlots.map((slot, index) => (
            <Card key={slot.id} className={getTimeColor(index)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl font-bold text-primary">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Course:</span> {slot.course}
                      </div>
                      <div>
                        <span className="font-medium">Batch:</span> {slot.batch}
                      </div>
                      <div>
                        <span className="font-medium">Teacher:</span> {slot.teacher}
                      </div>
                      <div>
                        <span className="font-medium">Room:</span> {slot.room}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSlot(slot)
                        setOpenDialog(true)
                      }}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSlot(slot.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Weekly Overview</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Time</th>
                  {days.map((day) => (
                    <th key={day} className="text-center py-3 px-4 font-semibold text-sm">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b">
                    <td className="py-3 px-4 font-medium text-sm">{time}</td>
                    {days.map((day) => {
                      const slot = slots.find((s) => s.day === day && s.startTime === time)
                      return (
                        <td key={`${day}-${time}`} className="py-3 px-4 text-center text-sm">
                          {slot ? (
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded inline-block text-xs">
                              <div className="font-medium">{slot.course}</div>
                              <div className="text-xs">{slot.room}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
