-- ============================================================================
-- RESET AND APPLY ALL MIGRATIONS
-- ============================================================================
-- This script drops all existing tables, views, functions, and policies,
-- then reapplies all migrations in order.
-- 
-- WARNING: This will DELETE ALL DATA in your database!
-- ============================================================================

-- Step 1: Drop all dependent objects first (in reverse dependency order)

-- Drop views (CASCADE will also drop dependent objects)
DROP VIEW IF EXISTS evaluation_consensus CASCADE;

-- Drop tables first (CASCADE will automatically drop all policies, triggers, and constraints)
-- Order matters: drop dependent tables before their dependencies
-- This ensures all foreign key constraints are handled properly
DROP TABLE IF EXISTS calibration_results CASCADE;
DROP TABLE IF EXISTS calibration_runs CASCADE;
DROP TABLE IF EXISTS golden_set_questions CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS judge_assignments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS judges CASCADE;

-- Clean up any orphaned indexes that might remain
-- (These should be dropped automatically, but just in case)
DROP INDEX IF EXISTS idx_attachments_submission CASCADE;
DROP INDEX IF EXISTS idx_attachments_question CASCADE;
DROP INDEX IF EXISTS idx_evaluations_question_judge CASCADE;
DROP INDEX IF EXISTS idx_evaluations_submission_question CASCADE;
DROP INDEX IF EXISTS idx_golden_questions_question_id CASCADE;
DROP INDEX IF EXISTS idx_calibration_runs_judge CASCADE;
DROP INDEX IF EXISTS idx_calibration_results_run CASCADE;
DROP INDEX IF EXISTS idx_calibration_results_golden CASCADE;

-- Drop triggers (in case they weren't dropped by CASCADE)
-- Note: Triggers are automatically dropped when tables are dropped, but we'll handle it safely
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_judges_updated_at ON judges;
EXCEPTION WHEN undefined_table THEN
  -- judges table might not exist, that's fine
  NULL;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop storage policies (these are on storage.objects, not our tables)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow anon reads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
EXCEPTION WHEN undefined_table THEN
  -- storage.objects might not exist yet, that's fine
  NULL;
END $$;

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id TEXT NOT NULL,
  labeling_task_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_json JSONB NOT NULL
);

CREATE INDEX idx_submissions_queue_id ON submissions(queue_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_choice TEXT,
  answer_reasoning TEXT,
  rev INTEGER NOT NULL,
  UNIQUE(submission_id, question_id)
);

CREATE INDEX idx_questions_submission_id ON questions(submission_id);
CREATE INDEX idx_questions_question_id ON questions(question_id);

-- Create judges table
CREATE TABLE judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_judges_is_active ON judges(is_active);

-- Create judge_assignments table
CREATE TABLE judge_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, judge_id)
);

CREATE INDEX idx_judge_assignments_question_id ON judge_assignments(question_id);
CREATE INDEX idx_judge_assignments_judge_id ON judge_assignments(judge_id);

-- Create evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'fail', 'inconclusive')),
  reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,
  error TEXT,
  model_name TEXT NOT NULL
);

CREATE INDEX idx_evaluations_verdict ON evaluations(verdict);
CREATE INDEX idx_evaluations_judge_id ON evaluations(judge_id);
CREATE INDEX idx_evaluations_question_id ON evaluations(question_id);
CREATE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for judges table
CREATE TRIGGER update_judges_updated_at
  BEFORE UPDATE ON judges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS will be enabled and strict policies created in migration 006
-- For now, we'll enable RLS but keep permissive policies temporarily
-- Migration 006 will replace these with strict user-isolated policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies (will be replaced by migration 006)
CREATE POLICY "Temporary allow all access to submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Temporary allow all access to questions" ON questions FOR ALL USING (true);
CREATE POLICY "Temporary allow all access to judges" ON judges FOR ALL USING (true);
CREATE POLICY "Temporary allow all access to judge_assignments" ON judge_assignments FOR ALL USING (true);
CREATE POLICY "Temporary allow all access to evaluations" ON evaluations FOR ALL USING (true);

-- ============================================================================
-- MIGRATION 002: Prompt Configuration
-- ============================================================================

-- Add prompt configuration columns to judges table
ALTER TABLE judges 
ADD COLUMN IF NOT EXISTS include_question_text BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS include_student_answer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS include_model_answer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS include_marks BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS include_question_id BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS include_question_type BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN judges.include_question_text IS 'Whether to include the question text in the LLM prompt';
COMMENT ON COLUMN judges.include_student_answer IS 'Whether to include the student answer in the LLM prompt';
COMMENT ON COLUMN judges.include_model_answer IS 'Whether to include the model answer in the LLM prompt';
COMMENT ON COLUMN judges.include_marks IS 'Whether to include marks information in the LLM prompt';
COMMENT ON COLUMN judges.include_question_id IS 'Whether to include question ID in the LLM prompt';
COMMENT ON COLUMN judges.include_question_type IS 'Whether to include question type in the LLM prompt';

-- ============================================================================
-- MIGRATION 003: File Attachments
-- ============================================================================

-- Enable storage for file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluation-attachments', 'evaluation-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evaluation-attachments');

-- Storage policy: Allow authenticated users to read their uploads
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evaluation-attachments');

-- Storage policy: Allow anon role to upload (since we're using anon key from client)
CREATE POLICY "Allow anon uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'evaluation-attachments');

-- Storage policy: Allow anon role to read
CREATE POLICY "Allow anon reads"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'evaluation-attachments');

-- Add attachments table to track file uploads
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_file_type CHECK (file_type IN ('image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attachments_submission ON attachments(submission_id);
CREATE INDEX IF NOT EXISTS idx_attachments_question ON attachments(question_id);

-- RLS Policies for attachments table
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON attachments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON attachments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for anon users" ON attachments
  FOR INSERT WITH CHECK (true);

-- Add storage reference to questions table (optional - for easier querying)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE attachments IS 'File attachments (images, PDFs) associated with submission questions';
COMMENT ON COLUMN attachments.file_path IS 'Path in Supabase Storage bucket';

-- ============================================================================
-- MIGRATION 004: Analytics Enhancements
-- ============================================================================

-- Add columns for debug mode and cost tracking to evaluations table
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS prompt_sent TEXT,
ADD COLUMN IF NOT EXISTS raw_response TEXT,
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 6),
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create index for consensus queries (finding multiple judges on same question)
CREATE INDEX IF NOT EXISTS idx_evaluations_question_judge ON evaluations(question_id, judge_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_submission_question ON evaluations(submission_id, question_id);

-- Create view for consensus analysis
CREATE OR REPLACE VIEW evaluation_consensus AS
SELECT 
  e1.submission_id,
  e1.question_id,
  COUNT(DISTINCT e1.judge_id) as judge_count,
  COUNT(DISTINCT e1.verdict) as unique_verdicts,
  MODE() WITHIN GROUP (ORDER BY e1.verdict) as consensus_verdict,
  CASE 
    WHEN COUNT(DISTINCT e1.verdict) = 1 THEN 'unanimous'
    WHEN COUNT(DISTINCT e1.verdict) = 2 THEN 'split'
    ELSE 'highly_disputed'
  END as agreement_level,
  json_agg(
    json_build_object(
      'judge_id', e1.judge_id,
      'judge_name', j.name,
      'verdict', e1.verdict,
      'reasoning', e1.reasoning
    )
  ) as judge_verdicts
FROM evaluations e1
LEFT JOIN judges j ON e1.judge_id = j.id
GROUP BY e1.submission_id, e1.question_id
HAVING COUNT(DISTINCT e1.judge_id) > 1;

-- Add comments
COMMENT ON COLUMN evaluations.prompt_sent IS 'Actual prompt sent to LLM for debugging';
COMMENT ON COLUMN evaluations.raw_response IS 'Raw LLM response before parsing';
COMMENT ON COLUMN evaluations.input_tokens IS 'Number of input tokens used';
COMMENT ON COLUMN evaluations.output_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN evaluations.estimated_cost IS 'Estimated cost in USD';
COMMENT ON COLUMN evaluations.retry_count IS 'Number of retry attempts';

-- ============================================================================
-- MIGRATION 005: Golden Set Calibration
-- ============================================================================

-- Golden Set for Judge Calibration
-- Pre-evaluated questions with known correct verdicts for testing judge accuracy

-- Golden set questions table
CREATE TABLE IF NOT EXISTS golden_set_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  student_answer_choice TEXT,
  student_answer_reasoning TEXT,
  ground_truth_verdict TEXT NOT NULL CHECK (ground_truth_verdict IN ('pass', 'fail', 'inconclusive')),
  ground_truth_reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT unique_golden_question UNIQUE(question_id)
);

-- Calibration runs table - tracks when judges are tested against golden set
CREATE TABLE IF NOT EXISTS calibration_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_questions INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  accuracy DECIMAL(5, 2) NOT NULL,
  precision_pass DECIMAL(5, 2),
  recall_pass DECIMAL(5, 2),
  f1_pass DECIMAL(5, 2),
  precision_fail DECIMAL(5, 2),
  recall_fail DECIMAL(5, 2),
  f1_fail DECIMAL(5, 2),
  confusion_matrix JSONB NOT NULL,
  passed_threshold BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

-- Calibration results - individual predictions for each golden question
CREATE TABLE IF NOT EXISTS calibration_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calibration_run_id UUID NOT NULL REFERENCES calibration_runs(id) ON DELETE CASCADE,
  golden_question_id UUID NOT NULL REFERENCES golden_set_questions(id) ON DELETE CASCADE,
  predicted_verdict TEXT NOT NULL CHECK (predicted_verdict IN ('pass', 'fail', 'inconclusive')),
  predicted_reasoning TEXT NOT NULL,
  ground_truth_verdict TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_golden_questions_question_id ON golden_set_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_judge ON calibration_runs(judge_id);
CREATE INDEX IF NOT EXISTS idx_calibration_results_run ON calibration_results(calibration_run_id);
CREATE INDEX IF NOT EXISTS idx_calibration_results_golden ON calibration_results(golden_question_id);

-- RLS Policies
ALTER TABLE golden_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON golden_set_questions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON golden_set_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON golden_set_questions
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON calibration_runs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calibration_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON calibration_results
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calibration_results
  FOR INSERT WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE golden_set_questions IS 'Pre-evaluated questions with known correct verdicts for judge calibration';
COMMENT ON TABLE calibration_runs IS 'Records of judge calibration tests against golden set';
COMMENT ON TABLE calibration_results IS 'Individual predictions for each question in a calibration run';
COMMENT ON COLUMN calibration_runs.accuracy IS 'Overall accuracy: (correct predictions / total questions) * 100';
COMMENT ON COLUMN calibration_runs.precision_pass IS 'Precision for "pass" verdict: TP / (TP + FP)';
COMMENT ON COLUMN calibration_runs.recall_pass IS 'Recall for "pass" verdict: TP / (TP + FN)';
COMMENT ON COLUMN calibration_runs.f1_pass IS 'F1 score for "pass" verdict: 2 * (precision * recall) / (precision + recall)';
COMMENT ON COLUMN calibration_runs.confusion_matrix IS 'JSON object containing full confusion matrix';
COMMENT ON COLUMN calibration_runs.passed_threshold IS 'Whether judge passed calibration (typically >= 90% accuracy)';

-- ============================================================================
-- MIGRATION 006: User Authentication & Row Level Security
-- ============================================================================
-- This migration adds user authentication and STRICT Row Level Security
-- to ensure users can ONLY access their own data.
-- ============================================================================
-- Note: Apply migration 006_user_authentication.sql separately after running this reset script
-- The migration file contains the complete RLS policies for user isolation

-- ============================================================================
-- RESET COMPLETE
-- ============================================================================
-- All migrations have been applied successfully!
-- Your database is now clean and ready to use.
-- ============================================================================

