import { useState, useRef } from 'react'
import { Upload, X, FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { supabase } from '@/api/supabase'
import { useToast } from '@/shared/hooks/useToast'

interface FileUploadProps {
  submissionId: string
  questionId: string
  onUploadComplete?: () => void
}

interface UploadedFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
}

export function FileUpload({ submissionId, questionId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const acceptedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf',
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not a supported file type`,
            variant: 'destructive',
          })
          continue
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 10MB limit`,
            variant: 'destructive',
          })
          continue
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const filePath = `${submissionId}/${questionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('evaluation-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast({
            title: 'Upload failed',
            description: uploadError.message,
            variant: 'destructive',
          })
          continue
        }

        // Get current user for user_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User must be authenticated to upload attachments')
        }

        // Store attachment record in database
        const { data: attachment, error: dbError } = await supabase
          .from('attachments')
          .insert({
            submission_id: submissionId,
            question_id: questionId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            user_id: user.id, // Set user_id for RLS
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          // Clean up storage if DB insert fails
          await supabase.storage.from('evaluation-attachments').remove([filePath])
          toast({
            title: 'Database error',
            description: dbError.message,
            variant: 'destructive',
          })
          continue
        }

        // Update questions table to indicate it has attachments
        await supabase
          .from('questions')
          .update({ has_attachments: true })
          .eq('id', questionId)

        setFiles((prev) => [...prev, attachment as UploadedFile])

        toast({
          title: 'Upload successful',
          description: `${file.name} uploaded`,
        })
      }

      onUploadComplete?.()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (file: UploadedFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('evaluation-attachments')
        .remove([file.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      setFiles((prev) => prev.filter((f) => f.id !== file.id))

      // Check if there are any remaining attachments for this question
      const { data: remainingAttachments } = await supabase
        .from('attachments')
        .select('id')
        .eq('question_id', questionId)

      if (!remainingAttachments || remainingAttachments.length === 0) {
        await supabase
          .from('questions')
          .update({ has_attachments: false })
          .eq('id', questionId)
      }

      toast({
        title: 'File deleted',
        description: `${file.file_name} removed`,
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files (Images/PDFs)
          </>
        )}
      </Button>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.file_type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Supported: Images (PNG, JPG, GIF, WebP), PDFs. Max 10MB per file.
      </p>
    </div>
  )
}

