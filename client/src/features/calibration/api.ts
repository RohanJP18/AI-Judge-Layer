import { supabase } from '@/api/supabase'

// Types
export interface GoldenQuestion {
  id: string
  question_id: string
  question_text: string
  question_type: string
  student_answer_choice: string | null
  student_answer_reasoning: string | null
  ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
  ground_truth_reasoning: string
  created_at: string
  metadata?: any
}

export interface GoldenQuestionInput {
  question_id: string
  question_text: string
  question_type: string
  student_answer_choice?: string
  student_answer_reasoning?: string
  ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
  ground_truth_reasoning: string
}

export interface CalibrationRun {
  id: string
  judge_id: string
  judge_name: string
  model_name: string
  created_at: string
  total_questions: number
  correct_predictions: number
  accuracy: number
  precision_pass: number | null
  recall_pass: number | null
  f1_pass: number | null
  precision_fail: number | null
  recall_fail: number | null
  f1_fail: number | null
  confusion_matrix: ConfusionMatrix
  passed_threshold: boolean
  notes: string | null
}

export interface ConfusionMatrix {
  true_positives: number
  false_positives: number
  true_negatives: number
  false_negatives: number
  pass_as_pass: number
  pass_as_fail: number
  pass_as_inconclusive: number
  fail_as_pass: number
  fail_as_fail: number
  fail_as_inconclusive: number
  inconclusive_as_pass: number
  inconclusive_as_fail: number
  inconclusive_as_inconclusive: number
}

export interface CalibrationResult {
  id: string
  calibration_run_id: string
  golden_question_id: string
  predicted_verdict: 'pass' | 'fail' | 'inconclusive'
  predicted_reasoning: string
  ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
  is_correct: boolean
  created_at: string
}

// Fetch all golden set questions
export async function fetchGoldenQuestions(): Promise<GoldenQuestion[]> {
  const { data, error } = await supabase
    .from('golden_set_questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Upload golden set from JSON
export async function uploadGoldenSet(
  questions: GoldenQuestionInput[]
): Promise<{ success: number; failed: number; duplicates: number }> {
  // Get current user for user_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated to upload golden set questions')
  }

  let success = 0
  let failed = 0
  let duplicates = 0

  for (const question of questions) {
    try {
      // Check for duplicates (within user's data)
      const { data: existing } = await supabase
        .from('golden_set_questions')
        .select('id')
        .eq('question_id', question.question_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        duplicates++
        continue
      }

      const { error } = await supabase
        .from('golden_set_questions')
        .insert({
          ...question,
          user_id: user.id, // Set user_id for RLS
        })

      if (error) {
        console.error('Error inserting golden question:', error)
        failed++
      } else {
        success++
      }
    } catch (error) {
      console.error('Error processing golden question:', error)
      failed++
    }
  }

  return { success, failed, duplicates }
}

// Delete golden question
export async function deleteGoldenQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('golden_set_questions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Run calibration for a judge
export async function runCalibration(judgeId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('run-calibration', {
    body: { judge_id: judgeId },
  })

  if (error) throw new Error(error.message)
  return data.calibration_run_id
}

// Fetch all calibration runs
export async function fetchCalibrationRuns(): Promise<CalibrationRun[]> {
  const { data, error } = await supabase
    .from('calibration_runs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Fetch calibration runs for a specific judge
export async function fetchJudgeCalibrationHistory(judgeId: string): Promise<CalibrationRun[]> {
  const { data, error } = await supabase
    .from('calibration_runs')
    .select('*')
    .eq('judge_id', judgeId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Fetch calibration results for a run
export async function fetchCalibrationResults(
  calibrationRunId: string
): Promise<Array<CalibrationResult & { golden_question: GoldenQuestion }>> {
  const { data, error } = await supabase
    .from('calibration_results')
    .select(`
      *,
      golden_question:golden_set_questions(*)
    `)
    .eq('calibration_run_id', calibrationRunId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  
  return (data || []).map((item: any) => ({
    ...item,
    golden_question: item.golden_question,
  })) as Array<CalibrationResult & { golden_question: GoldenQuestion }>
}

// Calculate metrics from confusion matrix
export function calculateMetrics(cm: ConfusionMatrix) {
  const tp = cm.true_positives
  const fp = cm.false_positives
  const tn = cm.true_negatives
  const fn = cm.false_negatives

  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const accuracy = ((tp + tn) / (tp + tn + fp + fn)) * 100

  return {
    precision: precision.toFixed(2),
    recall: recall.toFixed(2),
    f1: f1.toFixed(2),
    accuracy: accuracy.toFixed(2),
  }
}


