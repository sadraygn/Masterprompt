import { createClient } from '@/lib/supabase/serverClient'
import { redirect } from 'next/navigation'
import { StudioHeader } from '@/components/studio/StudioHeader'

/**
 * Layout for the protected studio area
 * Verifies authentication on the server side
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication on the server
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // User is not authenticated, redirect to landing page
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <StudioHeader userEmail={session.user.email} />
      {children}
    </div>
  )
}