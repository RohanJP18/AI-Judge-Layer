import { supabase } from '@/api/supabase'
import type { Evaluation } from '@/shared/types/schemas'
import type { Database } from '@/shared/types/database'

type EvaluationRow = Database['public']['Tables']['evaluations']['Row']

export interface EvaluationWithDetails extends EvaluationRow {
  judge_name?: string
  question_text?: string
  submission_queue_id?: string
}

// Fetch all evaluations with joined data
export async function fetchEvaluations(): Promise<EvaluationWithDetails[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      judges (name),
      questions (question_text, submission_id),
      submissions!evaluations_submission_id_fkey (queue_id)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Transform the joined data
  return (data || []).map((evaluation: any) => ({
    ...evaluation,
    judge_name: evaluation.judges?.name,
    question_text: evaluation.questions?.question_text,
    submission_queue_id: evaluation.submissions?.queue_id,
  }))
}

// Fetch evaluations with filters
export interface EvaluationFilters {
  judgeIds?: string[]
  questionIds?: string[]
  verdicts?: string[]
}

export async function fetchFilteredEvaluations(
  filters: EvaluationFilters
): Promise<EvaluationWithDetails[]> {
  let query = supabase
    .from('evaluations')
    .select(`
      *,
      judges (name),
      questions (question_text, question_id, submission_id),
      submissions!evaluations_submission_id_fkey (queue_id)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.judgeIds && filters.judgeIds.length > 0) {
    query = query.in('judge_id', filters.judgeIds)
  }

  if (filters.questionIds && filters.questionIds.length > 0) {
    // Need to join with questions table to filter by question_id (template)
    // This requires a subquery approach
    const { data: questionRows, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .in('question_id', filters.questionIds)

    if (questionError) throw new Error(questionError.message)
    
    const questionInstanceIds = questionRows?.map((q) => q.id) || []
    if (questionInstanceIds.length > 0) {
      query = query.in('question_id', questionInstanceIds)
    } else {
      // No matching questions, return empty
      return []
    }
  }

  if (filters.verdicts && filters.verdicts.length > 0) {
    query = query.in('verdict', filters.verdicts)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Transform the joined data
  return (data || []).map((evaluation: any) => ({
    ...evaluation,
    judge_name: evaluation.judges?.name,
    question_text: evaluation.questions?.question_text,
    submission_queue_id: evaluation.submissions?.queue_id,
    template_question_id: evaluation.questions?.question_id,
  }))
}

// Get evaluation statistics
export interface EvaluationStats {
  total: number
  pass: number
  fail: number
  inconclusive: number
  passRate: number
}

export async function getEvaluationStats(
  filters?: EvaluationFilters
): Promise<EvaluationStats> {
  const evaluations = filters
    ? await fetchFilteredEvaluations(filters)
    : await fetchEvaluations()

  const total = evaluations.length
  const pass = evaluations.filter((e) => e.verdict === 'pass').length
  const fail = evaluations.filter((e) => e.verdict === 'fail').length
  const inconclusive = evaluations.filter((e) => e.verdict === 'inconclusive').length
  const passRate = total > 0 ? (pass / total) * 100 : 0

  return {
    total,
    pass,
    fail,
    inconclusive,
    passRate,
  }
}

