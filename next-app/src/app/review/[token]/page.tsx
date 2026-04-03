import { createClient } from '@/lib/supabase/server'
import { PublicReviewPageClient } from './review-client'

export default async function PublicReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: reviewLink, error: linkError } = await supabase
    .from('review_links')
    .select(`
      id,
      workspace_id,
      type,
      is_active,
      created_at,
      expires_at,
      allow_anonymous,
      require_email,
      workspaces (
        id,
        name,
        description
      )
    `)
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (linkError || !reviewLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="text-6xl">Link</div>
          <h1 className="text-2xl font-bold">Review Link Not Found</h1>
          <p className="text-muted-foreground">
            This review link is not valid or has been deactivated
          </p>
        </div>
      </div>
    )
  }

  if (reviewLink.expires_at && new Date(reviewLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="text-6xl">Link</div>
          <h1 className="text-2xl font-bold">Review Link Not Found</h1>
          <p className="text-muted-foreground">This review link has expired</p>
        </div>
      </div>
    )
  }

  const { data: workItems, error: itemsError } = await supabase
    .from('work_items')
    .select(`
      id,
      name,
      description,
      type,
      status,
      priority,
      timeline_phase,
      created_at
    `)
    .eq('workspace_id', reviewLink.workspace_id)
    .order('created_at', { ascending: false })

  if (itemsError) {
    console.error('Error fetching work items for review page:', itemsError)
  }

  return (
    <PublicReviewPageClient
      reviewLink={reviewLink}
      workItems={workItems || []}
      workspace={Array.isArray(reviewLink.workspaces) ? reviewLink.workspaces[0] : reviewLink.workspaces}
    />
  )
}
