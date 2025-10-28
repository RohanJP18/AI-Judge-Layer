import { supabase } from '@/api/supabase'

export interface ConsensusData {
  submission_id: string
  question_id: string
  judge_count: number
  unique_verdicts: number
  consensus_verdict: 'pass' | 'fail' | 'inconclusive'
  agreement_level: 'unanimous' | 'split' | 'highly_disputed'
  judge_verdicts: Array<{
    judge_id: string
    verdict: string
    reasoning: string
  }>
}

export interface CostSummary {
  total_evaluations: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost: number
  cost_by_model: Array<{
    model_name: string
    count: number
    input_tokens: number
    output_tokens: number
    cost: number
  }>
  cost_by_judge: Array<{
    judge_id: string
    judge_name: string
    count: number
    cost: number
  }>
}

export interface DebugEvaluation {
  id: string
  created_at: string
  submission_id: string
  question_id: string
  judge_id: string
  judge_name: string
  model_name: string
  verdict: 'pass' | 'fail' | 'inconclusive'
  reasoning: string
  prompt_sent: string
  raw_response: string
  input_tokens: number
  output_tokens: number
  estimated_cost: number
  duration_ms: number
  retry_count: number
  error: string | null
}

// Fetch consensus data
export async function fetchConsensusAnalysis(): Promise<ConsensusData[]> {
  const { data, error } = await supabase
    .from('evaluation_consensus')
    .select('*')
    .order('judge_count', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Fetch cost summary
export async function fetchCostSummary(): Promise<CostSummary> {
  // Get all evaluations with cost data
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      judges:judges(name)
    `)
    .not('estimated_cost', 'is', null)

  if (error) throw new Error(error.message)

  const totalEvaluations = evaluations?.length || 0
  const totalInputTokens = evaluations?.reduce((sum, e) => sum + (e.input_tokens || 0), 0) || 0
  const totalOutputTokens = evaluations?.reduce((sum, e) => sum + (e.output_tokens || 0), 0) || 0
  const totalCost = evaluations?.reduce((sum, e) => sum + (e.estimated_cost || 0), 0) || 0

  // Group by model
  const modelGroups = new Map<string, any>()
  evaluations?.forEach((e) => {
    const model = e.model_name
    if (!modelGroups.has(model)) {
      modelGroups.set(model, {
        model_name: model,
        count: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
      })
    }
    const group = modelGroups.get(model)
    group.count++
    group.input_tokens += e.input_tokens || 0
    group.output_tokens += e.output_tokens || 0
    group.cost += e.estimated_cost || 0
  })

  // Group by judge
  const judgeGroups = new Map<string, any>()
  evaluations?.forEach((e) => {
    const judgeId = e.judge_id
    if (!judgeGroups.has(judgeId)) {
      judgeGroups.set(judgeId, {
        judge_id: judgeId,
        judge_name: (e.judges as any)?.name || 'Unknown',
        count: 0,
        cost: 0,
      })
    }
    const group = judgeGroups.get(judgeId)
    group.count++
    group.cost += e.estimated_cost || 0
  })

  return {
    total_evaluations: totalEvaluations,
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    total_cost: totalCost,
    cost_by_model: Array.from(modelGroups.values()).sort((a, b) => b.cost - a.cost),
    cost_by_judge: Array.from(judgeGroups.values()).sort((a, b) => b.cost - a.cost),
  }
}

// Fetch evaluation for debugging
export async function fetchDebugEvaluation(evaluationId: string): Promise<DebugEvaluation> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      judges:judges(name)
    `)
    .eq('id', evaluationId)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    judge_name: (data.judges as any)?.name || 'Unknown',
  } as DebugEvaluation
}

// Fetch all evaluations with debug info
export async function fetchDebugEvaluations(): Promise<DebugEvaluation[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      judges:judges(name)
    `)
    .not('prompt_sent', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  return (data || []).map((e) => ({
    ...e,
    judge_name: (e.judges as any)?.name || 'Unknown',
  })) as DebugEvaluation[]
}

// Calculate inter-rater reliability (simple agreement percentage)
export async function calculateInterRaterReliability() {
  const consensus = await fetchConsensusAnalysis()

  const totalQuestions = consensus.length
  const unanimousCount = consensus.filter((c) => c.agreement_level === 'unanimous').length
  const splitCount = consensus.filter((c) => c.agreement_level === 'split').length
  const disputedCount = consensus.filter((c) => c.agreement_level === 'highly_disputed').length

  const agreementRate = totalQuestions > 0 ? (unanimousCount / totalQuestions) * 100 : 0

  return {
    total_questions_with_multiple_judges: totalQuestions,
    unanimous: unanimousCount,
    split: splitCount,
    highly_disputed: disputedCount,
    agreement_rate: agreementRate,
  }
}

