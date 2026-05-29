'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RankingRow } from '@/types/database'

export function useRanking(programId: string | undefined) {
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    if (!programId) return
    const { data } = await supabase
      .from('ranking')
      .select('*')
      .eq('program_id', programId)
      .order('position', { ascending: true })
      .limit(50)

    if (data) setRanking(data)
    setLoading(false)
  }

  useEffect(() => {
    load()

    // Realtime: atualiza quando pontos mudam
    if (!programId) return
    const channel = supabase
      .channel(`ranking:${programId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `program_id=eq.${programId}`,
        },
        () => load() // Recarregar ranking completo
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [programId])

  return { ranking, loading }
}
