import { useState } from 'react'
import { User, Moon, Sun, Key, Save, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Label } from '@/shared/components/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { useAuth, useUpdateProfile } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'

export function SettingsPage() {
  const { user } = useAuth()
  const updateProfileMutation = useUpdateProfile()
  const { toast } = useToast()
  const [name, setName] = useState(user?.user_metadata?.name || user?.email?.split('@')[0] || '')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    return (stored === 'dark' ? 'dark' : 'light')
  })

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({ name })
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    toast({
      title: 'Theme updated',
      description: `Switched to ${newTheme} mode.`,
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Update your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
              className="flex-1"
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className="flex-1"
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>
            LLM API keys are securely stored in Supabase Edge Functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">OpenAI API Key</p>
                <p className="text-muted-foreground">
                  Set via: <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase secrets set OPENAI_API_KEY=sk-...</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Anthropic API Key</p>
                <p className="text-muted-foreground">
                  Set via: <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase secrets set ANTHROPIC_API_KEY=sk-ant-...</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Google AI API Key</p>
                <p className="text-muted-foreground">
                  Set via: <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase secrets set GOOGLE_AI_API_KEY=...</code>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              💡 API keys are never exposed to the client. All LLM calls are made securely through Supabase Edge Functions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
