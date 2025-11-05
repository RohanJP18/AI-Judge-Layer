import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabase'
import type { User, Session } from '@supabase/supabase-js'
import {
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  updateUserProfile,
  resetPassword,
  type SignUpCredentials,
  type SignInCredentials,
} from '../api'
import { toast } from '@/shared/hooks/useToast'

export const authKeys = {
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,
}

// Get current session
export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: getSession,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

// Get current user
export function useUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: getCurrentUser,
    enabled: false, // We'll enable via auth state changes
    staleTime: Infinity,
  })
}

// Sign up mutation
export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: SignUpCredentials) => signUp(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session })
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      toast({
        title: 'Account created',
        description: 'Please check your email to verify your account.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Sign in mutation
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: SignInCredentials) => signIn(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.session })
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      toast({
        title: 'Signed in successfully',
        description: 'Welcome back!',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Sign out mutation
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear()
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for reset instructions.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Auth state hook (listens to auth changes)
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getSession().then((session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
  }
}
