import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DesafiosClient from './DesafiosClient'

export default async function DesafiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Buscar tarefas do programa
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('program_id', profile.program_id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Buscar submissions do usuário
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <DesafiosClient
      profile={profile}
      tasks={tasks || []}
      submissions={submissions || []}
    />
  )
}
