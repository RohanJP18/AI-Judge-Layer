import { z } from 'zod'

// Input JSON schemas
export const QuestionDataSchema = z.object({
  id: z.string(),
  questionType: z.string(),
  questionText: z.string(),
})

export const QuestionSchema = z.object({
  rev: z.number(),
  data: QuestionDataSchema,
})

export const AnswerSchema = z.object({
  choice: z.string().optional(),
  reasoning: z.string().optional(),
})

export const SubmissionInputSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  labelingTaskId: z.string(),
  createdAt: z.number(),
  questions: z.array(QuestionSchema),
  answers: z.record(z.string(), AnswerSchema),
})

export const SubmissionsFileSchema = z.array(SubmissionInputSchema)

// Database entity schemas
export const JudgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  system_prompt: z.string().min(10, "System prompt must be at least 10 characters"),
  model_name: z.string().min(1, "Model name is required"),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const JudgeCreateSchema = JudgeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const JudgeUpdateSchema = JudgeCreateSchema.partial()

export const VerdictSchema = z.enum(['pass', 'fail', 'inconclusive'])

export const EvaluationSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  question_id: z.string().uuid(),
  judge_id: z.string().uuid().nullable(),
  verdict: VerdictSchema,
  reasoning: z.string(),
  created_at: z.string(),
  duration_ms: z.number().nullable(),
  error: z.string().nullable(),
  model_name: z.string(),
})

// LLM Response schema
export const LLMResponseSchema = z.object({
  verdict: VerdictSchema,
  reasoning: z.string(),
})

// Type exports
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>
export type QuestionData = z.infer<typeof QuestionDataSchema>
export type Question = z.infer<typeof QuestionSchema>
export type Answer = z.infer<typeof AnswerSchema>
export type Judge = z.infer<typeof JudgeSchema>
export type JudgeCreate = z.infer<typeof JudgeCreateSchema>
export type JudgeUpdate = z.infer<typeof JudgeUpdateSchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type Evaluation = z.infer<typeof EvaluationSchema>
export type LLMResponse = z.infer<typeof LLMResponseSchema>

