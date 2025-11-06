import { supabase } from '@/api/supabase'
import type { Judge, JudgeCreate, JudgeUpdate } from '@/shared/types/schemas'
import type { Database } from '@/shared/types/database'

type JudgeRow = Database['public']['Tables']['judges']['Row']

// Fetch all judges
export async function fetchJudges(): Promise<Judge[]> {
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  
  return data as Judge[]
}

// Fetch active judges only
export async function fetchActiveJudges(): Promise<Judge[]> {
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  
  return data as Judge[]
}

// Fetch a single judge by ID
export async function fetchJudgeById(id: string): Promise<Judge> {
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  
  return data as Judge
}

// Create a new judge
export async function createJudge(judge: JudgeCreate): Promise<Judge> {
  // Get current user for user_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated to create judges')
  }

  const { data, error } = await supabase
    .from('judges')
    .insert({
      name: judge.name,
      system_prompt: judge.system_prompt,
      model_name: judge.model_name,
      is_active: judge.is_active,
      user_id: user.id, // Set user_id for RLS
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  return data as Judge
}

// Update an existing judge
export async function updateJudge(
  id: string,
  updates: JudgeUpdate
): Promise<Judge> {
  const updateData: Partial<JudgeRow> = {
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.system_prompt !== undefined && { system_prompt: updates.system_prompt }),
    ...(updates.model_name !== undefined && { model_name: updates.model_name }),
    ...(updates.is_active !== undefined && { is_active: updates.is_active }),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('judges')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  return data as Judge
}

// Delete a judge
export async function deleteJudge(id: string): Promise<void> {
  const { error } = await supabase
    .from('judges')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Deactivate a judge (soft delete)
export async function deactivateJudge(id: string): Promise<Judge> {
  return updateJudge(id, { is_active: false })
}

