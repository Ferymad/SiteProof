export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          type: 'subcontractor' | 'main_contractor' | 'validator'
          subscription_tier: string
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'subcontractor' | 'main_contractor' | 'validator'
          subscription_tier?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'subcontractor' | 'main_contractor' | 'validator'
          subscription_tier?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'pm' | 'validator' | 'viewer'
          company_id: string
          preferences: any
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'pm' | 'validator' | 'viewer'
          company_id: string
          preferences?: any
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'pm' | 'validator' | 'viewer'
          company_id?: string
          preferences?: any
          created_at?: string
        }
      }
      whatsapp_submissions: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          whatsapp_text: string | null
          voice_file_path: string | null
          transcription: string | null
          confidence_score: number | null
          extraction_confidence: number | null
          extracted_data: any
          processing_status: string
          processing_error: string | null
          transcription_metadata: any
          created_at: string
          updated_at: string
          processed_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company_id?: string | null
          whatsapp_text?: string | null
          voice_file_path?: string | null
          transcription?: string | null
          confidence_score?: number | null
          extraction_confidence?: number | null
          extracted_data?: any
          processing_status?: string
          processing_error?: string | null
          transcription_metadata?: any
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string | null
          whatsapp_text?: string | null
          voice_file_path?: string | null
          transcription?: string | null
          confidence_score?: number | null
          extraction_confidence?: number | null
          extracted_data?: any
          processing_status?: string
          processing_error?: string | null
          transcription_metadata?: any
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          completed_at?: string | null
        }
      }
    }
  }
}