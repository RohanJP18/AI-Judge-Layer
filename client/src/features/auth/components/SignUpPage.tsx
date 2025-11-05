import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Label } from '@/shared/components/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { useSignUp } from '../hooks/useAuth'

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

export function SignUpPage() {
  const navigate = useNavigate()
  const signUpMutation = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    signUpMutation.mutate(
      { email, password, name },
      {
        onSuccess: () => {
          // Auto sign in after signup (Supabase handles this)
          setTimeout(() => {
            navigate('/')
          }, 1000)
        },
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-lg bg-primary/10 p-2 flex items-center justify-center">
              <BeSimpleLogo className="w-full h-full" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Get started with AI Judge System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  className={errors.name ? 'border-destructive pl-10' : 'pl-10'}
                  disabled={signUpMutation.isPending}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className={errors.email ? 'border-destructive pl-10' : 'pl-10'}
                  disabled={signUpMutation.isPending}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }))
                  }}
                  className={errors.password ? 'border-destructive pl-10' : 'pl-10'}
                  disabled={signUpMutation.isPending}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }}
                  className={errors.confirmPassword ? 'border-destructive pl-10' : 'pl-10'}
                  disabled={signUpMutation.isPending}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signUpMutation.isPending}
            >
              {signUpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
