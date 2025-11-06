import { supabase } from '@/api/supabase'

export interface SignUpCredentials {
  email: string
  password: string
  name?: string
}

export interface SignInCredentials {
  email: string
  password: string
}

// Sign up new user
export async function signUp(credentials: SignUpCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        name: credentials.name || credentials.email.split('@')[0],
      },
    },
  })

  if (error) throw new Error(error.message)
  return data
}

// Sign in existing user
export async function signIn(credentials: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) throw new Error(error.message)
  return data
}

// Sign out current user
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return session
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  return user
}

// Update user profile
export async function updateUserProfile(updates: { 
  name?: string
  avatar_url?: string
  hide_welcome_modal?: boolean
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  })

  if (error) throw new Error(error.message)
  return data
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw new Error(error.message)
}

