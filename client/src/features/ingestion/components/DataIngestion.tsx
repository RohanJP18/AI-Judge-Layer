import { useState, useRef } from 'react'
import { Upload, FileJson, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { SubmissionsFileSchema, type SubmissionInput } from '@/shared/types/schemas'
import { useIngestSubmissions, useSubmissions } from '../hooks/useIngestion'
import { toast } from '@/shared/hooks/useToast'

export function DataIngestion() {
  const [dragActive, setDragActive] = useState(false)
  const [validatedData, setValidatedData] = useState<SubmissionInput[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ingestMutation = useIngestSubmissions()
  const { data: submissions, isLoading: isLoadingSubmissions } = useSubmissions()

  const handleFile = async (file: File) => {
    // Edge case: File extension check
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JSON file (.json extension required).',
        variant: 'destructive',
      })
      return
    }

    // Edge case: File size check (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 50MB. Please upload a smaller file.`,
        variant: 'destructive',
      })
      return
    }

    // Edge case: Empty file
    if (file.size === 0) {
      toast({
        title: 'Empty file',
        description: 'The uploaded file is empty. Please upload a valid JSON file.',
        variant: 'destructive',
      })
      return
    }

    try {
      const text = await file.text()

      // Edge case: Empty content
      if (!text || text.trim().length === 0) {
        throw new Error('File content is empty')
      }

      // Edge case: JSON parsing with better error message
      let json
      try {
        json = JSON.parse(text)
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unable to parse JSON'}`)
      }

      // Edge case: Check if it's an array
      if (!Array.isArray(json)) {
        throw new Error('JSON must contain an array of submissions')
      }

      // Edge case: Empty array
      if (json.length === 0) {
        throw new Error('JSON array is empty. Please include at least one submission.')
      }

      // Validate with Zod
      const validated = SubmissionsFileSchema.parse(json)
      setValidatedData(validated)

      toast({
        title: 'File validated successfully',
        description: `Found ${validated.length} submission(s) ready to import.`,
      })
    } catch (error) {
      console.error('Validation error:', error)
      
      // Provide specific error message
      let errorMessage = 'Please check your JSON file format.'
      if (error instanceof Error) {
        errorMessage = error.message
        // Make Zod errors more readable
        if (errorMessage.includes('Expected')) {
          errorMessage = 'Invalid data structure. ' + errorMessage.split('\n')[0]
        }
      }
      
      toast({
        title: 'Invalid file format',
        description: errorMessage,
        variant: 'destructive',
      })
      setValidatedData(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleIngest = () => {
    if (validatedData) {
      ingestMutation.mutate(validatedData, {
        onSuccess: () => {
          setValidatedData(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion</CardTitle>
          <CardDescription>
            Upload a JSON file containing submissions with questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              <div>
                <p className="text-lg font-semibold mb-1">
                  Drop your JSON file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports submission files with questions and answers
                </p>
              </div>

              <Button onClick={handleButtonClick} variant="outline">
                <FileJson className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </div>
          </div>

          {validatedData && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    File validated successfully
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {validatedData.length} submission(s) ready to import with{' '}
                    {validatedData.reduce((acc, s) => acc + s.questions.length, 0)} question(s) total
                  </p>
                </div>
                <Button
                  onClick={handleIngest}
                  disabled={ingestMutation.isPending}
                  size="sm"
                >
                  {ingestMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Import Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Imported Submissions</CardTitle>
          <CardDescription>
            {isLoadingSubmissions
              ? 'Loading...'
              : `${submissions?.length || 0} submission(s) in database`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-2">
              {submissions.slice(0, 10).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{submission.id}</p>
                    <p className="text-xs text-muted-foreground">
                      Queue: {submission.queue_id} • {submission.questions.length} question(s)
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {submissions.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ... and {submissions.length - 10} more
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-1">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Upload a JSON file to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

