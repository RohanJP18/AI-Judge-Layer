import { supabase } from './supabase'

/**
 * Get the current authenticated user's ID
 * Throws an error if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated. Please sign in.')
  }
  
  return user.id
}
