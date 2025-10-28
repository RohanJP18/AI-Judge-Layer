import { useQuery } from '@tanstack/react-query'
import {
  fetchConsensusAnalysis,
  fetchCostSummary,
  fetchDebugEvaluation,
  fetchDebugEvaluations,
  calculateInterRaterReliability,
} from '../api'

export const analyticsKeys = {
  consensus: ['analytics', 'consensus'] as const,
  costs: ['analytics', 'costs'] as const,
  reliability: ['analytics', 'reliability'] as const,
  debugEvaluations: ['analytics', 'debug'] as const,
  debugEvaluation: (id: string) => ['analytics', 'debug', id] as const,
}

export function useConsensusAnalysis() {
  return useQuery({
    queryKey: analyticsKeys.consensus,
    queryFn: fetchConsensusAnalysis,
    staleTime: 30000, // 30 seconds
  })
}

export function useCostSummary() {
  return useQuery({
    queryKey: analyticsKeys.costs,
    queryFn: fetchCostSummary,
    staleTime: 30000,
  })
}

export function useInterRaterReliability() {
  return useQuery({
    queryKey: analyticsKeys.reliability,
    queryFn: calculateInterRaterReliability,
    staleTime: 30000,
  })
}

export function useDebugEvaluations() {
  return useQuery({
    queryKey: analyticsKeys.debugEvaluations,
    queryFn: fetchDebugEvaluations,
    staleTime: 30000,
  })
}

export function useDebugEvaluation(evaluationId: string | null) {
  return useQuery({
    queryKey: evaluationId ? analyticsKeys.debugEvaluation(evaluationId) : ['analytics', 'debug', 'none'],
    queryFn: () => (evaluationId ? fetchDebugEvaluation(evaluationId) : Promise.resolve(null)),
    enabled: !!evaluationId,
  })
}

