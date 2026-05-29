import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TarefasAdminClient from './TarefasAdminClient'

export default async function TarefasAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'curador', 'super_admin'].includes(profile.role)) redirect('/desafios')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('program_id', profile.program_id)
    .order('created_at', { ascending: false })

  return <TarefasAdminClient tasks={tasks || []} programId={profile.program_id} />
}
