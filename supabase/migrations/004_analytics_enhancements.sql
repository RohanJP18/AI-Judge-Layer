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

