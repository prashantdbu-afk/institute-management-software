"use client"
import { Button } from "@/components/ui/button"
export default function TimetableError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="rounded-lg border p-8 text-center"><h2 className="text-xl font-semibold">Unable to load the timetable</h2><p className="mt-2 text-muted-foreground">Please try again. If the problem continues, contact an administrator.</p><Button className="mt-4" onClick={reset}>Try again</Button></div>}
