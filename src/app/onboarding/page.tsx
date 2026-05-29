'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PROGRAMS: Record<string, string> = {
  triumph:  'Engaja Triumph',
  volvo:    'Engaja Volvo',
  caixa:    'Engaja CAIXA',
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', instagram: '', whatsapp: '', program_slug: 'triumph'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Se já tem perfil, redirecionar direto
  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (profile) {
        if (['admin', 'curador', 'super_admin'].includes(profile.role)) {
          router.replace('/admin/dashboard')
        } else {
          router.replace('/desafios')
        }
      }
    }
    checkProfile()
  }, [])

  const pct = (step / 4) * 100

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function finish() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão inválida')

      const { data: program } = await supabase
        .from('programs')
        .select('id')
        .eq('slug', form.program_slug)
        .single()

      if (!program) throw new Error('Programa não encontrado')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          name: form.name,
          instagram: form.instagram || null,
          whatsapp: form.whatsapp || null,
          program_id: program.id,
          role: 'participante',
        })

      if (profileError) throw new Error(profileError.message)
      router.push('/desafios')
    } catch (e: any) {
      setError(e.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="app-frame">
      <div className="h-1 bg-purple-100 flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B21A8,#C026D3)' }}
        />
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Bem-vindo ao Socialis!
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Você foi convidado para transformar seu perfil nas redes sociais e se tornar um creator oficial da marca. Vamos configurar sua conta em 3 passos.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-full text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)', boxShadow: '0 4px 14px rgba(192,38,211,.35)', fontFamily: 'var(--font-display)' }}
            >
              Começar agora →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 px-6 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Qual é o seu programa?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Selecione a marca do seu programa de engajamento</p>
            <div className="space-y-3 mb-6">
              {Object.entries(PROGRAMS).map(([slug, name]) => (
                <button
                  key={slug}
                  onClick={() => update('program_slug', slug)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    form.program_slug === slug
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className={`font-semibold text-sm ${form.program_slug === slug ? 'text-purple-800' : 'text-gray-800'}`}>
                    {name}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-auto pb-8">
              <button onClick={() => setStep(1)} className="py-3 px-5 rounded-full border border-gray-200 text-gray-500 text-sm font-semibold">
                ← Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-full text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col flex-1 px-6 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Como você se chama?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Como aparecerá no ranking e no seu perfil</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Nome completo *</label>
                <input
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Ana Beatriz Santos"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">WhatsApp</label>
                <input
                  value={form.whatsapp}
                  onChange={e => update('whatsapp', e.target.value)}
                  placeholder="(41) 99999-1234"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-auto pb-8">
              <button onClick={() => setStep(2)} className="py-3 px-5 rounded-full border border-gray-200 text-gray-500 text-sm font-semibold">
                ← Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!form.name}
                className="flex-1 py-3 rounded-full text-white font-bold text-sm disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)' }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col flex-1 px-6 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Suas redes sociais
            </h2>
            <p className="text-sm text-gray-500 mb-6">Conecte seus perfis para facilitar a validação dos comprovantes</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">@ Instagram</label>
                <input
                  value={form.instagram}
                  onChange={e => update('instagram', e.target.value)}
                  placeholder="@seuusuario"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="flex gap-3 mt-auto pb-8">
              <button onClick={() => setStep(3)} className="py-3 px-5 rounded-full border border-gray-200 text-gray-500 text-sm font-semibold">
                ← Voltar
              </button>
              <button
                onClick={finish}
                disabled={loading}
                className="flex-1 py-3 rounded-full text-white font-bold text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6B21A8,#C026D3)', boxShadow: '0 4px 14px rgba(192,38,211,.35)', fontFamily: 'var(--font-display)' }}
              >
                {loading ? 'Criando conta...' : 'Entrar na plataforma 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
