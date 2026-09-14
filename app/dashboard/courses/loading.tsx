import { Loader2 } from "lucide-react"

export default function CoursesLoading() {
  return <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" aria-label="Loading courses and batches" /></div>
}
