import { createClient } from '@supabase/supabase-js'

// These would normally come from environment variables
// For MVP validation, using placeholder values that will be replaced
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if user is authenticated
export const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function for file upload
export const uploadVoiceNote = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('voice-notes')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw error
  }

  return data
}