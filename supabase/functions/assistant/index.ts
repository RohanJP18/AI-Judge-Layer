/// <reference types="https://esm.sh/@deno/types/index.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AssistantRequest {
  message: string
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: {
    currentPath?: string
    currentPage?: string
  }
}

// Get user memory/preferences (with error handling for missing table)
async function getUserMemory(supabase: any, userId: string | null) {
  if (!userId) return {
    common_queries: [],
    preferred_judges: [],
    frequent_queues: [],
    last_asked_about: {},
    preferences: {},
  }

  try {
    const { data } = await supabase
      .from('assistant_memory')
      .select('*')
      .eq('user_id', userId)
      .single()

    return data || {
      common_queries: [],
      preferred_judges: [],
      frequent_queues: [],
      last_asked_about: {},
      preferences: {},
    }
  } catch (error) {
    // Table might not exist - return default
    return {
      common_queries: [],
      preferred_judges: [],
      frequent_queues: [],
      last_asked_about: {},
      preferences: {},
    }
  }
}

// Update user memory (with error handling)
async function updateUserMemory(
  supabase: any,
  userId: string | null,
  updates: {
    common_queries?: string[]
    last_asked_about?: Record<string, any>
    preferred_judges?: string[]
  }
) {
  if (!userId) return

  try {
    const { data: existing } = await supabase
      .from('assistant_memory')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('assistant_memory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('assistant_memory')
        .insert({
          user_id: userId,
          ...updates,
        })
    }
  } catch (error) {
    // Table might not exist - ignore
    console.error('Error updating memory (non-critical):', error)
  }
}

// Analyze message intent for smart RAG
function analyzeIntent(message: string): {
  intent: string
  needsDetailedData: boolean
  entities: Record<string, string>
} {
  const lower = message.toLowerCase()
  const entities: Record<string, string> = {}

  // Extract entities
  const submissionMatch = lower.match(/(?:submission|queue)\s+(\w+)/)
  if (submissionMatch) entities.submissionId = submissionMatch[1]

  const judgeMatch = lower.match(/(?:judge)\s+(\w+)/)
  if (judgeMatch) entities.judgeId = judgeMatch[1]

  const evaluationMatch = lower.match(/(?:evaluation|result)\s+(\w+)/)
  if (evaluationMatch) entities.evaluationId = evaluationMatch[1]

  // Determine intent
  let intent = 'general'
  let needsDetailedData = false

  if (lower.includes('show') || lower.includes('list') || lower.includes('display')) {
    intent = 'retrieve'
    needsDetailedData = true
  } else if (lower.includes('create') || lower.includes('make') || lower.includes('add')) {
    intent = 'create'
  } else if (lower.includes('run') || lower.includes('execute') || lower.includes('start')) {
    intent = 'execute'
  } else if (lower.includes('explain') || lower.includes('why') || lower.includes('how')) {
    intent = 'explain'
    needsDetailedData = true
  } else if (lower.includes('count') || lower.includes('how many') || lower.includes('statistics')) {
    intent = 'statistics'
  } else if (lower.includes('compare') || lower.includes('difference')) {
    intent = 'compare'
    needsDetailedData = true
  }

  return { intent, needsDetailedData, entities }
}

// Smart RAG - Get relevant data based on intent (works without user_id)
async function getRelevantData(
  supabase: any,
  userId: string | null,
  intent: string,
  entities: Record<string, string>,
  needsDetailedData: boolean
) {
  const data: any = {}

  try {
    // Get basic stats (no user filter since auth isn't implemented)
    const { count: submissionsCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })

    const { count: evaluationsCount } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })

    const { data: judges } = await supabase
      .from('judges')
      .select('id, name, model_name, is_active')

    data.submissionsCount = submissionsCount || 0
    data.evaluationsCount = evaluationsCount || 0
    data.judges = judges || []

    // Get detailed data only if needed
    if (needsDetailedData || intent === 'retrieve' || intent === 'explain') {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, queue_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      data.submissions = submissions || []

      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('id, verdict, reasoning, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      data.evaluations = evaluations || []
      data.verdictCounts = (evaluations || []).reduce((acc: Record<string, number>, e: any) => {
        acc[e.verdict] = (acc[e.verdict] || 0) + 1
        return acc
      }, {})

      if (entities.submissionId) {
        const { data: submission } = await supabase
          .from('submissions')
          .select('*, questions(*)')
          .eq('queue_id', entities.submissionId)
          .maybeSingle()
        data.specificSubmission = submission
      }

      if (entities.judgeId) {
        const { data: judge } = await supabase
          .from('judges')
          .select('*')
          .eq('id', entities.judgeId)
          .maybeSingle()
        data.specificJudge = judge
      }
    }

    if (intent === 'statistics') {
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('verdict, created_at')

      data.verdictCounts = (evaluations || []).reduce((acc: Record<string, number>, e: any) => {
        acc[e.verdict] = (acc[e.verdict] || 0) + 1
        return acc
      }, {})

      const total = (evaluations || []).length
      data.passRate = total > 0 ? ((data.verdictCounts.pass || 0) / total * 100).toFixed(1) : 0
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    data.submissionsCount = 0
    data.evaluationsCount = 0
    data.judges = []
  }

  return data
}

// Build enhanced system prompt
function buildSystemPrompt(
  userContext: any,
  userMemory: any,
  pageContext?: { currentPath?: string; currentPage?: string }
) {
  const pageInfo = pageContext?.currentPage 
    ? `\n=== CURRENT PAGE CONTEXT ===
The user is currently on the "${pageContext.currentPage}" page (${pageContext.currentPath}).
When answering questions, reference what they're likely seeing on this page.
`
    : ''

  const memoryInfo = userMemory.common_queries?.length > 0 || userMemory.preferred_judges?.length > 0
    ? `\n=== USER MEMORY & PREFERENCES ===
${userMemory.common_queries?.length > 0 ? `Common queries: ${userMemory.common_queries.slice(0, 3).join(', ')}\n` : ''}
${userMemory.preferred_judges?.length > 0 ? `Preferred judges: ${userMemory.preferred_judges.join(', ')}\n` : ''}
`
    : ''

  const contextSummary = `
=== USER'S CURRENT DATA ===
- Submissions: ${userContext.submissionsCount}
- Evaluations: ${userContext.evaluationsCount}
- Judges: ${userContext.judges?.length || 0} (${userContext.judges?.filter((j: any) => j.is_active).length || 0} active)

${userContext.judges?.length > 0 ? `
Active Judges:
${userContext.judges.map((j: any) => `- ${j.name} (${j.model_name})`).join('\n')}
` : ''}

${userContext.verdictCounts ? `
Evaluation Results:
- Pass: ${userContext.verdictCounts.pass || 0}
- Fail: ${userContext.verdictCounts.fail || 0}
- Inconclusive: ${userContext.verdictCounts.inconclusive || 0}
${userContext.passRate ? `- Pass Rate: ${userContext.passRate}%` : ''}
` : ''}

${userContext.submissions?.length > 0 ? `
Recent Submissions (last 5):
${userContext.submissions.slice(0, 5).map((s: any) => `- ${s.queue_id} (${new Date(s.created_at).toLocaleDateString()})`).join('\n')}
` : ''}
${pageInfo}${memoryInfo}
`

  return `You are the BeSimple AI Assistant for the AI Judge System platform. You help users understand and use the platform effectively.

Platform Overview:
- AI Judge System is a platform for evaluating student submissions using AI judges (LLMs)
- Users can upload submissions with questions and answers
- They create AI judges with custom prompts and LLM models (OpenAI, Anthropic, Gemini)
- Judges evaluate submissions and return verdicts (pass/fail/inconclusive) with reasoning
- The platform includes features like:
  * Data Ingestion (upload JSON files)
  * AI Judges (create and manage judges)
  * Assignments (assign judges to questions)
  * Run Evaluations (execute evaluations)
  * Results (view evaluation results with filters)
  * Analytics (consensus analysis, cost tracking, debug mode)
  * Calibration (golden set validation)
  * Attachments (file uploads for submissions)

${contextSummary}

Your role:
- Answer questions about the user's actual data (submissions, evaluations, judges, etc.)
- Answer questions about how to use the platform
- Help users understand features and workflows
- Provide troubleshooting guidance
- Be friendly, concise, and helpful
- Use the context data above to answer questions about their specific data
- If asked about counts, statistics, or results, use the actual numbers from the context above

When answering questions:
- Use the real numbers from the context (e.g., "You have ${userContext.submissionsCount} submissions")
- Refer to specific judges by name if relevant
- Mention recent evaluation results if asked
- Keep responses brief (2-3 sentences when possible) unless the user asks for detailed explanations
- Format responses with markdown for better readability (use **bold**, lists, etc.)
- If you don't know something, admit it and suggest contacting support`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Initialize Supabase client (use service role for data access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Try to get user from auth header, but don't fail if not authenticated
    let user: any = null
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      try {
        const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          global: {
            headers: { Authorization: authHeader },
          },
        })
        const { data: { user: authUser } } = await authClient.auth.getUser()
        user = authUser
      } catch (error) {
        // Auth not available - continue without user
        console.log('No authenticated user, continuing without auth')
      }
    }

    const { message, conversation, context }: AssistantRequest = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    // Get user memory (works without user)
    const userMemory = await getUserMemory(supabase, user?.id || null)

    // Analyze intent
    const { intent, needsDetailedData, entities } = analyzeIntent(message)

    // Get relevant data (works without user)
    const userContext = await getRelevantData(supabase, user?.id || null, intent, entities, needsDetailedData)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(userContext, userMemory, context)

    // Build conversation
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-10),
      { role: 'user', content: message },
    ]

    // Use Gemini or OpenAI
    let response: string

    if (GEMINI_API_KEY) {
      try {
        const conversationText = conversation.map(m => `${m.role}: ${m.content}`).join('\n')
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nConversation:\n${conversationText}\n\nUser: ${message}\n\nAssistant:`,
                }],
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }),
          }
        )

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.'
        } else {
          throw new Error('Gemini API error')
        }
      } catch (error) {
        // Fallback to OpenAI
        if (OPENAI_API_KEY) {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: messages,
              temperature: 0.7,
              max_tokens: 1000,
            }),
          })

          if (openaiResponse.ok) {
            const data = await openaiResponse.json()
            response = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
          } else {
            throw new Error('OpenAI API error')
          }
        } else {
          throw new Error('No API keys configured')
        }
      }
    } else if (OPENAI_API_KEY) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (openaiResponse.ok) {
        const data = await openaiResponse.json()
        response = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
      } else {
        throw new Error('OpenAI API error')
      }
    } else {
      throw new Error('No API keys configured. Please set GOOGLE_AI_API_KEY or OPENAI_API_KEY in Supabase secrets.')
    }

    // Update memory (non-blocking)
    if (user?.id) {
      try {
        const commonQueries = userMemory.common_queries || []
        if (!commonQueries.includes(message)) {
          commonQueries.unshift(message)
          if (commonQueries.length > 10) commonQueries.pop()
        }

        await updateUserMemory(supabase, user.id, {
          common_queries: commonQueries,
          last_asked_about: {
            ...userMemory.last_asked_about,
            ...entities,
            timestamp: new Date().toISOString(),
          },
        })
      } catch (memoryError) {
        // Ignore memory errors
      }
    }

    return new Response(
      JSON.stringify({ response }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Assistant error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'

    return new Response(
      JSON.stringify({
        error: errorMessage,
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

