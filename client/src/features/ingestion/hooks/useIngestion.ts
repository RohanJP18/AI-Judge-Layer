import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubmissionInput } from '@/shared/types/schemas'
import { ingestSubmissions, fetchSubmissions, fetchQuestionTemplates, fetchQuestionsBySubmission } from '../api'
import { toast } from '@/shared/hooks/useToast'

// Query keys
export const ingestionKeys = {
  submissions: ['submissions'] as const,
  questionTemplates: ['questionTemplates'] as const,
  questionsBySubmission: (submissionId: string) => ['questions', submissionId] as const,
}

// Ingest submissions mutation
export function useIngestSubmissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissions: SubmissionInput[]) =>
      ingestSubmissions(submissions),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ingestionKeys.submissions })
      queryClient.invalidateQueries({ queryKey: ingestionKeys.questionTemplates })

      toast({
        title: 'Submissions ingested',
        description: `Successfully ingested ${result.success} submission(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error ingesting submissions',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Fetch submissions query
export function useSubmissions() {
  return useQuery({
    queryKey: ingestionKeys.submissions,
    queryFn: fetchSubmissions,
  })
}

// Fetch question templates query
export function useQuestionTemplates() {
  return useQuery({
    queryKey: ingestionKeys.questionTemplates,
    queryFn: fetchQuestionTemplates,
  })
}

// Fetch questions by submission query
export function useQuestionsBySubmission(submissionId: string | null) {
  return useQuery({
    queryKey: submissionId ? ingestionKeys.questionsBySubmission(submissionId) : ['questions', 'none'],
    queryFn: () => submissionId ? fetchQuestionsBySubmission(submissionId) : Promise.resolve([]),
    enabled: !!submissionId,
  })
}

