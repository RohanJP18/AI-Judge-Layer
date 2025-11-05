import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabase'
import type { Database } from '@/shared/types/database'

type EvaluationRow = Database['public']['Tables']['evaluations']['Row']

interface EvaluationProgress {
  total: number
  completed: number
  failed: number
  lastUpdate: Date | null
}

/**
 * Subscribe to real-time evaluation updates
 * Returns the current progress count
 */
export function useEvaluationSubscription() {
  const [progress, setProgress] = useState<EvaluationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    lastUpdate: null,
  })

  useEffect(() => {
    // Get initial count
    const fetchInitialCount = async () => {
      const { count } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
      
      const { count: failedCount } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .or('verdict.eq.inconclusive,error_message.not.is.null')

      setProgress({
        total: count || 0,
        completed: count || 0,
        failed: failedCount || 0,
        lastUpdate: new Date(),
      })
    }

    fetchInitialCount()

    // Subscribe to new evaluations
    const channel = supabase
      .channel('evaluations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evaluations',
        },
        (payload) => {
          setProgress((prev) => ({
            total: prev.total + 1,
            completed: prev.completed + 1,
            failed: payload.new.verdict === 'inconclusive' || payload.new.error_message ? prev.failed + 1 : prev.failed,
            lastUpdate: new Date(),
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evaluations',
        },
        () => {
          // Refetch count on update
          fetchInitialCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return progress
}
