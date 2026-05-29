'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SubmissionWithRelations {
  id: string
  proof_url: string | null
  proof_note: string | null
  created_at: string
  points_awarded: number | null
  profiles: { name: string; email: string; instagram: string | null } | null
  tasks: { title: string; points: number; network: string; frequency: string } | null
}

interface Props {
  submissions: SubmissionWithRelations[]
  reviewerId: string
}

export default function AprovacoesClient({ submissions: initial, reviewerId }: Props) {
  const [queue, setQueue] = useState(initial)
  const [processing, setProcessing] = useState<string | null>(null)
  const [points, setPoints] = useState<Record<string, number>>(
    Object.fromEntries(initial.map(s => [s.id, s.tasks?.points || 100]))
  )
  const [toast, setToast] = useState('')
  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function approve(id: string) {
    setProcessing(id)
    const { error } = await (supabase as any).rpc('approve_submission', {
      p_submission_id: id,
      p_reviewer_id: reviewerId,
      p_points: points[id] || 100,
      p_note: null,
    })
    if (!error) {
      setQueue(prev => prev.filter(s => s.id !== id))
      showToast(`✅ Aprovado! +${points[id]} pts concedidos.`)
    } else {
      showToast('Erro ao aprovar. Tente novamente.')
    }
    setProcessing(null)
  }

  async function reject(id: string, note: string) {
    setProcessing(id)
    const { error } = await (supabase as any).rpc('reject_submission', {
      p_submission_id: id,
      p_reviewer_id: reviewerId,
      p_note: note || 'Comprovante não atende aos critérios.',
    })
    if (!error) {
      setQueue(prev => prev.filter(s => s.id !== id))
      showToast('Comprovante recusado.')
    }
    setProcessing(null)
  }

  async function getProofUrl(path: string) {
    const { data } = await supabase.storage
      .from('proofs')
      .createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-lg font-bold text-gray-900">Fila de aprovação</h1>
          {queue.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {queue.length} pendentes
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {queue.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-lg font-medium">Fila vazia!</p>
            <p className="text-sm mt-1">Nenhum comprovante aguardando aprovação.</p>
          </div>
        ) : (
          queue.map(sub => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
                >
                  {sub.profiles?.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{sub.profiles?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(sub.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {sub.tasks?.network}
                </span>
              </div>

              {/* Tarefa */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm mb-0.5">{sub.tasks?.title}</p>
                <p className="text-xs text-gray-400">
                  {sub.tasks?.frequency === 'semanal' ? 'Semanal' : 'Única'} · {sub.tasks?.points} pts previstos
                </p>
              </div>

              {/* Comprovante */}
              {sub.proof_url && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Comprovante
                  </p>
                  <button
                    onClick={() => getProofUrl(sub.proof_url!)}
                    className="w-full h-20 rounded-xl flex items-center justify-center text-purple-700 text-sm font-semibold border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    📎 Clique para ver o print
                  </button>
                  {sub.proof_note && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{sub.proof_note}"</p>
                  )}
                </div>
              )}

              {/* Pontos + ações */}
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-600 flex-1">Pontos a conceder</span>
                  <input
                    type="number"
                    value={points[sub.id] || 0}
                    onChange={e => setPoints(prev => ({ ...prev, [sub.id]: +e.target.value }))}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-purple-700 text-right outline-none focus:border-purple-400"
                    min={0}
                    max={9999}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(sub.id)}
                    disabled={processing === sub.id}
                    className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {processing === sub.id ? '...' : '✓ Aprovar'}
                  </button>
                  <button
                    onClick={() => {
                      const note = window.prompt('Motivo da recusa (opcional):') ?? 'Comprovante não atende aos critérios.'
                      reject(sub.id, note)
                    }}
                    disabled={processing === sub.id}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    ✕ Recusar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50 animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
