import { useQuery } from '@tanstack/react-query'
import {
  fetchEvaluations,
  fetchFilteredEvaluations,
  getEvaluationStats,
  type EvaluationFilters,
} from '@/features/evaluations/api'

// Query keys
export const resultsKeys = {
  all: ['evaluations'] as const,
  filtered: (filters: EvaluationFilters) => ['evaluations', 'filtered', filters] as const,
  stats: (filters?: EvaluationFilters) => ['evaluations', 'stats', filters] as const,
}

// Fetch all evaluations
export function useEvaluations() {
  return useQuery({
    queryKey: resultsKeys.all,
    queryFn: fetchEvaluations,
  })
}

// Fetch filtered evaluations
export function useFilteredEvaluations(filters: EvaluationFilters) {
  return useQuery({
    queryKey: resultsKeys.filtered(filters),
    queryFn: () => fetchFilteredEvaluations(filters),
    enabled: Object.keys(filters).length > 0,
  })
}

// Fetch evaluation statistics
export function useEvaluationStats(filters?: EvaluationFilters) {
  return useQuery({
    queryKey: resultsKeys.stats(filters),
    queryFn: () => getEvaluationStats(filters),
  })
}

