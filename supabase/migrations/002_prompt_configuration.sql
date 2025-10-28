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

