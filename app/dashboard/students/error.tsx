"use client"
import { Button } from "@/components/ui/button"
export default function StudentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="rounded-lg border p-8 text-center"><h2 className="text-xl font-semibold">Student enrollments could not be loaded</h2><p className="mt-2 text-sm text-muted-foreground">Please try again. If the problem continues, contact an administrator.</p><Button className="mt-4" onClick={reset}>Try again</Button></div> }
