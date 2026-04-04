import { Skeleton } from '@/components/ui/skeleton'

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 px-8 py-6">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>

      <Skeleton className="h-[420px] rounded-2xl" />
    </div>
  )
}
