// Database types - will be auto-generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          queue_id: string
          labeling_task_id: string
          created_at: string
          raw_json: unknown
        }
        Insert: {
          id?: string
          queue_id: string
          labeling_task_id: string
          created_at?: string
          raw_json: unknown
        }
        Update: {
          id?: string
          queue_id?: string
          labeling_task_id?: string
          created_at?: string
          raw_json?: unknown
        }
      }
      questions: {
        Row: {
          id: string
          submission_id: string
          question_id: string
          question_type: string
          question_text: string
          answer_choice: string | null
          answer_reasoning: string | null
          rev: number
          has_attachments: boolean
        }
        Insert: {
          id?: string
          submission_id: string
          question_id: string
          question_type: string
          question_text: string
          answer_choice?: string | null
          answer_reasoning?: string | null
          rev: number
          has_attachments?: boolean
        }
        Update: {
          id?: string
          submission_id?: string
          question_id?: string
          question_type?: string
          question_text?: string
          answer_choice?: string | null
          answer_reasoning?: string | null
          rev?: number
          has_attachments?: boolean
        }
      }
      attachments: {
        Row: {
          id: string
          submission_id: string
          question_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          question_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          question_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
      }
      judges: {
        Row: {
          id: string
          name: string
          system_prompt: string
          model_name: string
          is_active: boolean
          created_at: string
          updated_at: string
          include_question_text: boolean
          include_student_answer: boolean
          include_model_answer: boolean
          include_marks: boolean
          include_question_id: boolean
          include_question_type: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          system_prompt: string
          model_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          include_question_text?: boolean
          include_student_answer?: boolean
          include_model_answer?: boolean
          include_marks?: boolean
          include_question_id?: boolean
          include_question_type?: boolean
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          system_prompt?: string
          model_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          include_question_text?: boolean
          include_student_answer?: boolean
          include_model_answer?: boolean
          include_marks?: boolean
          include_question_id?: boolean
          include_question_type?: boolean
          user_id?: string | null
        }
      }
      judge_assignments: {
        Row: {
          id: string
          question_id: string
          judge_id: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          judge_id: string
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          judge_id?: string
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          submission_id: string
          question_id: string
          judge_id: string | null
          verdict: 'pass' | 'fail' | 'inconclusive'
          reasoning: string
          created_at: string
          duration_ms: number | null
          error: string | null
          model_name: string
          prompt_sent: string | null
          raw_response: string | null
          input_tokens: number | null
          output_tokens: number | null
          estimated_cost: number | null
          retry_count: number
        }
        Insert: {
          id?: string
          submission_id: string
          question_id: string
          judge_id?: string | null
          verdict: 'pass' | 'fail' | 'inconclusive'
          reasoning: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          model_name: string
          prompt_sent?: string | null
          raw_response?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          estimated_cost?: number | null
          retry_count?: number
        }
        Update: {
          id?: string
          submission_id?: string
          question_id?: string
          judge_id?: string | null
          verdict?: 'pass' | 'fail' | 'inconclusive'
          reasoning?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          model_name?: string
          prompt_sent?: string | null
          raw_response?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          estimated_cost?: number | null
          retry_count?: number
        }
      }
      golden_set_questions: {
        Row: {
          id: string
          question_id: string
          question_text: string
          question_type: string
          student_answer_choice: string | null
          student_answer_reasoning: string | null
          ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
          ground_truth_reasoning: string
          created_at: string
          metadata: unknown
        }
        Insert: {
          id?: string
          question_id: string
          question_text: string
          question_type: string
          student_answer_choice?: string | null
          student_answer_reasoning?: string | null
          ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
          ground_truth_reasoning: string
          created_at?: string
          metadata?: unknown
        }
        Update: {
          id?: string
          question_id?: string
          question_text?: string
          question_type?: string
          student_answer_choice?: string | null
          student_answer_reasoning?: string | null
          ground_truth_verdict?: 'pass' | 'fail' | 'inconclusive'
          ground_truth_reasoning?: string
          created_at?: string
          metadata?: unknown
        }
      }
      calibration_runs: {
        Row: {
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
          confusion_matrix: unknown
          passed_threshold: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          judge_id: string
          judge_name: string
          model_name: string
          created_at?: string
          total_questions: number
          correct_predictions: number
          accuracy: number
          precision_pass?: number | null
          recall_pass?: number | null
          f1_pass?: number | null
          precision_fail?: number | null
          recall_fail?: number | null
          f1_fail?: number | null
          confusion_matrix: unknown
          passed_threshold?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          judge_id?: string
          judge_name?: string
          model_name?: string
          created_at?: string
          total_questions?: number
          correct_predictions?: number
          accuracy?: number
          precision_pass?: number | null
          recall_pass?: number | null
          f1_pass?: number | null
          precision_fail?: number | null
          recall_fail?: number | null
          f1_fail?: number | null
          confusion_matrix?: unknown
          passed_threshold?: boolean
          notes?: string | null
        }
      }
      calibration_results: {
        Row: {
          id: string
          calibration_run_id: string
          golden_question_id: string
          predicted_verdict: 'pass' | 'fail' | 'inconclusive'
          predicted_reasoning: string
          ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          calibration_run_id: string
          golden_question_id: string
          predicted_verdict: 'pass' | 'fail' | 'inconclusive'
          predicted_reasoning: string
          ground_truth_verdict: 'pass' | 'fail' | 'inconclusive'
          is_correct: boolean
          created_at?: string
        }
        Update: {
          id?: string
          calibration_run_id?: string
          golden_question_id?: string
          predicted_verdict?: 'pass' | 'fail' | 'inconclusive'
          predicted_reasoning?: string
          ground_truth_verdict?: 'pass' | 'fail' | 'inconclusive'
          is_correct?: boolean
          created_at?: string
        }
      }
    }
  }
}

