import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchJudgeAssignments,
  fetchAssignmentsByQuestion,
  assignJudgesToQuestion,
  bulkAssignJudges,
  removeAssignment,
} from '../api'
import { toast } from '@/shared/hooks/useToast'

// Query keys
export const assignmentKeys = {
  all: ['assignments'] as const,
  byQuestion: (questionId: string) => ['assignments', 'question', questionId] as const,
}

// Fetch all assignments
export function useJudgeAssignments() {
  return useQuery({
    queryKey: assignmentKeys.all,
    queryFn: fetchJudgeAssignments,
  })
}

// Fetch assignments for a specific question
export function useAssignmentsByQuestion(questionId: string) {
  return useQuery({
    queryKey: assignmentKeys.byQuestion(questionId),
    queryFn: () => fetchAssignmentsByQuestion(questionId),
  })
}

// Assign judges to question mutation
export function useAssignJudges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      questionId,
      judgeIds,
    }: {
      questionId: string
      judgeIds: string[]
    }) => assignJudgesToQuestion(questionId, judgeIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.byQuestion(variables.questionId),
      })

      toast({
        title: 'Judges assigned',
        description: `Successfully assigned ${variables.judgeIds.length} judge(s) to question.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error assigning judges',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Bulk assign judges mutation
export function useBulkAssignJudges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      assignments: { questionId: string; judgeIds: string[] }[]
    ) => bulkAssignJudges(assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })

      toast({
        title: 'Bulk assignment complete',
        description: 'Judges have been assigned to questions successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error in bulk assignment',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Remove assignment mutation
export function useRemoveAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })

      toast({
        title: 'Assignment removed',
        description: 'The assignment has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing assignment',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

