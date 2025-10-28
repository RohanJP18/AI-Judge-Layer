import { useState } from 'react'
import { Paperclip, Upload, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Label } from '@/shared/components/Label'
import { useSubmissions, useQuestionsBySubmission } from '@/features/ingestion/hooks/useIngestion'
import { FileUpload } from './FileUpload'
import { Badge } from '@/shared/components/Badge'

export function AttachmentsManager() {
  const [selectedSubmission, setSelectedSubmission] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: submissions, isLoading: submissionsLoading } = useSubmissions()
  const { data: questions, isLoading: questionsLoading } = useQuestionsBySubmission(selectedSubmission || null)

  // Filter questions by search term
  const filteredQuestions = questions?.filter((q) => {
    if (searchTerm && !q.question_text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  if (submissionsLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            <CardTitle>File Attachments</CardTitle>
          </div>
          <CardDescription>
            Upload images or PDFs to accompany evaluation questions. Vision-capable models can analyze attached images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Submission Selection */}
          <div className="space-y-2">
            <Label htmlFor="submission-select">Select Submission</Label>
            <select
              id="submission-select"
              value={selectedSubmission}
              onChange={(e) => {
                setSelectedSubmission(e.target.value)
                setSearchTerm('')
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Choose a submission...</option>
              {submissions?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.queue_id} - {sub.labeling_task_id}
                </option>
              ))}
            </select>
          </div>

          {selectedSubmission && (
            <>
              {/* Search Questions */}
              <div className="space-y-2">
                <Label htmlFor="search-questions">Search Questions</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-questions"
                    placeholder="Search by question text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {filteredQuestions?.length || 0} question(s) found
                </div>

                {filteredQuestions && filteredQuestions.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredQuestions.map((question) => (
                      <Card key={question.question_id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.question_type}
                                </Badge>
                                {question.has_attachments && (
                                  <Badge variant="default" className="text-xs">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    Has Files
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium">
                                {question.question_text}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <FileUpload
                            submissionId={selectedSubmission}
                            questionId={question.id}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? 'No questions match your search'
                      : 'No questions found for this submission'}
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedSubmission && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select a submission to manage attachments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-2">💡 Tips for File Attachments</h3>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Upload screenshots, diagrams, or PDFs relevant to the question</li>
            <li>Vision-capable models (GPT-4 Vision, Claude 3, Gemini Pro Vision) can analyze images</li>
            <li>Attachments are securely stored and only accessed during evaluations</li>
            <li>Maximum file size: 10MB per file</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

