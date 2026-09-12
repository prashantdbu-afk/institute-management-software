export default function BranchesLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading branches...</p>
      </div>
    </div>
  )
}
