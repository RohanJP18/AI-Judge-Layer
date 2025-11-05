/// <reference types="https://esm.sh/@deno/types/index.d.ts" />
// Supabase Edge Function for running judge calibration against golden set
// Tests judge accuracy against pre-evaluated questions with known correct verdicts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { judge_id } = await req.json()

    if (!judge_id) {
      throw new Error('Judge ID is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch judge details
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .eq('id', judge_id)
      .single()

    if (judgeError || !judge) {
      throw new Error('Judge not found')
    }

    // Fetch all golden set questions (ordered for consistency)
    const { data: goldenQuestions, error: goldenError } = await supabase
      .from('golden_set_questions')
      .select('*')
      .order('question_id', { ascending: true })

    if (goldenError) throw goldenError

    if (!goldenQuestions || goldenQuestions.length === 0) {
      throw new Error('No golden set questions found. Please upload a golden set first.')
    }

    // Get LLM provider (reuse logic from run-evaluations)
    const getProvider = (modelName: string) => {
      if (modelName.startsWith('gpt-')) {
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        return apiKey ? { type: 'openai', apiKey } : null
      } else if (modelName.startsWith('claude-')) {
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
        return apiKey ? { type: 'anthropic', apiKey } : null
      } else if (modelName.startsWith('gemini-')) {
        const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
        return apiKey ? { type: 'gemini', apiKey } : null
      }
      return null
    }

    const provider = getProvider(judge.model_name)
    if (!provider) {
      throw new Error(`No API key configured for model: ${judge.model_name}`)
    }

    // Run evaluation for each golden question
    const results: any[] = []
    let correctCount = 0

    // Confusion matrix counters
    const confusionMatrix = {
      pass_as_pass: 0,
      pass_as_fail: 0,
      pass_as_inconclusive: 0,
      fail_as_pass: 0,
      fail_as_fail: 0,
      fail_as_inconclusive: 0,
      inconclusive_as_pass: 0,
      inconclusive_as_fail: 0,
      inconclusive_as_inconclusive: 0,
    }

    for (const question of goldenQuestions) {
      try {
        // Build prompt (using judge's prompt configuration)
        const promptParts: string[] = []
        
        if (judge.include_question_text !== false) {
          promptParts.push(`Question: ${question.question_text}`)
        }
        
        if (judge.include_question_type !== false) {
          promptParts.push(`Question Type: ${question.question_type}`)
        }
        
        if (judge.include_student_answer !== false) {
          promptParts.push(`Student's Answer:`)
          if (question.student_answer_choice) {
            promptParts.push(`- Choice: ${question.student_answer_choice}`)
          }
          if (question.student_answer_reasoning) {
            promptParts.push(`- Reasoning: ${question.student_answer_reasoning}`)
          }
        }
        
        const prompt = promptParts.join('\n\n') + `

Please evaluate this answer and respond with a JSON object containing:
{
  "verdict": "pass" | "fail" | "inconclusive",
  "reasoning": "brief explanation of your evaluation"
}
`.trim()

        // Call LLM
        let verdict = 'inconclusive'
        let reasoning = 'Error occurred'

        if (provider.type === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: judge.model_name,
              messages: [
                { role: 'system', content: judge.system_prompt },
                { role: 'user', content: prompt },
              ],
              temperature: 0, // Deterministic for calibration
              max_tokens: 500,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const content = data.choices[0]?.message?.content || ''
            const parsed = parseVerdict(content)
            verdict = parsed.verdict
            reasoning = parsed.reasoning
          } else {
            const errorText = await response.text()
            console.error(`OpenAI API error for question ${question.question_id}:`, errorText)
            verdict = 'inconclusive'
            reasoning = `API Error: ${response.status} ${errorText.substring(0, 200)}`
          }
        } else if (provider.type === 'anthropic') {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': provider.apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: judge.model_name,
              max_tokens: 500,
              system: judge.system_prompt,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0, // Deterministic for calibration
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const content = data.content[0]?.text || ''
            const parsed = parseVerdict(content)
            verdict = parsed.verdict
            reasoning = parsed.reasoning
          } else {
            const errorText = await response.text()
            console.error(`Anthropic API error for question ${question.question_id}:`, errorText)
            verdict = 'inconclusive'
            reasoning = `API Error: ${response.status} ${errorText.substring(0, 200)}`
          }
        } else if (provider.type === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${judge.model_name}:generateContent?key=${provider.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: judge.system_prompt + '\n\n' + prompt },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0, // Deterministic for calibration
                  maxOutputTokens: 500,
                },
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const parsed = parseVerdict(content)
            verdict = parsed.verdict
            reasoning = parsed.reasoning
          } else {
            const errorText = await response.text()
            console.error(`Gemini API error for question ${question.question_id}:`, errorText)
            verdict = 'inconclusive'
            reasoning = `API Error: ${response.status} ${errorText.substring(0, 200)}`
          }
        }

        // Normalize both verdicts for comparison (ensure lowercase)
        const normalizedPredicted = normalizeVerdict(verdict)
        const normalizedGroundTruth = normalizeVerdict(question.ground_truth_verdict)
        const isCorrect = normalizedPredicted === normalizedGroundTruth
        
        if (isCorrect) {
          correctCount++
        } else {
          // Log mismatches for debugging
          console.log(`Mismatch on question ${question.question_id}: Expected "${normalizedGroundTruth}", Got "${normalizedPredicted}"`)
        }

        // Update confusion matrix (use normalized verdicts)
        const key = `${normalizedGroundTruth}_as_${normalizedPredicted}` as keyof typeof confusionMatrix
        if (key in confusionMatrix) {
          confusionMatrix[key]++
        }

        results.push({
          golden_question_id: question.id,
          predicted_verdict: normalizedPredicted, // Store normalized version
          predicted_reasoning: reasoning,
          ground_truth_verdict: normalizedGroundTruth, // Store normalized version
          is_correct: isCorrect,
        })
      } catch (error) {
        console.error('Error evaluating question:', error)
        results.push({
          golden_question_id: question.id,
          predicted_verdict: 'inconclusive',
          predicted_reasoning: 'Error: ' + (error as Error).message,
          ground_truth_verdict: question.ground_truth_verdict,
          is_correct: false,
        })
      }
    }

    // Calculate metrics
    const accuracy = (correctCount / goldenQuestions.length) * 100
    const passedThreshold = accuracy >= 90

    // Calculate precision, recall, F1 for "pass" and "fail"
    const tpPass = confusionMatrix.pass_as_pass
    const fpPass = confusionMatrix.fail_as_pass + confusionMatrix.inconclusive_as_pass
    const fnPass = confusionMatrix.pass_as_fail + confusionMatrix.pass_as_inconclusive
    
    const precisionPass = tpPass + fpPass > 0 ? (tpPass / (tpPass + fpPass)) * 100 : 0
    const recallPass = tpPass + fnPass > 0 ? (tpPass / (tpPass + fnPass)) * 100 : 0
    const f1Pass = precisionPass + recallPass > 0 ? (2 * precisionPass * recallPass) / (precisionPass + recallPass) : 0

    const tpFail = confusionMatrix.fail_as_fail
    const fpFail = confusionMatrix.pass_as_fail + confusionMatrix.inconclusive_as_fail
    const fnFail = confusionMatrix.fail_as_pass + confusionMatrix.fail_as_inconclusive
    
    const precisionFail = tpFail + fpFail > 0 ? (tpFail / (tpFail + fpFail)) * 100 : 0
    const recallFail = tpFail + fnFail > 0 ? (tpFail / (tpFail + fnFail)) * 100 : 0
    const f1Fail = precisionFail + recallFail > 0 ? (2 * precisionFail * recallFail) / (precisionFail + recallFail) : 0

    // Create calibration run record
    const { data: calibrationRun, error: runError } = await supabase
      .from('calibration_runs')
      .insert({
        judge_id: judge.id,
        judge_name: judge.name,
        model_name: judge.model_name,
        total_questions: goldenQuestions.length,
        correct_predictions: correctCount,
        accuracy: accuracy,
        precision_pass: precisionPass,
        recall_pass: recallPass,
        f1_pass: f1Pass,
        precision_fail: precisionFail,
        recall_fail: recallFail,
        f1_fail: f1Fail,
        confusion_matrix: {
          ...confusionMatrix,
          true_positives: tpPass,
          false_positives: fpPass,
          true_negatives: confusionMatrix.fail_as_fail,
          false_negatives: fnPass,
        },
        passed_threshold: passedThreshold,
      })
      .select()
      .single()

    if (runError) throw runError

    // Insert calibration results
    const resultsToInsert = results.map((r) => ({
      ...r,
      calibration_run_id: calibrationRun.id,
    }))

    const { error: resultsError } = await supabase
      .from('calibration_results')
      .insert(resultsToInsert)

    if (resultsError) throw resultsError

    return new Response(
      JSON.stringify({
        success: true,
        calibration_run_id: calibrationRun.id,
        accuracy,
        passed_threshold: passedThreshold,
        total_questions: goldenQuestions.length,
        correct_predictions: correctCount,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Calibration error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const statusCode = errorMessage.includes('not found') ? 404 : 
                      errorMessage.includes('required') ? 400 : 500
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

// Helper function to parse verdict
function parseVerdict(text: string): { verdict: string; reasoning: string } {
  try {
    const json = JSON.parse(text)
    if (json.verdict && json.reasoning) {
      return {
        verdict: normalizeVerdict(json.verdict),
        reasoning: json.reasoning,
      }
    }
  } catch {
    // Fall back to text parsing
  }

  const lowerText = text.toLowerCase()
  let verdict = 'inconclusive'

  if (lowerText.includes('pass') || lowerText.includes('"verdict": "pass"')) {
    verdict = 'pass'
  } else if (lowerText.includes('fail') || lowerText.includes('"verdict": "fail"')) {
    verdict = 'fail'
  }

  return {
    verdict,
    reasoning: text.substring(0, 500),
  }
}

function normalizeVerdict(verdict: string): string {
  const lower = verdict.toLowerCase()
  if (lower === 'pass') return 'pass'
  if (lower === 'fail') return 'fail'
  return 'inconclusive'
}


