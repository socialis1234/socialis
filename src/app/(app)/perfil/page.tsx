import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, tasks:task_id(title, points, network)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: myRank } = await supabase
    .from('ranking')
    .select('position, submissions_count, approval_rate')
    .eq('user_id', user.id)
    .single()

  return (
    <PerfilClient
      profile={profile}
      submissions={submissions || []}
      rankInfo={myRank}
    />
  )
}
