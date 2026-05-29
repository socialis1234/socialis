import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se já tem perfil — tentar várias vezes (auth pode ser lento)
      let profile = null
      for (let i = 0; i < 3; i++) {
        const { data: p } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        if (p) { profile = p; break }
        await new Promise(r => setTimeout(r, 500))
      }

      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (['admin', 'curador', 'super_admin'].includes(profile.role)) {
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      }

      return NextResponse.redirect(`${origin}/desafios`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
