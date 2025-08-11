// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: TranscriptionService contains OpenAI dependencies and must run server-side only. ' +
    'Components should use fetch() calls to API endpoints instead of importing this service directly.'
  );
}

/**
 * EMERGENCY FIX: Server-Side Transcription Service
 * 
 * Story 1A.2.1: Enhanced Transcription Service with Business Risk Routing
 * SiteProof - Construction Evidence Machine
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - This service contains OpenAI dependencies and MUST run server-side only
 * - Components should NEVER import this service directly
 * - Use fetch() calls to /api/processing/* endpoints instead
 * - Browser execution will throw security violation error
 * 
 * Implements audio normalization, business risk routing, and hallucination guards
 * Designed to be easily portable to Django
 * 
 * Future Django equivalent: apps/processing/services.py
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import openai, { WHISPER_CONFIG, AI_ERROR_MESSAGES } from '@/lib/openai';
import { File as FormDataFile } from 'formdata-node';
import { fixTranscription, calculateConfidence as calculateFixerConfidence } from './transcription-fixer';
import { AudioNormalizerService, AudioNormalizationResult } from './audio-normalizer.service';
import { BusinessRiskRouterService, BusinessRiskAssessment, RoutingDecision } from './business-risk-router.service';

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
  // Story 1A.2.1: Enhanced response with business risk assessment
  business_risk?: BusinessRiskAssessment;
  routing_decision?: RoutingDecision;
  audio_quality?: {
    normalized: boolean;
    quality_score: number;
    original_size: number;
    normalized_size: number;
  };
  critical_errors?: string[];
  hallucination_detected?: boolean;
}

export class TranscriptionService {
  private audioNormalizer: AudioNormalizerService;
  private businessRiskRouter: BusinessRiskRouterService;
  
  constructor() {
    this.audioNormalizer = new AudioNormalizerService();
    this.businessRiskRouter = new BusinessRiskRouterService();
  }
  
  /**
   * Story 1A.2.1: Enhanced voice note processing with business risk routing
   * Implements audio normalization, critical error detection, and hallucination guards
   */
  async processVoiceNote(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 PROCESSING START (Story 1A.2.1):', { 
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
      
      // 2. Story 1A.2.1: Normalize audio for consistent processing
      console.log('🎵 Normalizing audio...');
      const normalizationResult = await this.audioNormalizer.normalizeAudio(audioFile, request.fileUrl);
      console.log('🎵 Audio normalization complete:', {
        originalSize: normalizationResult.originalSize,
        normalizedSize: normalizationResult.normalizedSize,
        processingTime: normalizationResult.processingTime,
        format: normalizationResult.format
      });
      
      // 3. Analyze audio quality for routing decisions
      const audioQuality = await this.audioNormalizer.analyzeAudioQuality(audioFile);
      console.log('🎯 Audio quality analysis:', audioQuality);
      
      // 4. Send normalized audio to OpenAI Whisper API
      console.log('🎤 Calling OpenAI transcription API with normalized audio...');
      const whisperResponse = await this.callWhisperAPI(normalizationResult.normalizedBlob, request.fileUrl);
      console.log('🎤 OpenAI response received:', { 
        hasText: !!whisperResponse.text,
        textLength: whisperResponse.text?.length || 0,
        firstChars: whisperResponse.text?.substring(0, 100) || 'NO TEXT'
      });
      
      // 5. Get raw transcription
      const rawTranscription = whisperResponse.text || '';
      const initialConfidence = this.calculateConfidence(whisperResponse);
      
      // 6. Story 1A.2.1: Apply enhanced Irish construction fixes with critical error detection
      console.log('🔧 Raw transcription before fixes:', {
        text: rawTranscription.substring(0, 200) + '...',
        confidence: initialConfidence
      });
      
      const fixResult = await fixTranscription(rawTranscription, {
        useGPT4: initialConfidence < 85, // Use GPT-4 for low confidence
        initialConfidence,
        enableHallucinationGuards: true, // Story 1A.2.1: Enable hallucination detection
        maxTokenExpansion: 15 // Reject if >15% token expansion
      });
      
      console.log('🔧 After fixes applied:', {
        originalLength: rawTranscription.length,
        fixedLength: fixResult.fixed.length,
        changes: fixResult.changes,
        confidence: fixResult.confidence,
        criticalErrors: fixResult.criticalErrors,
        hallucinationDetected: fixResult.hallucinationDetected,
        requiresManualReview: fixResult.requiresManualReview,
        fixedText: fixResult.fixed.substring(0, 200) + '...'
      });
      
      // 7. Story 1A.2.1: Business risk assessment and routing
      const businessRiskAssessment = this.businessRiskRouter.assessBusinessRisk({
        transcription: fixResult.fixed,
        audioQuality: audioQuality.quality,
        audioScore: audioQuality.score,
        duration: audioQuality.duration,
        fileSize: audioFile.size,
        userId: request.userId
      });
      
      console.log('🎯 Business risk assessment:', {
        decision: businessRiskAssessment.decision,
        riskScore: businessRiskAssessment.riskScore,
        criticalPatterns: businessRiskAssessment.criticalPatterns,
        estimatedValue: businessRiskAssessment.estimatedValue
      });
      
      // 8. Use the fixed transcription
      const transcription = fixResult.fixed;
      const confidence = fixResult.confidence;
      const duration = whisperResponse.duration || audioQuality.duration || 0;
      const wordCount = transcription.split(/\s+/).filter(word => word.length > 0).length;
      
      // Log improvements for monitoring
      if (fixResult.changes.length > 0) {
        console.log('Transcription fixes applied:', fixResult.changes);
      }
      
      // Log business risk routing
      if (businessRiskAssessment.decision !== 'AUTO_APPROVE') {
        console.log('🚨 Manual review required:', businessRiskAssessment.reasoning);
      }
      
      // 9. Store in database with enhanced metadata
      await this.saveTranscription(
        request.submissionId,
        transcription,
        confidence,
        { 
          duration, 
          wordCount,
          originalTranscription: rawTranscription,
          fixesApplied: fixResult.changes,
          // Story 1A.2.1: Enhanced metadata
          criticalErrors: fixResult.criticalErrors,
          hallucinationDetected: fixResult.hallucinationDetected,
          businessRiskAssessment,
          audioNormalization: normalizationResult,
          audioQuality
        }
      );
      
      // 10. Return enhanced transcription result
      const processingTime = (Date.now() - startTime) / 1000; // in seconds
      
      return {
        transcription,
        confidence_score: confidence,
        processing_time: processingTime,
        word_count: wordCount,
        duration,
        status: 'completed',
        // Story 1A.2.1: Enhanced response data
        business_risk: businessRiskAssessment,
        routing_decision: businessRiskAssessment.decision,
        audio_quality: {
          normalized: true,
          quality_score: audioQuality.score,
          original_size: normalizationResult.originalSize,
          normalized_size: normalizationResult.normalizedSize
        },
        critical_errors: fixResult.criticalErrors,
        hallucination_detected: fixResult.hallucinationDetected
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
        error: this.getUserFriendlyError(error),
        // Include default values for enhanced fields
        routing_decision: 'MANUAL_REVIEW', // Failed transcriptions need manual review
        critical_errors: [],
        hallucination_detected: false
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
   * Story 1A.2.1: Enhanced confidence calculation
   * Now considers audio quality and hallucination risk
   */
  private calculateConfidence(whisperResponse: any, audioQuality?: { score: number }): number {
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
    
    // Story 1A.2.1: Factor in audio quality
    if (audioQuality) {
      if (audioQuality.score < 50) {
        confidence = Math.min(confidence, 60); // Poor audio quality
      } else if (audioQuality.score > 80) {
        confidence = Math.min(100, confidence + 5); // High audio quality bonus
      }
    }
    
    return Math.round(confidence);
  }

  /**
   * Story 1A.2.1: Enhanced database save with business risk metadata
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
      criticalErrors?: string[];
      hallucinationDetected?: boolean;
      businessRiskAssessment?: BusinessRiskAssessment;
      audioNormalization?: AudioNormalizationResult;
      audioQuality?: any;
    }
  ): Promise<void> {
    try {
      // Determine processing status based on business risk
      let processing_status = 'transcribed';
      if (metadata?.businessRiskAssessment) {
        switch (metadata.businessRiskAssessment.decision) {
          case 'URGENT_REVIEW':
            processing_status = 'urgent_review';
            break;
          case 'MANUAL_REVIEW':
            processing_status = 'manual_review';
            break;
          case 'AUTO_APPROVE':
            processing_status = 'transcribed';
            break;
        }
      }
      
      const { error } = await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          transcription,
          confidence_score: confidence,
          processing_status,
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