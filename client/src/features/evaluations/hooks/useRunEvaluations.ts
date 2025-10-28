import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/api/supabase'
import { toast } from '@/shared/hooks/useToast'
import { resultsKeys } from '@/features/results/hooks/useResults'

export interface RunEvaluationsRequest {
  queueId?: string // Optional: run for specific queue only
}

export interface RunEvaluationsResponse {
  success: boolean
  planned: number
  completed: number
  failed: number
  errors?: string[]
}

// Run evaluations by calling Supabase Edge Function
async function runEvaluations(
  request: RunEvaluationsRequest
): Promise<RunEvaluationsResponse> {
  const { data, error } = await supabase.functions.invoke('run-evaluations', {
    body: request,
  })

  if (error) throw new Error(error.message)

  return data as RunEvaluationsResponse
}

// Custom hook for running evaluations
export function useRunEvaluations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: RunEvaluationsRequest) => runEvaluations(request),
    onSuccess: (result) => {
      // Invalidate evaluations queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: resultsKeys.all })

      const message = `Completed: ${result.completed}, Failed: ${result.failed}`

      if (result.failed > 0) {
        toast({
          title: 'Evaluations completed with errors',
          description: message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Evaluations completed successfully',
          description: message,
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error running evaluations',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

