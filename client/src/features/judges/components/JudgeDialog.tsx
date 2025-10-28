import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/Dialog'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Textarea } from '@/shared/components/Textarea'
import { Label } from '@/shared/components/Label'
import { Checkbox } from '@/shared/components/Checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/Select'
import { useCreateJudge, useUpdateJudge } from '../hooks/useJudges'
import type { Judge, JudgeCreate } from '@/shared/types/schemas'

interface JudgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  judge: Judge | null // null = create mode
}

const MODEL_OPTIONS = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Anthropic)' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Anthropic)' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Anthropic)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google)' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite (Google)' },
]

export function JudgeDialog({ open, onOpenChange, judge }: JudgeDialogProps) {
  const [formData, setFormData] = useState<JudgeCreate & {
    include_question_text?: boolean
    include_student_answer?: boolean
    include_model_answer?: boolean
    include_marks?: boolean
    include_question_id?: boolean
    include_question_type?: boolean
  }>({
    name: '',
    system_prompt: '',
    model_name: 'gemini-2.0-flash-lite',
    is_active: true,
    include_question_text: true,
    include_student_answer: true,
    include_model_answer: true,
    include_marks: false,
    include_question_id: false,
    include_question_type: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useCreateJudge()
  const updateMutation = useUpdateJudge()

  useEffect(() => {
    if (judge) {
      setFormData({
        name: judge.name,
        system_prompt: judge.system_prompt,
        model_name: judge.model_name,
        is_active: judge.is_active,
        include_question_text: judge.include_question_text ?? true,
        include_student_answer: judge.include_student_answer ?? true,
        include_model_answer: judge.include_model_answer ?? true,
        include_marks: judge.include_marks ?? false,
        include_question_id: judge.include_question_id ?? false,
        include_question_type: judge.include_question_type ?? false,
      })
    } else {
      setFormData({
        name: '',
        system_prompt: '',
        model_name: 'gemini-2.0-flash-lite',
        is_active: true,
        include_question_text: true,
        include_student_answer: true,
        include_model_answer: true,
        include_marks: false,
        include_question_id: false,
        include_question_type: false,
      })
    }
    setErrors({})
  }, [judge, open])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.system_prompt.trim()) {
      newErrors.system_prompt = 'System prompt is required'
    } else if (formData.system_prompt.length < 10) {
      newErrors.system_prompt = 'System prompt must be at least 10 characters'
    }

    if (!formData.model_name) {
      newErrors.model_name = 'Model is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    if (judge) {
      // Update existing judge
      updateMutation.mutate(
        { id: judge.id, updates: formData },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
    } else {
      // Create new judge
      createMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false)
        },
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {judge ? 'Edit Judge' : 'Create New Judge'}
            </DialogTitle>
            <DialogDescription>
              {judge
                ? 'Update the judge configuration below.'
                : 'Configure a new AI judge to evaluate submissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Safety Checker"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.model_name}
                onValueChange={(value) =>
                  setFormData({ ...formData, model_name: value })
                }
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.model_name && (
                <p className="text-sm text-destructive">{errors.model_name}</p>
              )}
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">
                System Prompt / Rubric <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prompt"
                value={formData.system_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, system_prompt: e.target.value })
                }
                placeholder="You are an AI judge evaluating submissions. Respond with:&#10;- verdict: 'pass', 'fail', or 'inconclusive'&#10;- reasoning: brief explanation&#10;&#10;Evaluate based on..."
                rows={8}
                className={errors.system_prompt ? 'border-destructive' : ''}
              />
              {errors.system_prompt && (
                <p className="text-sm text-destructive">{errors.system_prompt}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Define clear evaluation criteria and expected output format.
              </p>
            </div>

            {/* Prompt Configuration */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Prompt Configuration</Label>
              <p className="text-xs text-muted-foreground">
                Select which fields to include in the LLM prompt during evaluation
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_question_text"
                    checked={formData.include_question_text}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_question_text: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_question_text"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Question Text
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_student_answer"
                    checked={formData.include_student_answer}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_student_answer: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_student_answer"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Student Answer
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_model_answer"
                    checked={formData.include_model_answer}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_model_answer: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_model_answer"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Model Answer
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_marks"
                    checked={formData.include_marks}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_marks: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_marks"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Marks/Points
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_question_id"
                    checked={formData.include_question_id}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_question_id: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_question_id"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Question ID
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_question_type"
                    checked={formData.include_question_type}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_question_type: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="include_question_type"
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    Question Type
                  </Label>
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2 border-t pt-4">
              <Checkbox
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label
                htmlFor="active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Active (available for assignment and evaluation)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {judge ? 'Update Judge' : 'Create Judge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

