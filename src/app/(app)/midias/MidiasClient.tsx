'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/participant/BottomNav'

const NETWORK_EMOJI: Record<string, string> = {
  Instagram: '📸', LinkedIn: '💼', WhatsApp: '📲',
  TikTok: '🎬', YouTube: '📺', Twitter: '🐦',
}

const STATUS_CFG = {
  aprovado: { label: '✓', bg: '#059669', cls: 'bg-green-500' },
  pendente:  { label: '⏳', bg: '#D97706', cls: 'bg-amber-500' },
  recusado:  { label: '✕', bg: '#DC2626', cls: 'bg-red-500' },
}

const FILTERS = ['Todas', 'Instagram', 'LinkedIn', 'WhatsApp', 'Aprovadas', 'Em análise']

export default function MidiasClient({ submissions, userId }: { submissions: any[]; userId: string }) {
  const [filter, setFilter] = useState('Todas')
  const [selected, setSelected] = useState<any | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = submissions.filter(s => {
    if (filter === 'Todas') return true
    if (filter === 'Aprovadas') return s.status === 'aprovado'
    if (filter === 'Em análise') return s.status === 'pendente'
    return s.tasks?.network === filter
  })

  async function openDetail(sub: any) {
    setSelected(sub)
    setProofUrl(null)
    if (sub.proof_url) {
      const { data } = await supabase.storage
        .from('proofs')
        .createSignedUrl(sub.proof_url, 3600)
      if (data?.signedUrl) setProofUrl(data.signedUrl)
    }
  }

  const gradients = [
    'linear-gradient(160deg,#F3E8FF,#FAF5FF)',
    'linear-gradient(160deg,#EDE9FE,#F3E8FF)',
    'linear-gradient(160deg,#D1FAE5,#ECFDF5)',
    'linear-gradient(160deg,#FEF3C7,#FFFBEB)',
    'linear-gradient(160deg,#DBEAFE,#EFF6FF)',
    'linear-gradient(160deg,#FEE2E2,#FFF8F8)',
  ]

  function getBg(idx: number) {
    return gradients[idx % gradients.length]
  }

  return (
    <div id="app-frame">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="px-4 pt-5 pb-5 flex-shrink-0"
          style={{ background: 'linear-gradient(155deg,#3B0764 0%,#6B21A8 55%,#9333EA 100%)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              🖼 Mídias
            </h1>
            <span className="text-purple-300 text-xs">{submissions.length} publicações</span>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filter === f ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)',
                  color: filter === f ? '#fff' : 'rgba(255,255,255,.65)',
                  border: 'none',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🖼</div>
              <p className="text-sm">Nenhuma mídia encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {filtered.map((sub, i) => {
                const st = STATUS_CFG[sub.status as keyof typeof STATUS_CFG] || STATUS_CFG.pendente
                const isMe = sub.user_id === userId
                return (
                  <div
                    key={sub.id}
                    onClick={() => openDetail(sub)}
                    className="rounded-2xl overflow-hidden border border-purple-100 shadow-sm cursor-pointer active:scale-95 transition-transform"
                    style={{ boxShadow: '0 2px 8px rgba(107,33,168,.08)' }}
                  >
                    {/* Thumb retrato */}
                    <div
                      className="flex items-center justify-center text-3xl relative"
                      style={{ aspectRatio: '3/4', background: getBg(i) }}
                    >
                      {NETWORK_EMOJI[sub.tasks?.network] || '📋'}
                      <div
                        className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, fontSize: 10 }}
                      >
                        {st.label}
                      </div>
                      {isMe && (
                        <div
                          className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(107,33,168,.8)', fontSize: 10 }}
                        >
                          Eu
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="bg-white p-2.5">
                      <p className="text-xs font-semibold text-gray-800 leading-tight truncate mb-1">
                        {sub.tasks?.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{sub.tasks?.network} · {sub.tasks?.content_type}</p>
                      <p className="text-xs font-bold text-purple-700 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {sub.status === 'aprovado' ? `+${sub.points_awarded} pts` : `${sub.tasks?.points} pts`}
                      </p>
                    </div>
                    {/* Usuário */}
                    <div className="bg-gray-50 px-2.5 py-1.5 flex items-center gap-1.5 border-t border-gray-100">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ fontSize: 7, fontWeight: 700, background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
                      >
                        {sub.profiles?.name?.slice(0, 1)}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{sub.profiles?.name?.split(' ')[0]}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <BottomNav active="midias" />
      </div>

      {/* Modal de detalhe */}
      {selected && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="w-full bg-white rounded-t-3xl overflow-y-auto" style={{ maxHeight: '88%', paddingBottom: 32 }}>
            <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-4" />
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
            >✕</button>

            {/* Preview do print */}
            <div className="mx-4 mb-4">
              {proofUrl ? (
                <img src={proofUrl} alt="Comprovante" className="w-full rounded-2xl object-contain max-h-72" />
              ) : (
                <div
                  className="rounded-2xl flex items-center justify-center text-5xl"
                  style={{ height: 180, background: 'linear-gradient(160deg,#F3E8FF,#FAF5FF)' }}
                >
                  {selected.proof_url ? '⏳' : NETWORK_EMOJI[selected.tasks?.network] || '📋'}
                </div>
              )}
            </div>

            {/* Detalhes */}
            <div className="px-5 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
                >
                  {selected.profiles?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{selected.profiles?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: STATUS_CFG[selected.status as keyof typeof STATUS_CFG]?.bg }}
                >
                  {selected.status === 'aprovado' ? '✓ Aprovado' : selected.status === 'pendente' ? '⏳ Em análise' : '✕ Recusado'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Tarefa</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.tasks?.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Rede social</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.tasks?.network}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Pontuação</p>
                  <p className="text-sm font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selected.status === 'aprovado' ? `+${selected.points_awarded} pts` : `${selected.tasks?.points} pts`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Tipo</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.tasks?.content_type}</p>
                </div>
              </div>

              {selected.proof_note && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Observação</p>
                  <p className="text-sm text-blue-800">{selected.proof_note}</p>
                </div>
              )}

              {selected.review_note && (
                <div className={`rounded-xl p-3 ${selected.status === 'recusado' ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`text-xs font-semibold mb-1 ${selected.status === 'recusado' ? 'text-red-600' : 'text-green-600'}`}>
                    Feedback do curador
                  </p>
                  <p className={`text-sm ${selected.status === 'recusado' ? 'text-red-800' : 'text-green-800'}`}>
                    {selected.review_note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
