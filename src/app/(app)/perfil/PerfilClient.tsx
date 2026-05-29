'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/participant/BottomNav'
import type { Profile } from '@/types/database'

interface Props {
  profile: Profile
  submissions: any[]
  rankInfo: { position: number; submissions_count: number; approval_rate: number } | null
}

export default function PerfilClient({ profile: initial, submissions, rankInfo }: Props) {
  const [profile, setProfile] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  const pct = Math.min(100, Math.round((profile.points / 2640) * 100))

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function startEdit(field: string, current: string) {
    setEditing(field)
    setEditVal(current || '')
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ [editing]: editVal })
      .eq('id', profile.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
      showToast('✅ Atualizado!')
    } else {
      showToast('Erro ao salvar.')
    }
    setSaving(false)
    setEditing(null)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const fields = [
    { key: 'name',      label: 'Nome',        icon: '👤', value: profile.name },
    { key: 'instagram', label: '@ Instagram', icon: '📷', value: profile.instagram || '' },
    { key: 'whatsapp',  label: 'WhatsApp',    icon: '📱', value: profile.whatsapp || '' },
    { key: 'linkedin',  label: 'LinkedIn',    icon: '💼', value: profile.linkedin || '' },
  ]

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    aprovado: { label: '✓ Aprovado', color: 'text-green-700', bg: 'bg-green-50' },
    pendente: { label: '⏳ Em análise', color: 'text-amber-700', bg: 'bg-amber-50' },
    recusado: { label: '✕ Recusado', color: 'text-red-700', bg: 'bg-red-50' },
  }

  return (
    <div id="app-frame">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div
            className="px-4 pt-6 pb-10 flex flex-col items-center"
            style={{ background: 'linear-gradient(155deg,#3B0764 0%,#6B21A8 55%,#9333EA 100%)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3"
              style={{ background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.35)' }}
            >
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <h1 className="text-white text-lg font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              {profile.name}
            </h1>
            <p className="text-purple-200 text-sm mb-3">
              {profile.instagram || profile.email}
            </p>
            <div className="flex gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: 'rgba(255,255,255,.18)' }}>
                💎 Expert
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: 'rgba(255,255,255,.18)' }}>
                🏆 {rankInfo?.position || '—'}° lugar
              </span>
            </div>
          </div>

          {/* Card de nível */}
          <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-md border border-purple-100 p-4 mb-4 z-10 relative">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400">Nível atual</p>
                <p className="text-base font-bold text-purple-800" style={{ fontFamily: 'var(--font-display)' }}>
                  💎 Expert
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Pontos</p>
                <p className="text-2xl font-medium text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                  {profile.points.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1.5">{pct}% → Mestre (2.640 pts)</p>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B21A8,#C026D3)' }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 px-4 mb-4">
            {[
              { label: 'Entregas', value: rankInfo?.submissions_count || 0 },
              { label: 'Aprovação', value: `${rankInfo?.approval_rate || 0}%` },
              { label: 'Ranking', value: `${rankInfo?.position || '—'}°` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <p className="text-xl font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Editar dados */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
            ✏️ Meus dados
          </p>
          <div className="px-4 space-y-2 mb-4">
            {fields.map(f => (
              <div
                key={f.key}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-purple-200 transition-colors"
                onClick={() => startEdit(f.key, f.value)}
              >
                <span className="text-lg">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {f.value || <span className="text-gray-400 font-normal">Toque para preencher</span>}
                  </p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            ))}
          </div>

          {/* Histórico */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
            📋 Histórico de atividades
          </p>
          <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            {submissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Nenhuma atividade ainda
              </p>
            ) : (
              submissions.map((s: any) => {
                const cfg = statusConfig[s.status] || statusConfig.pendente
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {s.status === 'aprovado' ? '✓' : s.status === 'recusado' ? '✕' : '⏳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.tasks?.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')} · {s.tasks?.network}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${s.status === 'aprovado' ? 'text-green-600' : 'text-gray-300'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {s.status === 'aprovado' ? `+${s.points_awarded}` : s.tasks?.points}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Sair */}
          <div className="px-4 pb-4">
            <button
              onClick={signOut}
              className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>

        <BottomNav active="perfil" />
      </div>

      {/* Modal de edição */}
      {editing && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,.45)' }}
          onClick={e => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="w-full bg-white rounded-t-3xl p-6">
            <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {fields.find(f => f.key === editing)?.label}
            </p>
            <input
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-purple-400 mb-4"
              placeholder={`Digite ${fields.find(f => f.key === editing)?.label?.toLowerCase()}...`}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
