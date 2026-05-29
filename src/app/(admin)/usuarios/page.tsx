import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/desafios')

  const { data: users } = await supabase
    .from('ranking')
    .select('*')
    .eq('program_id', profile.program_id)
    .order('position', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-900">Participantes</h1>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {users?.length || 0}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {users?.map(u => (
          <div key={u.user_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
            >
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
              <p className="text-xs text-gray-400">{u.submissions_count} entregas · {u.approval_rate}% aprovação</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                {u.points.toLocaleString('pt-BR')} pts
              </p>
              <p className="text-xs text-gray-400">{u.position}° lugar</p>
            </div>
          </div>
        ))}

        {(!users || users.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm">Nenhum participante ainda</p>
            <p className="text-xs mt-1">Convide sua equipe para o programa</p>
          </div>
        )}
      </div>
    </div>
  )
}
