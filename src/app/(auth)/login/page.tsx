'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('Erro ao enviar o link. Verifique o e-mail e tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div id="app-frame">
      {/* Header gradiente */}
      <div
        className="flex flex-col items-center justify-center px-8 py-16"
        style={{
          background: 'linear-gradient(155deg, #3B0764 0%, #6B21A8 55%, #9333EA 100%)',
          flex: 1,
        }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h1
            className="text-white text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Socialis
          </h1>
          <p className="text-purple-200 text-sm">
            Plataforma de engajamento digital
          </p>
        </div>

        {/* Card de login */}
        <div className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
          {!sent ? (
            <>
              <h2
                className="text-white text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Entrar na plataforma
              </h2>
              <p className="text-purple-200 text-sm mb-5">
                Enviamos um link de acesso para o seu e-mail
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/15 border border-white/25 rounded-xl px-4 py-3 text-white placeholder-purple-300 text-sm outline-none focus:border-white/50 transition-colors"
                />
                {error && (
                  <p className="text-red-300 text-xs">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-xl font-semibold text-purple-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'white', fontFamily: 'var(--font-display)' }}
                >
                  {loading ? 'Enviando...' : 'Entrar com magic link →'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📩</div>
              <h2
                className="text-white text-lg font-semibold mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Link enviado!
              </h2>
              <p className="text-purple-200 text-sm mb-4">
                Verifique sua caixa de entrada em{' '}
                <span className="text-white font-medium">{email}</span>{' '}
                e clique no link para entrar.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-purple-300 text-xs underline"
              >
                Usar outro e-mail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
