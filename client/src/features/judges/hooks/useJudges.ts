import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Judge, JudgeCreate, JudgeUpdate } from '@/shared/types/schemas'
import {
  fetchJudges,
  fetchActiveJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  deactivateJudge,
} from '../api'
import { toast } from '@/shared/hooks/useToast'

// Query keys
export const judgeKeys = {
  all: ['judges'] as const,
  active: ['judges', 'active'] as const,
  detail: (id: string) => ['judges', id] as const,
}

// Fetch all judges
export function useJudges() {
  return useQuery({
    queryKey: judgeKeys.all,
    queryFn: fetchJudges,
  })
}

// Fetch active judges only
export function useActiveJudges() {
  return useQuery({
    queryKey: judgeKeys.active,
    queryFn: fetchActiveJudges,
  })
}

// Create judge mutation
export function useCreateJudge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (judge: JudgeCreate) => createJudge(judge),
    onSuccess: (newJudge) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: judgeKeys.all })
      queryClient.invalidateQueries({ queryKey: judgeKeys.active })
      
      toast({
        title: 'Judge created',
        description: `"${newJudge.name}" has been created successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating judge',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Update judge mutation
export function useUpdateJudge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: JudgeUpdate }) =>
      updateJudge(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: judgeKeys.all })

      // Snapshot previous value
      const previousJudges = queryClient.getQueryData<Judge[]>(judgeKeys.all)

      // Optimistically update
      if (previousJudges) {
        queryClient.setQueryData<Judge[]>(
          judgeKeys.all,
          previousJudges.map((judge) =>
            judge.id === id ? { ...judge, ...updates } : judge
          )
        )
      }

      return { previousJudges }
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousJudges) {
        queryClient.setQueryData(judgeKeys.all, context.previousJudges)
      }
      
      toast({
        title: 'Error updating judge',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: (updatedJudge) => {
      queryClient.invalidateQueries({ queryKey: judgeKeys.all })
      queryClient.invalidateQueries({ queryKey: judgeKeys.active })
      
      toast({
        title: 'Judge updated',
        description: `"${updatedJudge.name}" has been updated successfully.`,
      })
    },
  })
}

// Delete judge mutation
export function useDeleteJudge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteJudge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: judgeKeys.all })
      queryClient.invalidateQueries({ queryKey: judgeKeys.active })
      
      toast({
        title: 'Judge deleted',
        description: 'The judge has been deleted successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting judge',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Deactivate judge mutation
export function useDeactivateJudge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateJudge(id),
    onSuccess: (deactivatedJudge) => {
      queryClient.invalidateQueries({ queryKey: judgeKeys.all })
      queryClient.invalidateQueries({ queryKey: judgeKeys.active })
      
      toast({
        title: 'Judge deactivated',
        description: `"${deactivatedJudge.name}" has been deactivated.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deactivating judge',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

