import { useState } from 'react'
import { Plus, Edit2, Trash2, Power, PowerOff, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { useJudges, useUpdateJudge, useDeleteJudge } from '../hooks/useJudges'
import { JudgeDialog } from './JudgeDialog'
import type { Judge } from '@/shared/types/schemas'

export function JudgesList() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null)

  const { data: judges, isLoading } = useJudges()
  const updateMutation = useUpdateJudge()
  const deleteMutation = useDeleteJudge()

  const handleCreate = () => {
    setSelectedJudge(null)
    setDialogOpen(true)
  }

  const handleEdit = (judge: Judge) => {
    setSelectedJudge(judge)
    setDialogOpen(true)
  }

  const handleToggleActive = (judge: Judge) => {
    updateMutation.mutate({
      id: judge.id,
      updates: { is_active: !judge.is_active },
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this judge? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('gpt')) return 'default'
    if (modelName.includes('claude')) return 'secondary'
    if (modelName.includes('gemini')) return 'outline'
    return 'default'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Judges</CardTitle>
              <CardDescription>
                {judges?.length || 0} judge(s) configured •{' '}
                {judges?.filter((j) => j.is_active).length || 0} active
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Judge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {judges && judges.length > 0 ? (
            <div className="space-y-4">
              {judges.map((judge) => (
                <div
                  key={judge.id}
                  className={`border rounded-lg p-4 transition-all ${
                    judge.is_active
                      ? 'bg-card hover:shadow-md'
                      : 'bg-muted/30 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{judge.name}</h3>
                        <Badge variant={judge.is_active ? 'success' : 'secondary'}>
                          {judge.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={getModelBadgeColor(judge.model_name)}>
                          {judge.model_name}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {judge.system_prompt}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Created {new Date(judge.created_at || '').toLocaleDateString()}
                        {judge.updated_at !== judge.created_at &&
                          ` • Updated ${new Date(judge.updated_at || '').toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleActive(judge)}
                        disabled={updateMutation.isPending}
                        title={judge.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {judge.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(judge)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(judge.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-1">No judges configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first AI judge to start evaluating submissions
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Judge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <JudgeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        judge={selectedJudge}
      />
    </>
  )
}

