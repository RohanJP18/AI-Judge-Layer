import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Bot, Copy, Check } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card'
import { cn } from '@/shared/lib/utils'
import { supabase } from '@/api/supabase'
import { useToast } from '@/shared/hooks/useToast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedActions?: string[]
}

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


// Get page name from path
function getPageName(pathname: string): string {
  const pageMap: Record<string, string> = {
    '/ingest': 'Data Ingestion',
    '/judges': 'AI Judges',
    '/assignments': 'Assignments',
    '/attachments': 'Attachments',
    '/evaluate': 'Run Evaluations',
    '/results': 'Results',
    '/analytics': 'Analytics',
    '/calibration': 'Calibration',
    '/settings': 'Settings',
  }
  return pageMap[pathname] || 'Home'
}

// Generate suggested actions based on message content
function generateSuggestions(messageContent: string, pageName: string): string[] {
  const suggestions: string[] = []
  const lowerContent = messageContent.toLowerCase()

  if (lowerContent.includes('submission') || lowerContent.includes('upload')) {
    suggestions.push('How many submissions do I have?')
    suggestions.push('Show me my recent submissions')
  }

  if (lowerContent.includes('evaluation') || lowerContent.includes('result')) {
    suggestions.push('What are my evaluation results?')
    suggestions.push('Show me failed evaluations')
    suggestions.push('What\'s my pass rate?')
  }

  if (lowerContent.includes('judge')) {
    suggestions.push('How many judges do I have?')
    suggestions.push('Show me my active judges')
    suggestions.push('Which judge performs best?')
  }

  if (lowerContent.includes('statistic') || lowerContent.includes('analytics')) {
    suggestions.push('Show me my statistics')
    suggestions.push('What\'s my evaluation breakdown?')
  }

  // Page-specific suggestions
  if (pageName === 'Results') {
    suggestions.push('Explain these results')
    suggestions.push('Filter by verdict')
  }

  if (pageName === 'AI Judges') {
    suggestions.push('How do I create a judge?')
    suggestions.push('Which model should I use?')
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}

export function AssistantWidget() {
  const location = useLocation()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm the BeSimple AI Assistant. I can help you with questions about the AI Judge System and your data. I can tell you about your submissions, evaluations, judges, and more! What would you like to know?",
      timestamp: new Date(),
      suggestedActions: ['How many submissions do I have?', 'What are my evaluation results?', 'How do I create a judge?'],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageIndex(index)
      toast({
        title: 'Copied to clipboard',
        description: 'Message copied successfully.',
      })
      setTimeout(() => setCopiedMessageIndex(null), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Get page context
      const pageContext = {
        currentPath: location.pathname,
        currentPage: getPageName(location.pathname),
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          conversation: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: pageContext,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Generate suggested actions based on response
      const suggestedActions = generateSuggestions(data.response || '', pageContext.currentPage)

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
        suggestedActions,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Assistant error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please check your API keys in Supabase secrets (GOOGLE_AI_API_KEY) and try again.`
          : "I'm having trouble connecting right now. Please check your connection and try again, or contact support if the issue persists.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-6 left-6 z-50 h-16 w-16 rounded-full shadow-xl',
            'bg-white hover:bg-amber-50 border-2 border-primary/20',
            'transition-all duration-300 animate-in fade-in zoom-in-95',
            'hover:scale-110 hover:shadow-2xl',
            'flex items-center justify-center'
          )}
          size="icon"
        >
          <div className="relative">
            <BeSimpleLogo className="h-10 w-10" />
            {/* Small notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </Button>
      )}

      {/* Chat Window */}
      <Card
        className={cn(
          'fixed bottom-6 left-6 z-50 w-96 h-[600px] shadow-2xl',
          'flex flex-col transition-all duration-300',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
      >
        <CardHeader className="border-b bg-primary/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 p-1.5 flex items-center justify-center">
                <BeSimpleLogo className="w-full h-full" />
              </div>
              <div>
                <CardTitle className="text-lg">BeSimple Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">AI-powered help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2 relative group',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content, index)}
                      >
                        {copiedMessageIndex === index ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        U
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Actions */}
                {message.role === 'assistant' && message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-11">
                    {message.suggestedActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(action)}
                        className="text-xs h-7"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about AI Judge System..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
