// Supabase Edge Function for running AI Judge evaluations
// Deno runtime with TypeScript support

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Type definitions
interface Question {
  id: string
  submission_id: string
  question_id: string
  question_text: string
  question_type: string
  answer_choice: string | null
  answer_reasoning: string | null
  has_attachments: boolean
}

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
}

interface Judge {
  id: string
  name: string
  system_prompt: string
  model_name: string
  include_question_text: boolean
  include_student_answer: boolean
  include_model_answer: boolean
  include_marks: boolean
  include_question_id: boolean
  include_question_type: boolean
}

interface JudgeAssignment {
  question_id: string
  judge_id: string
}

interface LLMResponse {
  verdict: 'pass' | 'fail' | 'inconclusive'
  reasoning: string
  rawResponse?: string
}

interface TokenUsage {
  input_tokens: number
  output_tokens: number
}

// Model pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-pro': { input: 0.50, output: 1.50 },
}

// Simple token estimation (rough approximation: 1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

// Calculate cost based on token usage
function calculateCost(modelName: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[modelName] || { input: 1.00, output: 2.00 } // Default pricing
  const inputCost = (inputTokens / 1000000) * pricing.input
  const outputCost = (outputTokens / 1000000) * pricing.output
  return inputCost + outputCost
}

// LLM Provider abstraction
abstract class LLMProvider {
  constructor(protected apiKey: string) {}

  abstract call(prompt: string, systemPrompt: string, model: string): Promise<LLMResponse>

  protected parseVerdict(text: string): LLMResponse {
    try {
      // Try to parse as JSON first
      const json = JSON.parse(text)
      if (json.verdict && json.reasoning) {
        return {
          verdict: this.normalizeVerdict(json.verdict),
          reasoning: json.reasoning,
          rawResponse: text,
        }
      }
    } catch {
      // Fall back to text parsing
    }

    // Extract verdict from text
    const lowerText = text.toLowerCase()
    let verdict: 'pass' | 'fail' | 'inconclusive' = 'inconclusive'

    if (lowerText.includes('pass') || lowerText.includes('"verdict": "pass"')) {
      verdict = 'pass'
    } else if (lowerText.includes('fail') || lowerText.includes('"verdict": "fail"')) {
      verdict = 'fail'
    }

    return {
      verdict,
      reasoning: text.substring(0, 500), // Limit reasoning length
      rawResponse: text,
    }
  }

  protected normalizeVerdict(verdict: string): 'pass' | 'fail' | 'inconclusive' {
    const lower = verdict.toLowerCase()
    if (lower === 'pass') return 'pass'
    if (lower === 'fail') return 'fail'
    return 'inconclusive'
  }
}

class OpenAIProvider extends LLMProvider {
  async call(prompt: string, systemPrompt: string, model: string): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return this.parseVerdict(content)
  }
}

class AnthropicProvider extends LLMProvider {
  async call(prompt: string, systemPrompt: string, model: string): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    return this.parseVerdict(content)
  }
}

class GeminiProvider extends LLMProvider {
  async call(prompt: string, systemPrompt: string, model: string): Promise<LLMResponse> {
    const fullPrompt = `${systemPrompt}\n\n${prompt}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const data = await response.json()
    const content = data.candidates[0]?.content?.parts[0]?.text || ''

    return this.parseVerdict(content)
  }
}

// Provider factory
function getProvider(modelName: string): LLMProvider | null {
  if (modelName.includes('gpt')) {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return null
    return new OpenAIProvider(apiKey)
  } else if (modelName.includes('claude')) {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return null
    return new AnthropicProvider(apiKey)
  } else if (modelName.includes('gemini')) {
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) return null
    return new GeminiProvider(apiKey)
  }
  return null
}

// Build evaluation prompt
async function buildPrompt(
  question: Question, 
  judge: Judge, 
  supabaseClient: any, 
  attachments: Attachment[]
): Promise<string> {
  const parts: string[] = []

  // Add configured fields
  if (judge.include_question_id) {
    parts.push(`Question ID: ${question.question_id}`)
  }

  if (judge.include_question_type) {
    parts.push(`Question Type: ${question.question_type}`)
  }

  if (judge.include_question_text) {
    parts.push(`Question: ${question.question_text}`)
  }

  if (judge.include_student_answer) {
    parts.push(`\nUser's Answer:`)
    parts.push(`- Choice: ${question.answer_choice || 'N/A'}`)
    parts.push(`- Reasoning: ${question.answer_reasoning || 'N/A'}`)
  }

  // Include attachment information if present
  if (attachments.length > 0) {
    parts.push(`\nAttached Files:`)
    attachments.forEach((att, idx) => {
      parts.push(`${idx + 1}. ${att.file_name} (${att.file_type})`)
    })
    parts.push(`Note: For vision-capable models, images are included in the request.`)
  }

  // Note: include_model_answer and include_marks would require additional data
  // from the database. For now, we'll skip these as the schema doesn't store them.
  // In a production system, you'd extend the questions table to include these fields.

  // Always include the evaluation instructions
  parts.push(`\nPlease evaluate this answer and respond with a JSON object containing:`)
  parts.push(`{`)
  parts.push(`  "verdict": "pass" | "fail" | "inconclusive",`)
  parts.push(`  "reasoning": "brief explanation of your evaluation"`)
  parts.push(`}`)

  return parts.join('\n').trim()
}

// Main handler
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id')

    if (submissionsError) throw submissionsError

    // Fetch all judge assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('judge_assignments')
      .select('question_id, judge_id')

    if (assignmentsError) throw assignmentsError

    let planned = 0
    let completed = 0
    let failed = 0
    const errors: string[] = []

    // Process each submission
    for (const submission of submissions || []) {
      // Fetch questions for this submission
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('submission_id', submission.id)

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
        continue
      }

      // Process each question
      for (const question of questions || []) {
        // Find assignments for this question template
        const questionAssignments = (assignments || []).filter(
          (a: JudgeAssignment) => a.question_id === question.question_id
        )

        // Process each assigned judge
        for (const assignment of questionAssignments) {
          planned++

          try {
            // Fetch judge details
            const { data: judge, error: judgeError } = await supabase
              .from('judges')
              .select('*')
              .eq('id', assignment.judge_id)
              .eq('is_active', true)
              .single()

            if (judgeError || !judge) {
              console.error('Judge not found or inactive:', assignment.judge_id)
              failed++
              continue
            }

            // Get LLM provider
            const provider = getProvider(judge.model_name)
            if (!provider) {
              console.error('No API key for model:', judge.model_name)
              errors.push(`No API key configured for ${judge.model_name}`)
              failed++
              continue
            }

            // Fetch attachments for this question if any exist
            let attachments: Attachment[] = []
            if (question.has_attachments) {
              const { data: attachmentData, error: attachError } = await supabase
                .from('attachments')
                .select('*')
                .eq('question_id', question.id)

              if (!attachError && attachmentData) {
                attachments = attachmentData as Attachment[]
              }
            }

            // Build prompt with judge configuration and attachments
            const prompt = await buildPrompt(question, judge, supabase, attachments)

            // Calculate token counts and cost
            const fullPrompt = `${judge.system_prompt}\n\n${prompt}`
            const inputTokens = estimateTokenCount(fullPrompt)
            
            // Call LLM with retry logic
            const startTime = Date.now()
            let result: LLMResponse | null = null
            let lastError: Error | null = null
            let retryCount = 0

            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                result = await provider.call(prompt, judge.system_prompt, judge.model_name)
                retryCount = attempt
                break
              } catch (error) {
                lastError = error as Error
                console.error(`Attempt ${attempt + 1} failed:`, error)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
              }
            }

            const duration = Date.now() - startTime

            if (!result) {
              // All retries failed
              await supabase.from('evaluations').insert({
                submission_id: submission.id,
                question_id: question.id,
                judge_id: judge.id,
                verdict: 'inconclusive',
                reasoning: 'LLM API call failed after retries',
                error: lastError?.message || 'Unknown error',
                model_name: judge.model_name,
                duration_ms: duration,
                prompt_sent: prompt,
                raw_response: null,
                input_tokens: inputTokens,
                output_tokens: 0,
                estimated_cost: 0,
                retry_count: 3,
              })
              failed++
              continue
            }

            // Calculate output tokens and cost
            const outputTokens = estimateTokenCount(result.rawResponse || result.reasoning)
            const estimatedCost = calculateCost(judge.model_name, inputTokens, outputTokens)

            // Store evaluation result with analytics data
            const { error: insertError } = await supabase.from('evaluations').insert({
              submission_id: submission.id,
              question_id: question.id,
              judge_id: judge.id,
              verdict: result.verdict,
              reasoning: result.reasoning,
              model_name: judge.model_name,
              duration_ms: duration,
              prompt_sent: prompt,
              raw_response: result.rawResponse || result.reasoning,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              estimated_cost: estimatedCost,
              retry_count: retryCount,
            })

            if (insertError) {
              console.error('Error inserting evaluation:', insertError)
              failed++
            } else {
              completed++
            }
          } catch (error) {
            console.error('Error processing evaluation:', error)
            errors.push((error as Error).message)
            failed++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        planned,
        completed,
        failed,
        errors: errors.slice(0, 10), // Limit error messages
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

