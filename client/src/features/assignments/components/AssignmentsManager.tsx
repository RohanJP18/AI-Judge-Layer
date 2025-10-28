import { useState, useEffect } from 'react'
import { Save, Loader2, UserCheck } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Checkbox } from '@/shared/components/Checkbox'
import { Label } from '@/shared/components/Label'
import { Badge } from '@/shared/components/Badge'
import { useQuestionTemplates } from '@/features/ingestion/hooks/useIngestion'
import { useActiveJudges } from '@/features/judges/hooks/useJudges'
import { useJudgeAssignments, useAssignJudges } from '../hooks/useAssignments'
import { toast } from '@/shared/hooks/useToast'

export function AssignmentsManager() {
  const { data: questionTemplates, isLoading: isLoadingQuestions } = useQuestionTemplates()
  const { data: activeJudges, isLoading: isLoadingJudges } = useActiveJudges()
  const { data: existingAssignments, isLoading: isLoadingAssignments } = useJudgeAssignments()
  const assignMutation = useAssignJudges()

  // Local state: Map<questionId, Set<judgeId>>
  const [assignments, setAssignments] = useState<Map<string, Set<string>>>(new Map())

  // Initialize assignments from existing data
  useEffect(() => {
    if (existingAssignments && questionTemplates) {
      const assignmentMap = new Map<string, Set<string>>()

      // Initialize with empty sets for all questions
      questionTemplates.forEach((q) => {
        assignmentMap.set(q.question_id, new Set())
      })

      // Populate with existing assignments
      existingAssignments.forEach((assignment) => {
        const existing = assignmentMap.get(assignment.question_id)
        if (existing) {
          existing.add(assignment.judge_id)
        } else {
          assignmentMap.set(assignment.question_id, new Set([assignment.judge_id]))
        }
      })

      setAssignments(assignmentMap)
    }
  }, [existingAssignments, questionTemplates])

  const toggleAssignment = (questionId: string, judgeId: string) => {
    setAssignments((prev) => {
      const newMap = new Map(prev)
      const judgeSet = newMap.get(questionId) || new Set()
      const newSet = new Set(judgeSet)

      if (newSet.has(judgeId)) {
        newSet.delete(judgeId)
      } else {
        newSet.add(judgeId)
      }

      newMap.set(questionId, newSet)
      return newMap
    })
  }

  const handleSave = (questionId: string) => {
    const judgeIds = Array.from(assignments.get(questionId) || [])
    assignMutation.mutate({ questionId, judgeIds })
  }

  const handleSaveAll = () => {
    if (!questionTemplates) return

    let successCount = 0
    let totalCount = questionTemplates.length

    questionTemplates.forEach((question, index) => {
      const judgeIds = Array.from(assignments.get(question.question_id) || [])

      assignMutation.mutate(
        { questionId: question.question_id, judgeIds },
        {
          onSuccess: () => {
            successCount++
            if (successCount === totalCount) {
              toast({
                title: 'All assignments saved',
                description: `Successfully updated assignments for all ${totalCount} question(s).`,
              })
            }
          },
        }
      )
    })
  }

  const isLoading = isLoadingQuestions || isLoadingJudges || isLoadingAssignments

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!questionTemplates || questionTemplates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold mb-1">No questions available</p>
          <p className="text-sm text-muted-foreground">
            Please import submissions first to assign judges
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!activeJudges || activeJudges.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold mb-1">No active judges available</p>
          <p className="text-sm text-muted-foreground">
            Please create and activate judges before assigning them
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Judge Assignments</CardTitle>
              <CardDescription>
                Assign AI judges to evaluate specific questions
              </CardDescription>
            </div>
            <Button onClick={handleSaveAll} disabled={assignMutation.isPending}>
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save All Assignments
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {questionTemplates.map((question) => {
          const selectedJudges = assignments.get(question.question_id) || new Set()

          return (
            <Card key={question.question_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {question.question_text}
                      </CardTitle>
                      <Badge variant="outline">{question.question_type}</Badge>
                    </div>
                    <CardDescription>
                      Question ID: {question.question_id} •{' '}
                      {selectedJudges.size} judge(s) assigned
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(question.question_id)}
                    disabled={assignMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeJudges.map((judge) => {
                    const isSelected = selectedJudges.has(judge.id)

                    return (
                      <div
                        key={judge.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${
                          isSelected ? 'bg-accent border-primary' : 'bg-card'
                        }`}
                        onClick={() =>
                          toggleAssignment(question.question_id, judge.id)
                        }
                      >
                        <Checkbox
                          id={`${question.question_id}-${judge.id}`}
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleAssignment(question.question_id, judge.id)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`${question.question_id}-${judge.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {judge.name}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {judge.system_prompt}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {judge.model_name}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

