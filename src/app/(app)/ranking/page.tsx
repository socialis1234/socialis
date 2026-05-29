import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/participant/BottomNav'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .eq('program_id', profile.program_id)
    .order('position', { ascending: true })
    .limit(20)

  const myPos = ranking?.find(r => r.user_id === user.id)
  const top3 = ranking?.slice(0, 3) || []
  const rest = ranking?.slice(3) || []

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div id="app-frame">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="px-4 pt-5 pb-6 flex-shrink-0"
          style={{ background: 'linear-gradient(155deg,#3B0764 0%,#6B21A8 55%,#9333EA 100%)' }}
        >
          <h1 className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            🏆 Ranking
          </h1>

          {/* Pódio */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-3 pb-2">
              {[top3[1], top3[0], top3[2]].map((r, i) => {
                const order = [1, 0, 2]
                const heights = ['h-20', 'h-24', 'h-16']
                const sizes = ['w-12 h-12 text-sm', 'w-14 h-14 text-base', 'w-11 h-11 text-xs']
                const pos = order[i]
                return (
                  <div key={r?.user_id} className="flex flex-col items-center gap-1">
                    <div
                      className={`${sizes[i]} rounded-full flex items-center justify-center font-bold text-white`}
                      style={{ background: ['linear-gradient(135deg,#4B5563,#9CA3AF)', 'linear-gradient(135deg,#B45309,#F59E0B)', 'linear-gradient(135deg,#78350F,#B45309)'][i] }}
                    >
                      {r?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-white text-xs font-semibold text-center max-w-16 leading-tight">
                      {medals[pos]} {r?.name?.split(' ')[0]}
                    </p>
                    <p className="text-purple-300 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                      {r?.points.toLocaleString('pt-BR')}
                    </p>
                    <div
                      className={`w-16 ${heights[i]} rounded-t-lg`}
                      style={{ background: 'rgba(255,255,255,.15)' }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Minha posição */}
        {myPos && (
          <div
            className="mx-4 -mt-3 mb-3 rounded-xl p-3 flex items-center gap-3 z-10 relative"
            style={{ background: 'var(--brand-pale)', border: '1.5px solid var(--brand-light)' }}
          >
            <span className="text-2xl font-bold text-purple-700" style={{ fontFamily: 'var(--font-display)' }}>
              {myPos.position}º
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-purple-700">Sua posição</p>
              <p className="text-lg font-bold text-purple-900" style={{ fontFamily: 'var(--font-mono)' }}>
                {myPos.points.toLocaleString('pt-BR')} pts
              </p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {rest.map(r => {
            const isMe = r.user_id === user.id
            return (
              <div
                key={r.user_id}
                className={`flex items-center gap-3 py-3 px-3 rounded-xl mb-2 ${
                  isMe ? 'bg-purple-50 border border-purple-200' : 'bg-white border border-gray-100'
                }`}
              >
                <span className="text-sm font-bold text-gray-400 w-6 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
                  {r.position}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: isMe ? 'linear-gradient(135deg,#6B21A8,#C026D3)' : 'linear-gradient(135deg,#6B7280,#9CA3AF)' }}
                >
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isMe ? 'text-purple-800' : 'text-gray-800'}`}>
                    {r.name}{isMe ? ' (você)' : ''}
                  </p>
                  <p className="text-xs text-gray-400">{r.submissions_count} entregas · {r.approval_rate}% aprovação</p>
                </div>
                <span className="text-sm font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                  {r.points.toLocaleString('pt-BR')}
                </span>
              </div>
            )
          })}
        </div>

        <BottomNav active="ranking" />
      </div>
    </div>
  )
}
