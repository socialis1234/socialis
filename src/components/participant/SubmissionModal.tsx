'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Submission } from '@/types/database'

interface Props {
  task: Task
  programId: string
  userId: string
  onClose: () => void
  onSuccess: (sub: Submission) => void
}

export default function SubmissionModal({ task, programId, userId, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  function removeFile() {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit() {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      // 1. Upload do print
      const ext = file.name.split('.').pop()
      const path = `${userId}/${task.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(path, file, { upsert: false })

      if (uploadError) throw new Error('Erro no upload: ' + uploadError.message)

      // 2. Criar submission
      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .insert({
          task_id: task.id,
          user_id: userId,
          program_id: programId,
          proof_url: path,
          proof_note: note || null,
        })
        .select()
        .single()

      if (subError) throw new Error('Erro ao enviar: ' + subError.message)

      onSuccess(sub)
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 z-50 flex items-end"
        style={{ background: 'rgba(0,0,0,.52)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        {/* Sheet */}
        <div
          className="w-full bg-white rounded-t-3xl overflow-y-auto animate-slide-up"
          style={{ maxHeight: '90%', paddingBottom: 40 }}
        >
          {/* Handle */}
          <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-4" />

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
          >
            ✕
          </button>

          {/* Header */}
          <div className="px-5 pb-4 border-b border-gray-100">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full mb-2">
              {task.frequency === 'semanal' ? '🗓 Semanal' : '1️⃣ Única'} · {task.network}
            </span>
            <h2 className="text-base font-bold text-gray-800 mb-1.5 leading-snug">
              {task.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
          </div>

          {/* Pontos */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Pontos ao completar</span>
            <span className="text-xl font-bold text-purple-700" style={{ fontFamily: 'var(--font-mono)' }}>
              ⭐ {task.points} pts
            </span>
          </div>

          {/* Instruções */}
          <div className="px-5 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Como realizar
            </p>
            <div className="space-y-2">
              {task.instructions.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--brand)' }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="px-5 pt-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Enviar comprovante
            </p>

            {!preview ? (
              <label
                className="block border-2 border-dashed border-purple-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                style={{ background: 'var(--brand-pale)' }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                <span className="text-3xl block mb-2">📎</span>
                <p className="text-sm font-semibold text-gray-600">Toque para anexar o print</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou HEIC · até 10 MB</p>
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-green-200" style={{ background: '#ECFDF5' }}>
                <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                <div className="flex items-center justify-between px-4 py-2 border-t border-green-200">
                  <span className="text-xs font-semibold text-green-700">✅ Print anexado</span>
                  <button
                    onClick={removeFile}
                    className="text-xs text-red-500 font-semibold"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}

            {/* Nota opcional */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Link da publicação ou observação (opcional)..."
              rows={2}
              className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-400 transition-colors resize-none"
              style={{ background: '#FAF7FF' }}
            />

            {error && (
              <p className="text-red-500 text-xs mt-2 px-1">{error}</p>
            )}

            {/* Botão enviar */}
            <button
              onClick={submit}
              disabled={!file || loading}
              className="w-full mt-4 py-4 rounded-full font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#6B21A8,#C026D3)',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 4px 14px rgba(192,38,211,.3)',
              }}
            >
              {loading ? 'Enviando...' : 'Enviar comprovação →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
