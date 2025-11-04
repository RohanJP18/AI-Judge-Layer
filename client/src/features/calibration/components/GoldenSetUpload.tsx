import { useState, useRef } from 'react'
import { Upload, FileJson, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { useGoldenQuestions, useUploadGoldenSet, useDeleteGoldenQuestion } from '../hooks/useCalibration'
import { toast } from '@/shared/hooks/useToast'
import type { GoldenQuestionInput } from '../api'

export function GoldenSetUpload() {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: goldenQuestions, isLoading } = useGoldenQuestions()
  const uploadMutation = useUploadGoldenSet()
  const deleteMutation = useDeleteGoldenQuestion()

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JSON file (.json)',
        variant: 'destructive',
      })
      return
    }

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      if (!Array.isArray(json)) {
        throw new Error('JSON must contain an array of golden questions')
      }

      // Validate structure
      const validated: GoldenQuestionInput[] = json.map((q: any) => {
        if (!q.question_id || !q.question_text || !q.ground_truth_verdict || !q.ground_truth_reasoning) {
          throw new Error('Each question must have: question_id, question_text, ground_truth_verdict, ground_truth_reasoning')
        }
        return {
          question_id: q.question_id,
          question_text: q.question_text,
          question_type: q.question_type || 'general',
          student_answer_choice: q.student_answer_choice,
          student_answer_reasoning: q.student_answer_reasoning,
          ground_truth_verdict: q.ground_truth_verdict,
          ground_truth_reasoning: q.ground_truth_reasoning,
        }
      })

      uploadMutation.mutate(validated)
    } catch (error) {
      toast({
        title: 'Invalid format',
        description: error instanceof Error ? error.message : 'Please check your JSON file',
        variant: 'destructive',
      })
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'pass': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'fail': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'inconclusive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Golden Set</CardTitle>
          <CardDescription>
            Pre-evaluated questions with known correct verdicts for judge calibration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleChange}
            className="hidden"
          />

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileJson className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop JSON file here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Upload a JSON file with pre-evaluated questions
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 JSON Format Example
            </h4>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`[
  {
    "question_id": "q1",
    "question_text": "What is 2+2?",
    "question_type": "math",
    "student_answer_choice": "4",
    "student_answer_reasoning": "Simple addition",
    "ground_truth_verdict": "pass",
    "ground_truth_reasoning": "Correct answer"
  }
]`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Current Golden Set */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Golden Set</CardTitle>
              <CardDescription>
                {goldenQuestions?.length || 0} question(s) in golden set
              </CardDescription>
            </div>
            {goldenQuestions && goldenQuestions.length > 0 && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {goldenQuestions.length} questions
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : goldenQuestions && goldenQuestions.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {goldenQuestions.map((q) => (
                <div key={q.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                        <Badge className={getVerdictColor(q.ground_truth_verdict) + ' text-xs'}>
                          {q.ground_truth_verdict}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{q.question_text}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ground Truth: {q.ground_truth_reasoning}
                      </p>
                      {q.student_answer_choice && (
                        <p className="text-xs text-muted-foreground">
                          Student Answer: {q.student_answer_choice}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(q.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No golden set questions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload a JSON file to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


