import { supabase } from '@/api/supabase'
import { getCurrentUserId } from '@/api/authHelpers'
import type { Database } from '@/shared/types/database'

type JudgeAssignmentRow = Database['public']['Tables']['judge_assignments']['Row']

export interface JudgeAssignment extends JudgeAssignmentRow {}

// Fetch all judge assignments
export async function fetchJudgeAssignments(): Promise<JudgeAssignment[]> {
  const { data, error } = await supabase
    .from('judge_assignments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}

// Fetch assignments for a specific question
export async function fetchAssignmentsByQuestion(
  questionId: string
): Promise<JudgeAssignment[]> {
  const { data, error } = await supabase
    .from('judge_assignments')
    .select('*')
    .eq('question_id', questionId)

  if (error) throw new Error(error.message)

  return data
}

// Assign judges to a question
export async function assignJudgesToQuestion(
  questionId: string,
  judgeIds: string[]
): Promise<JudgeAssignment[]> {
  // Edge case: Validate inputs
  if (!questionId || questionId.trim().length === 0) {
    throw new Error('Question ID is required')
  }

  // Edge case: Remove duplicates from judgeIds
  const uniqueJudgeIds = [...new Set(judgeIds.filter(id => id && id.trim().length > 0))]

  // Edge case: Limit number of judges per question
  if (uniqueJudgeIds.length > 50) {
    throw new Error('Cannot assign more than 50 judges to a single question')
  }

  // First, delete existing assignments for this question
  const { error: deleteError } = await supabase
    .from('judge_assignments')
    .delete()
    .eq('question_id', questionId)

  if (deleteError) throw new Error(deleteError.message)

  // Then, insert new assignments
  if (uniqueJudgeIds.length === 0) {
    return []
  }

  const userId = await getCurrentUserId()
  
  const assignments = uniqueJudgeIds.map((judgeId) => ({
    question_id: questionId,
    judge_id: judgeId,
    user_id: userId,
  }))

  const { data, error } = await supabase
    .from('judge_assignments')
    .insert(assignments)
    .select()

  if (error) {
    // Better error message for foreign key violations
    if (error.message.includes('foreign key')) {
      throw new Error('Invalid question or judge ID. Please refresh and try again.')
    }
    throw new Error(error.message)
  }

  return data
}

// Bulk assign judges to multiple questions
export async function bulkAssignJudges(
  assignments: { questionId: string; judgeIds: string[] }[]
): Promise<void> {
  for (const assignment of assignments) {
    await assignJudgesToQuestion(assignment.questionId, assignment.judgeIds)
  }
}

// Remove assignment
export async function removeAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('judge_assignments')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

