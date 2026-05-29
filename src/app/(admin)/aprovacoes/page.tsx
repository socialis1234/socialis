import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AprovacoesClient from './AprovacoesClient'

export default async function AprovacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'curador', 'super_admin'].includes(profile.role)) {
    redirect('/desafios')
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (name, email, instagram),
      tasks:task_id (title, points, network, frequency)
    `)
    .eq('program_id', profile.program_id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  return (
    <AprovacoesClient
      submissions={submissions || []}
      reviewerId={profile.id}
    />
  )
}
