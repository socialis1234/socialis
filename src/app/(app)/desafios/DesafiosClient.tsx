'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/participant/BottomNav'
import SubmissionModal from '@/components/participant/SubmissionModal'
import type { Profile, Task, Submission } from '@/types/database'

interface Props {
  profile: Profile
  tasks: Task[]
  submissions: Submission[]
}

export default function DesafiosClient({ profile, tasks, submissions }: Props) {
  const [activeTab, setActiveTab] = useState<'pendentes' | 'concluidos' | 'expirados'>('pendentes')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [localSubmissions, setLocalSubmissions] = useState(submissions)
  const supabase = createClient()

  // Checar status de cada tarefa
  function getTaskStatus(task: Task) {
    const sub = localSubmissions.find(s => s.task_id === task.id)
    if (!sub) return 'pendente'
    return sub.status
  }

  const pendentes = tasks.filter(t => {
    const s = getTaskStatus(t)
    return s === 'pendente'
  })

  const concluidos = tasks.filter(t => {
    const s = getTaskStatus(t)
    return s === 'aprovado' || s === 'recusado'
  })

  const emAnalise = tasks.filter(t => getTaskStatus(t) === 'pendente' &&
    localSubmissions.some(s => s.task_id === t.id))

  const semanais = pendentes.filter(t => t.frequency === 'semanal')
  const unicas   = pendentes.filter(t => t.frequency === 'unica')

  const pct = Math.min(100, Math.round((profile.points / 2640) * 100))

  function handleSubmissionSent(sub: Submission) {
    setLocalSubmissions(prev => [sub, ...prev])
    setSelectedTask(null)
  }

  return (
    <div id="app-frame">
      {/* Tela de desafios */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="px-4 pt-5 pb-5 flex-shrink-0"
          style={{ background: 'linear-gradient(155deg,#3B0764 0%,#6B21A8 55%,#9333EA 100%)' }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-purple-200 text-xs mb-1">Olá, bem-vinda de volta 👋</p>
              <h1 className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {profile.name.split(' ')[0]}
              </h1>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.35)' }}
            >
              {profile.name.slice(0,2).toUpperCase()}
            </div>
          </div>

          {/* Card de pontos */}
          <div
            className="rounded-xl p-4 flex justify-between items-center"
            style={{ background: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.2)' }}
          >
            <div>
              <p className="text-purple-200 text-xs mb-1">Pontos · Temporada 1</p>
              <p className="text-white text-3xl font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                {profile.points.toLocaleString('pt-BR')}
              </p>
              <p className="text-purple-300 text-xs mt-1">
                🏆 {profile.ranking_position || '—'}º no ranking geral
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: 'rgba(255,255,255,.18)', fontFamily: 'var(--font-display)' }}
              >
                💎 Expert
              </div>
              <div className="w-20">
                <p className="text-purple-300 text-xs text-right mb-1">{pct}% → Mestre</p>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.18)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FCD34D,#F59E0B)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-100 bg-white flex-shrink-0">
          {(['pendentes', 'concluidos', 'expirados'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors capitalize border-b-2 ${
                activeTab === tab
                  ? 'text-purple-700 border-purple-700'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab === 'pendentes' ? 'Pendentes' : tab === 'concluidos' ? 'Concluídos' : 'Expirados'}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto pb-4">
          {activeTab === 'pendentes' && (
            <>
              {emAnalise.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">
                    ⏳ Em análise
                  </p>
                  {emAnalise.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status="pendente"
                      inAnalysis
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </>
              )}
              {semanais.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">
                    🗓 Semanais
                  </p>
                  {semanais.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status="pendente"
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </>
              )}
              {unicas.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">
                    1️⃣ Únicas
                  </p>
                  {unicas.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status="pendente"
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </>
              )}
              {pendentes.length === 0 && emAnalise.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-sm font-medium">Tudo em dia!</p>
                  <p className="text-xs mt-1">Nenhuma tarefa pendente</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'concluidos' && (
            <>
              {concluidos.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm">Nenhuma tarefa concluída ainda</p>
                </div>
              ) : (
                concluidos.map(task => {
                  const sub = localSubmissions.find(s => s.task_id === task.id)
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status={sub?.status || 'pendente'}
                      onClick={() => {}}
                    />
                  )
                })
              )}
            </>
          )}

          {activeTab === 'expirados' && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">⌛</div>
              <p className="text-sm">Sem tarefas expiradas</p>
            </div>
          )}
        </div>

        <BottomNav active="desafios" />
      </div>

      {/* Modal de comprovação */}
      {selectedTask && (
        <SubmissionModal
          task={selectedTask}
          programId={profile.program_id}
          userId={profile.id}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSubmissionSent}
        />
      )}
    </div>
  )
}

function TaskCard({
  task,
  status,
  inAnalysis,
  onClick,
}: {
  task: Task
  status: string
  inAnalysis?: boolean
  onClick: () => void
}) {
  const networkColor: Record<string, string> = {
    Instagram: 'bg-pink-50 text-pink-700',
    LinkedIn:  'bg-blue-50 text-blue-700',
    WhatsApp:  'bg-green-50 text-green-700',
    TikTok:    'bg-gray-100 text-gray-700',
  }

  return (
    <div
      onClick={onClick}
      className={`mx-4 mb-3 rounded-2xl p-4 flex gap-3 cursor-pointer transition-all active:scale-98 ${
        inAnalysis
          ? 'bg-amber-50 border border-amber-200'
          : status === 'aprovado'
          ? 'bg-green-50 border border-green-200 opacity-70'
          : status === 'recusado'
          ? 'bg-red-50 border border-red-200 opacity-70'
          : 'bg-white border border-purple-100 shadow-sm'
      }`}
      style={{ boxShadow: '0 1px 4px rgba(107,33,168,.07)' }}
    >
      {/* Ícone */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: '#F3E8FF' }}
      >
        {task.network === 'Instagram' ? '📸' :
         task.network === 'LinkedIn'  ? '💼' :
         task.network === 'WhatsApp'  ? '📲' : '📋'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug mb-2 ${
          status === 'aprovado' ? 'line-through text-gray-400' : 'text-gray-800'
        }`}>
          {task.title}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            ⭐ {task.points} pts
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
            {task.frequency === 'semanal' ? 'Semanal' : task.frequency === 'unica' ? 'Única' : 'Mensal'}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${networkColor[task.network] || 'bg-gray-100 text-gray-600'}`}>
            {task.network}
          </span>
          {inAnalysis && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ⏳ Em análise
            </span>
          )}
          {status === 'aprovado' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              ✓ Aprovado
            </span>
          )}
          {status === 'recusado' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              ✕ Recusado
            </span>
          )}
        </div>
      </div>

      <div className="text-gray-300 text-lg flex-shrink-0 self-center">›</div>
    </div>
  )
}
