import { User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/DropdownMenu'
import { useAuth, useSignOut } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function UserDropdown() {
  const { user } = useAuth()
  const signOutMutation = useSignOut()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''

  const handleSignOut = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login')
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={signOutMutation.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

