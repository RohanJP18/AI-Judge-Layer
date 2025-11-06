import { supabase } from '@/api/supabase'
import { getCurrentUserId } from '@/api/authHelpers'
import type { SubmissionInput } from '@/shared/types/schemas'
import type { Database } from '@/shared/types/database'

type SubmissionRow = Database['public']['Tables']['submissions']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']

export interface SubmissionWithQuestions extends SubmissionRow {
  questions: QuestionRow[]
}

// Ingest submissions from uploaded JSON file
export async function ingestSubmissions(
  submissions: SubmissionInput[]
): Promise<{ success: number; failed: number }> {
  // Edge case: Empty array
  if (!submissions || submissions.length === 0) {
    throw new Error('No submissions provided. Please upload a valid JSON file with at least one submission.')
  }

  // Edge case: Too many submissions at once
  if (submissions.length > 1000) {
    throw new Error(`Too many submissions (${submissions.length}). Please upload in batches of 1000 or fewer.`)
  }

  let success = 0
  let failed = 0

  for (const submission of submissions) {
    try {
      // Edge case: Check for required fields
      if (!submission.queueId || !submission.labelingTaskId) {
        console.error('Missing required fields:', submission)
        failed++
        continue
      }

      // Edge case: Check for questions
      if (!submission.questions || submission.questions.length === 0) {
        console.error('Submission has no questions:', submission.queueId)
        failed++
        continue
      }

      // Edge case: Check for duplicate submission (by queue_id + labeling_task_id)
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('queue_id', submission.queueId)
        .eq('labeling_task_id', submission.labelingTaskId)
        .maybeSingle()

      if (existing) {
        console.warn('Duplicate submission detected, skipping:', submission.queueId)
        failed++
        continue
      }
      // Get current user ID
      const userId = await getCurrentUserId()

      // Insert submission (let database generate UUID)
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          queue_id: submission.queueId,
          labeling_task_id: submission.labelingTaskId,
          created_at: new Date(submission.createdAt).toISOString(),
          raw_json: submission,
          user_id: userId,
        })
        .select()
        .single()

      if (submissionError) {
        console.error('Error inserting submission:', submissionError)
        failed++
        continue
      }

      if (!submissionData) {
        console.error('No submission data returned')
        failed++
        continue
      }

      // Insert questions using the generated UUID
      const questions = submission.questions.map((q) => {
        const answer = submission.answers[q.data.id]
        return {
          submission_id: submissionData.id,
          question_id: q.data.id,
          question_type: q.data.questionType,
          question_text: q.data.questionText,
          answer_choice: answer?.choice || null,
          answer_reasoning: answer?.reasoning || null,
          rev: q.rev,
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions)

      if (questionsError) {
        console.error('Error inserting questions:', questionsError)
        // Rollback: delete the submission
        await supabase.from('submissions').delete().eq('id', submissionData.id)
        failed++
        continue
      }

      success++
    } catch (error) {
      console.error('Error processing submission:', error)
      failed++
    }
  }

  return { success, failed }
}

// Fetch all submissions with questions
export async function fetchSubmissions(): Promise<SubmissionWithQuestions[]> {
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (submissionsError) throw new Error(submissionsError.message)

  // Fetch questions for each submission
  const submissionsWithQuestions = await Promise.all(
    submissions.map(async (submission) => {
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('submission_id', submission.id)

      if (questionsError) throw new Error(questionsError.message)

      return {
        ...submission,
        questions: questions || [],
      }
    })
  )

  return submissionsWithQuestions
}

// Fetch unique question templates (for assignment UI)
export async function fetchQuestionTemplates(): Promise<
  { question_id: string; question_text: string; question_type: string }[]
> {
  const { data, error } = await supabase
    .from('questions')
    .select('question_id, question_text, question_type')
    .order('question_id')

  if (error) throw new Error(error.message)

  // Deduplicate by question_id
  const uniqueQuestions = data.reduce((acc, question) => {
    if (!acc.find((q) => q.question_id === question.question_id)) {
      acc.push(question)
    }
    return acc
  }, [] as typeof data)

  return uniqueQuestions
}

// Fetch questions for a specific submission
export async function fetchQuestionsBySubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('submission_id', submissionId)
    .order('question_id')

  if (error) throw new Error(error.message)

  return data
}

