import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/participant/BottomNav'

const PILLS = [
  { emoji: '🎬', title: 'Roteiro de Reels em 3 passos', duration: '8 min', tag: 'Conteúdo', pontos: '+50 pts' },
  { emoji: '📸', title: 'Como criar stories que geram cliques', duration: '7 min', tag: 'Stories', pontos: '+50 pts' },
  { emoji: '💼', title: 'Bio do LinkedIn que atrai clientes', duration: '5 min', tag: 'LinkedIn', pontos: '+50 pts' },
  { emoji: '📲', title: 'Social selling no WhatsApp', duration: '10 min', tag: 'WhatsApp', pontos: '+50 pts' },
  { emoji: '🏆', title: 'Como posicionar seu perfil como expert', duration: '12 min', tag: 'Branding', pontos: '+50 pts' },
  { emoji: '🎯', title: 'Hashtags que funcionam em 2025', duration: '6 min', tag: 'Estratégia', pontos: '+50 pts' },
]

const MATERIAIS = [
  { emoji: '📋', title: 'Kit de Templates Stories', desc: 'Canva · 12 layouts prontos', tag: 'Template' },
  { emoji: '🎨', title: 'Guia Visual da Marca', desc: 'PDF · Cores, fontes e logos', tag: 'Identidade' },
  { emoji: '📦', title: 'Catálogo Coleção Primavera', desc: 'PDF · 24 páginas', tag: 'Produto' },
  { emoji: '💬', title: 'Scripts de Vendas WhatsApp', desc: 'DOCX · 8 roteiros prontos', tag: 'Vendas' },
]

export default async function ConhecimentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('program_id').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  return (
    <div id="app-frame">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="px-4 pt-5 pb-6 flex-shrink-0"
          style={{ background: 'linear-gradient(155deg,#3B0764 0%,#6B21A8 55%,#9333EA 100%)' }}
        >
          <h1 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            🎓 Conhecimento
          </h1>
          <p className="text-purple-200 text-sm">Aprenda e ganhe pontos</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dicas Socialis */}
          <div className="pt-4">
            <div className="flex justify-between items-center px-4 mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">💡 Dicas Socialis</p>
              <span className="text-xs text-purple-700 font-semibold">{PILLS.length} aulas</span>
            </div>

            <div className="space-y-2 px-4">
              {PILLS.map((p, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--brand-light)' }}
                  >
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug mb-1.5">{p.title}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        ⭐ {p.pontos}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ⏱ {p.duration}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {p.tag}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-300 text-lg flex-shrink-0">›</div>
                </div>
              ))}
            </div>
          </div>

          {/* Materiais */}
          <div className="pt-5 pb-4">
            <div className="flex justify-between items-center px-4 mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">📚 Materiais</p>
            </div>

            <div className="space-y-2 px-4">
              {MATERIAIS.map((m, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: '#F0FDF4' }}
                  >
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}
                  >
                    {m.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BottomNav active="conhecimento" />
      </div>
    </div>
  )
}
