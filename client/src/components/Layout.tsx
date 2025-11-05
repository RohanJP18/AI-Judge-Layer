import { NavLink } from 'react-router-dom'
import { 
  Upload, 
  Users, 
  GitBranch, 
  Play, 
  BarChart3,
  Scale,
  Paperclip,
  LineChart,
  Target,
  Settings
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { UserDropdown } from '@/features/auth/components/UserDropdown'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Data Ingestion', href: '/ingest', icon: Upload },
  { name: 'AI Judges', href: '/judges', icon: Scale },
  { name: 'Assignments', href: '/assignments', icon: GitBranch },
  { name: 'Attachments', href: '/attachments', icon: Paperclip },
  { name: 'Run Evaluations', href: '/evaluate', icon: Play },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Analytics', href: '/analytics', icon: LineChart },
            { name: 'Calibration', href: '/calibration', icon: Target },
          { name: 'Settings', href: '/settings', icon: Settings },
]

// BeSimple Logo Component
function BeSimpleLogo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 300"
      className={className}
    >
      {/* Tomato body */}
      <circle cx="150" cy="170" r="80" fill="#eda436"/>
      {/* Group for left leaf rotation */}
      <g transform="rotate(-15, 150, 90)">
        {/* Tomato stem */}
        <path d="M150,90 Q115,45 124,23 Q172,40 150,90" fill="#5f8f4f"/>
      </g>
      {/* Group for right leaf with different rotation */}
      <g transform="rotate(0, 150, 90)">
        {/* Rotated leaf */}
        <path d="M150,90 Q175,76 186,62 Q165,52 150,90" fill="#5f8f4f"/>
      </g>
    </svg>
  )
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 p-1.5">
              <BeSimpleLogo className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Judge System</h1>
              <p className="text-xs text-muted-foreground">
                Powered by BeSimple
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <UserDropdown />
            </div>
          )}
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-4 py-6">
        {/* Sidebar Navigation */}
        <aside className="fixed top-20 z-30 -ml-2 hidden h-[calc(100vh-5rem)] w-full shrink-0 md:sticky md:block">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Built with:</p>
              <p>• React 18 + TypeScript</p>
              <p>• Vite + Tailwind CSS</p>
              <p>• Supabase (PostgreSQL)</p>
              <p>• TanStack Query</p>
              <p>• OpenAI/Anthropic/Gemini</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative py-6 lg:gap-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

