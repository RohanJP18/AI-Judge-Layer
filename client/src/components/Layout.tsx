import { NavLink } from 'react-router-dom'
import { 
  Upload, 
  Users, 
  GitBranch, 
  Play, 
  BarChart3,
  Scale,
  Paperclip,
  LineChart
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

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
]

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Judge System</h1>
              <p className="text-xs text-muted-foreground">
                Automated Evaluation Platform
              </p>
            </div>
          </div>
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

