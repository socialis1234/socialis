'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Task } from '@/types/database'

export default function TarefasAdminClient({ tasks: initial, programId }: { tasks: Task[]; programId: string }) {
  const [tasks, setTasks] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', network: 'Instagram',
    content_type: 'Post', points: 100, frequency: 'semanal',
    instructions: ['', '', ''],
  })
  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 2800)
  }

  async function toggleTask(id: string, active: boolean) {
    await supabase.from('tasks').update({ active: !active }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t))
    showToast(active ? 'Tarefa desativada' : 'Tarefa ativada')
  }

  async function createTask() {
    const instructions = form.instructions.filter(i => i.trim())
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        program_id: programId,
        title: form.title,
        description: form.description,
        network: form.network,
        content_type: form.content_type,
        points: form.points,
        frequency: form.frequency as any,
        instructions,
        active: true,
      })
      .select()
      .single()

    if (!error && data) {
      setTasks(prev => [data, ...prev])
      setCreating(false)
      setForm({ title:'', description:'', network:'Instagram', content_type:'Post', points:100, frequency:'semanal', instructions:['','',''] })
      showToast('✅ Tarefa criada!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-lg font-bold text-gray-900">Tarefas</h1>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-xl text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
        >
          + Nova tarefa
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {tasks.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${t.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                  {!t.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativa</span>}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    ⭐ {t.points} pts
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {t.frequency === 'semanal' ? 'Semanal' : t.frequency === 'unica' ? 'Única' : 'Mensal'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {t.network}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleTask(t.id, t.active)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 mt-1 ${t.active ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${t.active ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de criar tarefa */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={e => e.target === e.currentTarget && setCreating(false)}
        >
          <div className="w-full bg-white rounded-t-3xl max-h-screen overflow-y-auto pb-10">
            <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-4" />
            <div className="px-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Nova tarefa</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Título *</label>
                  <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                    placeholder="Criar Reels mostrando produto..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Descrição *</label>
                  <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                    rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 resize-none"
                    placeholder="Explicação da tarefa..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Rede social</label>
                    <select value={form.network} onChange={e => setForm(p=>({...p,network:e.target.value}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white">
                      {['Instagram','LinkedIn','WhatsApp','TikTok','YouTube'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Frequência</label>
                    <select value={form.frequency} onChange={e => setForm(p=>({...p,frequency:e.target.value}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 bg-white">
                      <option value="semanal">Semanal</option>
                      <option value="unica">Única</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Pontos</label>
                  <input type="number" value={form.points} onChange={e => setForm(p=>({...p,points:+e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                    min={1} max={9999} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Instruções (passo a passo)
                  </label>
                  {form.instructions.map((ins, i) => (
                    <input key={i} value={ins} onChange={e => {
                      const arr = [...form.instructions]; arr[i] = e.target.value; setForm(p=>({...p,instructions:arr}))
                    }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 mb-2"
                      placeholder={`Passo ${i+1}...`} />
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setCreating(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold">
                    Cancelar
                  </button>
                  <button onClick={createTask} disabled={!form.title || !form.description}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}>
                    Criar tarefa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
