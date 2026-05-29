import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminRankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'curador', 'super_admin'].includes(profile.role)) redirect('/desafios')

  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .eq('program_id', profile.program_id)
    .order('position', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-900">Ranking completo</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {ranking?.map((u, i) => (
            <div key={u.user_id} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${i < 3 ? 'bg-gradient-to-r from-purple-50/50 to-white' : ''}`}>
              <span
                className="text-sm font-bold w-6 text-center flex-shrink-0"
                style={{ fontFamily: 'var(--font-mono)', color: i === 0 ? '#B45309' : i === 1 ? '#4B5563' : i === 2 ? '#78350F' : '#9CA3AF' }}
              >
                {u.position}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
              >
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-400">{u.submissions_count} entregas · {u.approval_rate}% aprov.</p>
              </div>
              <span className="text-sm font-bold text-purple-700 flex-shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>
                {u.points.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
