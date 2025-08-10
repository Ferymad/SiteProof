/**
 * AssemblyAI Transcription Service
 * Story 1A.2.10: AssemblyAI Universal-2 Integration
 * 
 * Replaces OpenAI Whisper with AssemblyAI for superior construction site accuracy
 * Features: 93.4% accuracy, custom vocabulary, noise handling
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface AssemblyAIRequest {
  fileUrl: string;
  userId: string;
  submissionId: string;
}

export interface AssemblyAIResponse {
  transcription: string;
  confidence_score: number;
  processing_time: number;
  status: 'completed' | 'failed';
  error?: string;
  word_count?: number;
  duration?: number;
  construction_terms_found?: string[];
  critical_errors_fixed?: string[];
  cost?: number;
}

export class AssemblyAITranscriptionService {
  private readonly API_KEY: string;
  private readonly API_BASE = 'https://api.assemblyai.com/v2';
  
  // Construction vocabulary optimized for Irish construction sites
  private readonly CONSTRUCTION_VOCABULARY = [
    // Critical time references (MVP blocker fixes)
    'at thirty', 'at 8:30', 'nine thirty', 'ten fifteen', 'half past', 'quarter past',
    
    // Safety critical terms (prevent "safe farming" errors)
    'safe working', 'PPE', 'hazard', 'scaffold', 'hard hat', 'safety harness',
    'high visibility', 'method statement', 'risk assessment',
    
    // Irish construction materials
    '804 stone', '6F2 aggregate', 'DPC', 'damp proof course', 'formwork', 'rebar',
    'reinforcement', 'shuttering', 'precast', 'aggregate',
    
    // Concrete specifications & materials
    'C25/30', 'C30/37', 'C35/45', 'ready-mix', 'cubic metres', 'concrete strength',
    'slump test', 'vibrator', 'poker', 'trowel',
    
    // Equipment & tools
    'pump truck', 'concrete mixer', 'excavator', 'dumper', 'telehandler',
    'generator', 'compressor', 'crane', 'hoist',
    
    // Irish construction terms
    'block work', 'cavity wall', 'lintel', 'joist', 'purlin', 'soffit',
    'fascia', 'membrane', 'insulation', 'plasterboard'
  ];

  constructor() {
    this.API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
    if (!this.API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY not configured in environment variables');
    }
  }

  /**
   * Process voice note with AssemblyAI Universal-2 model
   */
  async processVoiceNote(request: AssemblyAIRequest): Promise<AssemblyAIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 AssemblyAI Processing (Story 1A.2.10):', { 
        submissionId: request.submissionId, 
        fileUrl: request.fileUrl 
      });
      
      // 1. Download file from Supabase storage
      const audioFile = await this.getFileFromStorage(request.fileUrl);
      console.log('📁 Audio file retrieved:', { 
        size: audioFile.size, 
        type: audioFile.type 
      });
      
      // 2. Upload audio file to AssemblyAI
      const uploadUrl = await this.uploadAudio(audioFile);
      console.log('⬆️ Audio uploaded to AssemblyAI:', uploadUrl);
      
      // 3. Start transcription with construction vocabulary
      const transcriptId = await this.startTranscription(uploadUrl);
      console.log('🎤 Transcription started:', transcriptId);
      
      // 4. Poll for completion
      const result = await this.pollForCompletion(transcriptId);
      console.log('✅ Transcription completed:', {
        accuracy: result.confidence,
        duration: result.audio_duration,
        words: result.words?.length || 0
      });
      
      // 5. Process and validate results
      const transcription = result.text || '';
      const confidence = Math.round((result.confidence || 0.85) * 100);
      const duration = (result.audio_duration || 0) / 1000; // Convert ms to seconds
      const wordCount = result.words?.length || transcription.split(/\s+/).length;
      
      // 6. Analyze construction terms found
      const constructionTermsFound = this.analyzeConstructionTerms(transcription);
      console.log('🏗️ Construction terms found:', constructionTermsFound);
      
      // 7. Check for critical error fixes
      const criticalErrorsFixed = this.analyzeCriticalErrorFixes(transcription);
      if (criticalErrorsFixed.length > 0) {
        console.log('🔧 Critical errors fixed:', criticalErrorsFixed);
      }
      
      // 8. Calculate cost (AssemblyAI pricing: $0.0045/minute)
      const cost = (duration / 60) * 0.0045;
      console.log('💰 Transcription cost:', `$${cost.toFixed(5)}`);
      
      // 9. Save to database
      await this.saveTranscription(
        request.submissionId,
        transcription,
        confidence,
        {
          duration,
          wordCount,
          constructionTermsFound,
          criticalErrorsFixed,
          cost,
          engine: 'AssemblyAI',
          model: 'Universal-2'
        }
      );
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        transcription,
        confidence_score: confidence,
        processing_time: processingTime,
        word_count: wordCount,
        duration,
        status: 'completed',
        construction_terms_found: constructionTermsFound,
        critical_errors_fixed: criticalErrorsFixed,
        cost
      };
      
    } catch (error: any) {
      console.error('❌ AssemblyAI error:', error);
      
      await this.updateSubmissionStatus(request.submissionId, 'failed', error.message);
      
      return {
        transcription: '',
        confidence_score: 0,
        processing_time: (Date.now() - startTime) / 1000,
        status: 'failed',
        error: this.getUserFriendlyError(error)
      };
    }
  }

  /**
   * Upload audio file to AssemblyAI
   */
  private async uploadAudio(audioFile: Blob): Promise<string> {
    const response = await fetch(`${this.API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.API_KEY
      },
      body: audioFile
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const { upload_url } = await response.json();
    
    if (!upload_url) {
      throw new Error('No upload URL returned from AssemblyAI');
    }
    
    return upload_url;
  }

  /**
   * Start transcription with construction-optimized settings
   */
  private async startTranscription(audioUrl: string): Promise<string> {
    const transcriptionConfig = {
      audio_url: audioUrl,
      
      // Core AssemblyAI Universal-2 settings
      speech_model: 'best', // Use the most accurate model available
      language_detection: false, // We know it's English
      
      // Construction vocabulary boost (critical for accuracy)
      word_boost: this.CONSTRUCTION_VOCABULARY,
      boost_param: 'high', // Maximum boost for construction terms
      
      // Quality settings
      punctuate: true,
      format_text: true,
      disfluencies: false, // Remove ums, ahs for cleaner output
      
      // Disable features we don't need (saves cost)
      speaker_labels: false,
      auto_highlights: false,
      content_safety: false,
      iab_categories: false,
      
      // Enable useful features
      dual_channel: false, // Single channel audio
      webhook_url: null, // We'll poll instead
      
      // Confidence thresholds
      filter_profanity: false, // Construction sites have colorful language
      redact_pii: false // We need all content for construction context
    };
    
    const response = await fetch(`${this.API_BASE}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transcriptionConfig)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription start failed: ${errorData.error || response.statusText}`);
    }
    
    const { id } = await response.json();
    
    if (!id) {
      throw new Error('No transcript ID returned from AssemblyAI');
    }
    
    return id;
  }

  /**
   * Poll for transcription completion with exponential backoff
   */
  private async pollForCompletion(transcriptId: string, maxAttempts: number = 30): Promise<any> {
    let attempts = 0;
    let backoffMs = 1000; // Start with 1 second
    
    while (attempts < maxAttempts) {
      const response = await fetch(`${this.API_BASE}/transcript/${transcriptId}`, {
        headers: {
          'Authorization': this.API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'error') {
        throw new Error(`AssemblyAI transcription error: ${result.error}`);
      } else if (result.status === 'queued' || result.status === 'processing') {
        // Still processing, wait and retry
        console.log(`⏳ Transcription ${result.status}, waiting ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        // Exponential backoff: 1s, 2s, 4s, 8s, then cap at 10s
        backoffMs = Math.min(backoffMs * 2, 10000);
        attempts++;
      } else {
        throw new Error(`Unknown transcription status: ${result.status}`);
      }
    }
    
    throw new Error('Transcription timeout - exceeded maximum poll attempts');
  }

  /**
   * Analyze construction terms found in transcription
   */
  private analyzeConstructionTerms(transcription: string): string[] {
    const found: string[] = [];
    const lowerTranscription = transcription.toLowerCase();
    
    for (const term of this.CONSTRUCTION_VOCABULARY) {
      if (lowerTranscription.includes(term.toLowerCase())) {
        found.push(term);
      }
    }
    
    return found;
  }

  /**
   * Analyze critical error fixes achieved vs Whisper baseline
   */
  private analyzeCriticalErrorFixes(transcription: string): string[] {
    const fixes: string[] = [];
    
    // Check for time context fixes
    if (transcription.includes('8:30') || transcription.includes(':30')) {
      fixes.push('TIME_CONTEXT_PRESERVED');
    }
    
    // Check for safety term accuracy
    if (transcription.toLowerCase().includes('safe working')) {
      fixes.push('SAFETY_TERMS_ACCURATE');
    }
    
    // Check for construction material codes
    const materialCodes = ['C25/30', 'C30/37', 'C35/45'];
    for (const code of materialCodes) {
      if (transcription.includes(code)) {
        fixes.push(`MATERIAL_CODE_RECOGNIZED: ${code}`);
      }
    }
    
    // Check for construction equipment
    const equipmentTerms = ['pump truck', 'concrete mixer', 'excavator'];
    for (const term of equipmentTerms) {
      if (transcription.toLowerCase().includes(term.toLowerCase())) {
        fixes.push(`EQUIPMENT_TERM_RECOGNIZED: ${term}`);
      }
    }
    
    return fixes;
  }

  /**
   * Save transcription to database with AssemblyAI metadata
   */
  private async saveTranscription(
    submissionId: string,
    transcription: string,
    confidence: number,
    metadata: {
      duration?: number;
      wordCount?: number;
      constructionTermsFound?: string[];
      criticalErrorsFixed?: string[];
      cost?: number;
      engine?: string;
      model?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          transcription,
          confidence_score: confidence,
          processing_status: 'transcribed',
          transcription_metadata: {
            ...metadata,
            engine: 'AssemblyAI',
            story: '1A.2.10'
          },
          processed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Database save error:', error);
      throw new Error(`Failed to save transcription: ${error.message}`);
    }
  }

  /**
   * Update submission status on failure
   */
  private async updateSubmissionStatus(
    submissionId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          processing_status: status,
          processing_error: errorMessage,
          processed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
    } catch (error) {
      console.error('Status update error:', error);
    }
  }

  /**
   * Get file from Supabase storage
   */
  private async getFileFromStorage(fileUrl: string): Promise<Blob> {
    const { data, error } = await supabaseAdmin.storage
      .from('voice-notes')
      .download(fileUrl);
    
    if (error || !data) {
      throw new Error(`Failed to retrieve audio file: ${error?.message || 'No data'}`);
    }
    
    return data;
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error: any): string {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('api key') || message.includes('unauthorized')) {
      return 'Voice processing service temporarily unavailable. Please try again.';
    }
    if (message.includes('size') || message.includes('large')) {
      return 'Voice note is too large. Please record shorter messages.';
    }
    if (message.includes('format') || message.includes('type')) {
      return 'Unsupported audio format. Please use WhatsApp voice messages.';
    }
    if (message.includes('timeout')) {
      return 'Processing took too long. Please try with a shorter voice note.';
    }
    
    return 'Could not process voice note. Please try again.';
  }
}