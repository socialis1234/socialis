import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || !['admin', 'curador', 'super_admin'].includes(profile.role)) {
    redirect('/desafios')
  }

  // KPIs
  const [{ count: totalUsers }, { count: pendingCount }, { count: approvedCount }, { data: topUsers }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('program_id', profile.program_id).eq('role', 'participante'),
      supabase.from('submissions').select('*', { count: 'exact', head: true })
        .eq('program_id', profile.program_id).eq('status', 'pendente'),
      supabase.from('submissions').select('*', { count: 'exact', head: true })
        .eq('program_id', profile.program_id).eq('status', 'aprovado'),
      supabase.from('ranking').select('*')
        .eq('program_id', profile.program_id)
        .order('position', { ascending: true }).limit(5),
    ])

  const kpis = [
    { label: 'Participantes', value: totalUsers || 0, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Fila de aprovação', value: pendingCount || 0, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Aprovadas no total', value: approvedCount || 0, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Admin · Engaja Triumph
          </h1>
          <p className="text-sm text-gray-500">Olá, {profile.name.split(' ')[0]}</p>
        </div>
        <Link
          href="/desafios"
          className="text-sm font-medium text-purple-700 hover:text-purple-900 border border-purple-200 px-3 py-1.5 rounded-lg"
        >
          Ver como participante
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center text-lg mb-2`}>
                {k.icon}
              </div>
              <p className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {k.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/aprovacoes"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl">✅</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Fila de aprovação</p>
              <p className="text-xs text-amber-600 font-medium">{pendingCount || 0} pendentes</p>
            </div>
          </Link>
          <Link
            href="/admin/tarefas"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl">📋</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tarefas</p>
              <p className="text-xs text-gray-500">Gerenciar desafios</p>
            </div>
          </Link>
          <Link
            href="/admin/usuarios"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl">👥</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Usuários</p>
              <p className="text-xs text-gray-500">Ver participantes</p>
            </div>
          </Link>
          <Link
            href="/admin/classificacao"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl">🏆</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Ranking</p>
              <p className="text-xs text-gray-500">Ver classificação</p>
            </div>
          </Link>
        </div>

        {/* Top performers */}
        {topUsers && topUsers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">🏅 Top performers</h2>
              <Link href="/admin/classificacao" className="text-xs text-purple-700 font-medium">Ver ranking completo</Link>
            </div>
            {topUsers.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm font-bold text-gray-400 w-5 text-center">{u.position}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.submissions_count} entregas · {u.approval_rate}% aprovação</p>
                </div>
                <span className="text-sm font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                  {u.points.toLocaleString('pt-BR')} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
