import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGoldenQuestions,
  uploadGoldenSet,
  deleteGoldenQuestion,
  runCalibration,
  fetchCalibrationRuns,
  fetchJudgeCalibrationHistory,
  fetchCalibrationResults,
  type GoldenQuestionInput,
} from '../api'
import { toast } from '@/shared/hooks/useToast'

export const calibrationKeys = {
  goldenQuestions: ['calibration', 'golden-questions'] as const,
  calibrationRuns: ['calibration', 'runs'] as const,
  judgeHistory: (judgeId: string) => ['calibration', 'judge', judgeId] as const,
  runResults: (runId: string) => ['calibration', 'results', runId] as const,
}

// Fetch golden questions
export function useGoldenQuestions() {
  return useQuery({
    queryKey: calibrationKeys.goldenQuestions,
    queryFn: fetchGoldenQuestions,
  })
}

// Upload golden set
export function useUploadGoldenSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questions: GoldenQuestionInput[]) => uploadGoldenSet(questions),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: calibrationKeys.goldenQuestions })
      
      if (result.duplicates > 0) {
        toast({
          title: 'Golden set uploaded with duplicates',
          description: `${result.success} added, ${result.duplicates} duplicates skipped, ${result.failed} failed`,
          variant: result.failed > 0 ? 'destructive' : 'default',
        })
      } else {
        toast({
          title: 'Golden set uploaded',
          description: `Successfully added ${result.success} question(s)`,
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Delete golden question
export function useDeleteGoldenQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteGoldenQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calibrationKeys.goldenQuestions })
      toast({
        title: 'Question deleted',
        description: 'Golden set question removed successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Run calibration
export function useRunCalibration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (judgeId: string) => runCalibration(judgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calibrationKeys.calibrationRuns })
      toast({
        title: 'Calibration complete',
        description: 'Judge calibration finished successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Calibration failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Fetch calibration runs
export function useCalibrationRuns() {
  return useQuery({
    queryKey: calibrationKeys.calibrationRuns,
    queryFn: fetchCalibrationRuns,
  })
}

// Fetch judge calibration history
export function useJudgeCalibrationHistory(judgeId: string | null) {
  return useQuery({
    queryKey: judgeId ? calibrationKeys.judgeHistory(judgeId) : ['calibration', 'judge', 'none'],
    queryFn: () => (judgeId ? fetchJudgeCalibrationHistory(judgeId) : Promise.resolve([])),
    enabled: !!judgeId,
  })
}

// Fetch calibration results
export function useCalibrationResults(runId: string | null) {
  return useQuery({
    queryKey: runId ? calibrationKeys.runResults(runId) : ['calibration', 'results', 'none'],
    queryFn: () => (runId ? fetchCalibrationResults(runId) : Promise.resolve([])),
    enabled: !!runId,
  })
}


