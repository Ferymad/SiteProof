/**
 * Story 1A.2: Transcription Service
 * SiteProof - Construction Evidence Machine
 * 
 * Business logic for voice note transcription
 * Designed to be easily portable to Django
 * 
 * Future Django equivalent: apps/processing/services.py
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import openai, { WHISPER_CONFIG, AI_ERROR_MESSAGES } from '@/lib/openai';
import { File as FormDataFile } from 'formdata-node';
import { fixTranscription, calculateConfidence as calculateFixerConfidence } from './transcription-fixer';

export interface TranscriptionRequest {
  fileUrl: string;
  userId: string;
  submissionId: string;
}

export interface TranscriptionResponse {
  transcription: string;
  confidence_score: number;
  processing_time: number;
  status: 'completed' | 'failed';
  error?: string;
  word_count?: number;
  duration?: number;
}

export class TranscriptionService {
  /**
   * Process voice note through OpenAI Whisper API
   * Implements Story 1A.2 requirements
   */
  async processVoiceNote(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 PROCESSING START:', { 
        submissionId: request.submissionId, 
        fileUrl: request.fileUrl,
        userId: request.userId 
      });
      
      // 1. Download file from Supabase storage
      console.log('📁 Downloading file from Supabase...');
      const audioFile = await this.getFileFromStorage(request.fileUrl);
      console.log('📁 File downloaded:', { 
        size: audioFile.size, 
        type: audioFile.type,
        url: request.fileUrl 
      });
      
      // 2. Send to OpenAI Whisper API (or new model)
      console.log('🎤 Calling OpenAI transcription API...');
      const whisperResponse = await this.callWhisperAPI(audioFile, request.fileUrl);
      console.log('🎤 OpenAI response received:', { 
        hasText: !!whisperResponse.text,
        textLength: whisperResponse.text?.length || 0,
        firstChars: whisperResponse.text?.substring(0, 100) || 'NO TEXT'
      });
      
      // 3. Get raw transcription
      const rawTranscription = whisperResponse.text || '';
      const initialConfidence = this.calculateConfidence(whisperResponse);
      
      // 4. Apply Irish construction fixes
      console.log('🔧 Raw transcription before fixes:', {
        text: rawTranscription.substring(0, 200) + '...',
        confidence: initialConfidence
      });
      
      const fixResult = await fixTranscription(rawTranscription, {
        useGPT4: initialConfidence < 85, // Use GPT-4 for low confidence
        initialConfidence
      });
      
      console.log('🔧 After fixes applied:', {
        originalLength: rawTranscription.length,
        fixedLength: fixResult.fixed.length,
        changes: fixResult.changes,
        confidence: fixResult.confidence,
        fixedText: fixResult.fixed.substring(0, 200) + '...'
      });
      
      // 5. Use the fixed transcription
      const transcription = fixResult.fixed;
      const confidence = fixResult.confidence;
      const duration = whisperResponse.duration || 0;
      const wordCount = transcription.split(/\s+/).filter(word => word.length > 0).length;
      
      // Log improvements for monitoring
      if (fixResult.changes.length > 0) {
        console.log('Transcription fixes applied:', fixResult.changes);
      }
      
      // 6. Store in database
      await this.saveTranscription(
        request.submissionId,
        transcription,
        confidence,
        { 
          duration, 
          wordCount,
          originalTranscription: rawTranscription,
          fixesApplied: fixResult.changes
        }
      );
      
      // 7. Return transcription result
      const processingTime = (Date.now() - startTime) / 1000; // in seconds
      
      return {
        transcription,
        confidence_score: confidence,
        processing_time: processingTime,
        word_count: wordCount,
        duration,
        status: 'completed'
      };
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      
      // Save failed status to database
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
   * Get file from Supabase storage
   */
  private async getFileFromStorage(fileUrl: string): Promise<Blob> {
    try {
      // Extract bucket and path from URL
      // Format: voice-notes/userId/timestamp.ext
      const { data, error } = await supabaseAdmin.storage
        .from('voice-notes')
        .download(fileUrl);
      
      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No file data received from storage');
      }
      
      return data;
    } catch (error: any) {
      console.error('Storage retrieval error:', error);
      throw new Error(`Failed to retrieve audio file: ${error.message}`);
    }
  }

  /**
   * Call OpenAI Whisper API
   */
  private async callWhisperAPI(audioFile: Blob, fileName: string): Promise<any> {
    try {
      // Convert Blob to File for OpenAI API
      const file = new File([audioFile], fileName.split('/').pop() || 'audio.mp3', {
        type: audioFile.type || 'audio/mpeg'
      });
      
      // Call Whisper API with construction-optimized settings
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: WHISPER_CONFIG.model,
        language: WHISPER_CONFIG.language,
        temperature: WHISPER_CONFIG.temperature,
        response_format: WHISPER_CONFIG.response_format,
        // Use the enhanced prompt from config
        prompt: WHISPER_CONFIG.prompt
      } as any);
      
      return response;
    } catch (error: any) {
      console.error('Whisper API error:', error);
      throw new Error(`Transcription API error: ${error.message}`);
    }
  }

  /**
   * Calculate confidence score from Whisper response
   */
  private calculateConfidence(whisperResponse: any): number {
    // Whisper doesn't directly provide confidence scores
    // We calculate based on response characteristics
    
    let confidence = 85; // Base confidence for successful transcription
    
    // Adjust based on response segments if available
    if (whisperResponse.segments && Array.isArray(whisperResponse.segments)) {
      const avgLogprob = whisperResponse.segments.reduce((acc: number, seg: any) => {
        return acc + (seg.avg_logprob || 0);
      }, 0) / whisperResponse.segments.length;
      
      // Convert log probability to confidence percentage
      // Higher (less negative) log probs = higher confidence
      if (avgLogprob > -0.3) confidence = 95;
      else if (avgLogprob > -0.5) confidence = 90;
      else if (avgLogprob > -0.8) confidence = 85;
      else if (avgLogprob > -1.2) confidence = 75;
      else if (avgLogprob > -1.5) confidence = 65;
      else confidence = 55;
    }
    
    // Adjust based on transcription length
    const text = whisperResponse.text || '';
    if (text.length < 10) {
      confidence = Math.min(confidence, 50); // Very short transcription
    }
    
    return Math.round(confidence);
  }

  /**
   * Save transcription to database
   */
  private async saveTranscription(
    submissionId: string,
    transcription: string,
    confidence: number,
    metadata?: { 
      duration?: number; 
      wordCount?: number;
      originalTranscription?: string;
      fixesApplied?: string[];
    }
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          transcription,
          confidence_score: confidence,
          processing_status: 'transcribed',
          transcription_metadata: metadata,
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
   * Update submission status in case of failure
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
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error: any): string {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('api key')) {
      return AI_ERROR_MESSAGES.API_ERROR;
    }
    if (message.includes('size') || message.includes('large')) {
      return AI_ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (message.includes('format') || message.includes('type')) {
      return AI_ERROR_MESSAGES.INVALID_FORMAT;
    }
    if (message.includes('transcription')) {
      return AI_ERROR_MESSAGES.TRANSCRIPTION_FAILED;
    }
    
    return AI_ERROR_MESSAGES.API_ERROR;
  }
}