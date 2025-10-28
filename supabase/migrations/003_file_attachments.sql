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

