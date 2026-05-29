import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MidiasClient from './MidiasClient'

export default async function MidiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  // Buscar todas as submissions do programa com detalhes
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (name, instagram),
      tasks:task_id (title, points, network, content_type)
    `)
    .eq('program_id', profile.program_id)
    .order('created_at', { ascending: false })
    .limit(40)

  return <MidiasClient submissions={submissions || []} userId={user.id} />
}
