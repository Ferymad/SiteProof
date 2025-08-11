// Shared TypeScript interfaces for BMAD Construction Evidence Machine

export interface WhatsAppSubmission {
  id: string;
  user_id: string;
  whatsapp_text?: string;
  voice_file_path?: string;
  transcription?: string;
  confidence_score?: number;
  extraction_confidence?: number;
  extracted_data?: ExtractedData;
  processing_status: ProcessingStatus;
  processing_error?: string;
  transcription_metadata?: TranscriptionMetadata;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  completed_at?: string;
}

export interface ExtractedData {
  amounts?: Amount[];
  materials?: Material[];
  dates?: DateExtraction[];
  locations?: Location[];
  people?: Person[];
  summary?: string;
}

export interface Amount {
  value: number;
  currency?: string;
  context: string;
  confidence: number;
}

export interface Material {
  name: string;
  quantity?: number;
  unit?: string;
  context: string;
  confidence: number;
}

export interface DateExtraction {
  date: string;
  context: string;
  confidence: number;
}

export interface Location {
  name: string;
  type?: 'site' | 'supplier' | 'office' | 'other';
  context: string;
  confidence: number;
}

export interface Person {
  name: string;
  role?: string;
  context: string;
  confidence: number;
}

export interface TranscriptionMetadata {
  duration?: number;
  word_count?: number;
  language?: string;
  model_used?: string;
  processing_time?: number;
}

export type ProcessingStatus = 
  | 'pending'
  | 'transcribing'
  | 'transcribed'
  | 'extracting'
  | 'completed'
  | 'failed';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Environment configuration types
export interface EnvironmentConfig {
  supabase: {
    url: string;
    anon_key: string;
    service_role_key?: string;
  };
  openai: {
    api_key: string;
    model?: string;
  };
  assemblyai?: {
    api_key: string;
  };
  deepgram?: {
    api_key: string;
  };
  sentry?: {
    dsn: string;
  };
}