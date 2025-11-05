import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/Dialog'

// BeSimple Logo Component
function BeSimpleLogo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 300"
      className={className}
    >
      <circle cx="150" cy="170" r="80" fill="#eda436"/>
      <g transform="rotate(-15, 150, 90)">
        <path d="M150,90 Q115,45 124,23 Q172,40 150,90" fill="#5f8f4f"/>
      </g>
      <g transform="rotate(0, 150, 90)">
        <path d="M150,90 Q175,76 186,62 Q165,52 150,90" fill="#5f8f4f"/>
      </g>
    </svg>
  )
}

interface WelcomeModalProps {
  onComplete: () => void
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [])

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setOpen(false)
    onComplete()
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-lg bg-primary/10 p-3 flex items-center justify-center">
              <BeSimpleLogo className="w-full h-full" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to AI Judge System!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Get started in 3 simple steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Import Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Upload JSON files with submissions, questions, and answers
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Create AI Judges</h4>
              <p className="text-sm text-muted-foreground">
                Configure AI judges with custom prompts and LLM models
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Run & Analyze</h4>
              <p className="text-sm text-muted-foreground">
                Assign judges, run evaluations, and view detailed results
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.setItem('hasSeenWelcome', 'true')
              setOpen(false)
            }}
            className="flex-1"
          >
            Skip
          </Button>
          <Button onClick={handleGetStarted} className="flex-1">
            <Sparkles className="mr-2 h-4 w-4" />
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
