import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { useToast } from '@/shared/hooks/useToast'
import { supabase } from '@/api/supabase'

export function ExportResults() {
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const exportToCSV = async () => {
    setExporting(true)
    try {
      // Fetch all evaluations with related data
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          submissions:submissions(queue_id, labeling_task_id),
          questions:questions(question_id, question_text, question_type, answer_choice, answer_reasoning),
          judges:judges(name, model_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Build CSV
      const headers = [
        'Evaluation ID',
        'Timestamp',
        'Queue ID',
        'Task ID',
        'Question ID',
        'Question Text',
        'Question Type',
        'Student Answer Choice',
        'Student Reasoning',
        'Judge Name',
        'Model',
        'Verdict',
        'Reasoning',
        'Duration (ms)',
        'Error',
      ]

      const rows = evaluations?.map((ev: any) => [
        ev.id,
        new Date(ev.created_at).toISOString(),
        ev.submissions?.queue_id || '',
        ev.submissions?.labeling_task_id || '',
        ev.questions?.question_id || '',
        `"${(ev.questions?.question_text || '').replace(/"/g, '""')}"`,
        ev.questions?.question_type || '',
        `"${(ev.questions?.answer_choice || '').replace(/"/g, '""')}"`,
        `"${(ev.questions?.answer_reasoning || '').replace(/"/g, '""')}"`,
        ev.judges?.name || 'Unknown',
        ev.judges?.model_name || '',
        ev.verdict,
        `"${ev.reasoning.replace(/"/g, '""')}"`,
        ev.duration_ms || '',
        ev.error ? `"${ev.error.replace(/"/g, '""')}"` : '',
      ])

      const csvContent = [
        headers.join(','),
        ...(rows?.map(row => row.join(',')) || []),
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `evaluation-results-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export successful',
        description: `Exported ${evaluations?.length || 0} evaluation results to CSV`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      onClick={exportToCSV}
      disabled={exporting}
      variant="outline"
      size="sm"
    >
      {exporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </>
      )}
    </Button>
  )
}

