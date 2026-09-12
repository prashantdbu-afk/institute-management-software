"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function BranchesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <h2 className="text-lg font-semibold">Branches could not be loaded</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
        <Button className="mt-4" onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  )
}
