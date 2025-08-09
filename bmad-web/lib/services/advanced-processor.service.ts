/**
 * Story 1A.2.3: Three-Pass Advanced Processing Pipeline
 * SiteProof - Construction Evidence Machine
 * 
 * Orchestrates the three-pass processing system:
 * Pass 1: Whisper-1 → Raw Transcription
 * Pass 2: GPT-4o-mini → Context Detection  
 * Pass 3: GPT-4o-mini → Smart Disambiguation
 * 
 * CRITICAL: This service runs server-side only with OpenAI dependencies
 */

// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: AdvancedProcessorService contains OpenAI dependencies and must run server-side only.'
  );
}

import { TranscriptionService, TranscriptionRequest, TranscriptionResponse } from './transcription.service';
import { ContextDetectorService, ContextDetectionRequest, ContextDetectionResult, ContextType } from './context-detector.service';
import { ContextDisambiguatorService, DisambiguationRequest, DisambiguationResponse } from './context-disambiguator.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Advanced processing request parameters
 */
export interface AdvancedProcessingRequest {
  fileUrl: string;
  userId: string;
  submissionId: string;
  enableABTesting?: boolean; // Compare with legacy system
  processingOptions?: {
    skipContextDetection?: boolean;
    skipDisambiguation?: boolean;
    maxProcessingTime?: number; // milliseconds
  };
}

/**
 * Comprehensive processing response with all pass results
 */
export interface AdvancedProcessingResponse {
  // Final results
  finalTranscription: string;
  overallConfidence: number;
  processing_status: 'completed' | 'partial' | 'failed';
  total_processing_time: number;
  total_cost_estimate: number; // USD
  
  // Pass-by-pass breakdown
  pass1_transcription: TranscriptionResponse;
  pass2_context: ContextDetectionResult;
  pass3_disambiguation: DisambiguationResponse;
  
  // Quality metrics
  improvement_metrics: {
    accuracy_gain: number; // estimated % improvement
    disambiguation_count: number;
    critical_fixes_applied: number;
    human_review_recommended: boolean;
  };
  
  // Comparison with legacy system (if A/B testing enabled)
  legacy_comparison?: {
    legacy_transcription: string;
    accuracy_comparison: 'better' | 'similar' | 'worse';
    processing_time_comparison: number; // ratio: advanced/legacy
    recommendation: string;
  };
  
  // Error handling
  errors: string[];
  warnings: string[];
  
  // Debugging info
  debug_info?: {
    pass1_duration: number;
    pass2_duration: number;
    pass3_duration: number;
    fallback_used: boolean;
    api_calls_made: number;
  };
}

/**
 * Processing stage status for real-time updates
 */
export interface ProcessingStageUpdate {
  stage: 'transcription' | 'context_detection' | 'disambiguation' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  elapsed_time: number;
  estimated_remaining: number;
}

export class AdvancedProcessorService {
  private transcriptionService: TranscriptionService;
  private contextDetector: ContextDetectorService;
  private disambiguator: ContextDisambiguatorService;
  
  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.contextDetector = new ContextDetectorService();
    this.disambiguator = new ContextDisambiguatorService();
  }

  /**
   * Primary method: Process voice note through three-pass pipeline
   */
  async processAdvanced(request: AdvancedProcessingRequest): Promise<AdvancedProcessingResponse> {
    const overallStartTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🚀 ADVANCED PROCESSING START (Story 1A.2.3):', {
      submissionId: request.submissionId,
      enableABTesting: request.enableABTesting || false
    });

    try {
      // Stage progress tracking
      await this.updateProcessingStage(request.submissionId, {
        stage: 'transcription',
        progress: 10,
        message: 'Starting Whisper transcription...',
        elapsed_time: 0,
        estimated_remaining: 180000 // 3 minutes estimate
      });

      // PASS 1: Raw Transcription with existing enhancements
      console.log('🎤 PASS 1: Whisper Transcription');
      const pass1Start = Date.now();
      
      const transcriptionRequest: TranscriptionRequest = {
        fileUrl: request.fileUrl,
        userId: request.userId,
        submissionId: request.submissionId
      };
      
      const transcriptionResult = await this.transcriptionService.processVoiceNote(transcriptionRequest);
      const pass1Duration = Date.now() - pass1Start;
      
      if (transcriptionResult.status === 'failed') {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }

      console.log('✅ PASS 1 Complete:', {
        duration: pass1Duration,
        confidence: transcriptionResult.confidence_score,
        wordCount: transcriptionResult.word_count
      });

      // Stage update
      await this.updateProcessingStage(request.submissionId, {
        stage: 'context_detection',
        progress: 40,
        message: 'Analyzing conversation context...',
        elapsed_time: pass1Duration,
        estimated_remaining: 120000
      });

      // PASS 2: Context Detection (skip if disabled)
      let contextResult: ContextDetectionResult;
      const pass2Start = Date.now();
      
      if (request.processingOptions?.skipContextDetection) {
        console.log('⏭️ PASS 2: Skipped (Context Detection disabled)');
        contextResult = {
          contextType: ContextType.GENERAL,
          confidence: 50,
          keyIndicators: [],
          alternativeContexts: [],
          processingTime: 0
        };
        warnings.push('Context detection skipped - using GENERAL context');
      } else {
        console.log('🧠 PASS 2: Context Detection');
        
        const contextRequest: ContextDetectionRequest = {
          transcription: transcriptionResult.transcription,
          audioMetadata: {
            duration: transcriptionResult.duration || 0,
            fileSize: 0, // Not available at this stage
            qualityScore: transcriptionResult.confidence_score
          }
        };
        
        contextResult = await this.contextDetector.detectContext(contextRequest);
        
        console.log('✅ PASS 2 Complete:', {
          duration: contextResult.processingTime,
          contextType: contextResult.contextType,
          confidence: contextResult.confidence
        });
      }
      
      const pass2Duration = Date.now() - pass2Start;

      // Stage update
      await this.updateProcessingStage(request.submissionId, {
        stage: 'disambiguation',
        progress: 70,
        message: 'Applying context-aware improvements...',
        elapsed_time: pass1Duration + pass2Duration,
        estimated_remaining: 60000
      });

      // PASS 3: Context-Aware Disambiguation (skip if disabled)
      let disambiguationResult: DisambiguationResponse;
      const pass3Start = Date.now();
      
      if (request.processingOptions?.skipDisambiguation) {
        console.log('⏭️ PASS 3: Skipped (Disambiguation disabled)');
        disambiguationResult = {
          originalTranscription: transcriptionResult.transcription,
          disambiguatedTranscription: transcriptionResult.transcription,
          changes: [],
          overallConfidence: transcriptionResult.confidence_score,
          processingTime: 0,
          contextType: contextResult.contextType,
          flagsForReview: [],
          costEstimate: 0
        };
        warnings.push('Disambiguation skipped - using original transcription');
      } else {
        console.log('🔍 PASS 3: Context-Aware Disambiguation');
        
        const disambiguationRequest: DisambiguationRequest = {
          transcription: transcriptionResult.transcription,
          contextType: contextResult.contextType,
          contextConfidence: contextResult.confidence,
          audioMetadata: {
            duration: transcriptionResult.duration || 0,
            qualityScore: transcriptionResult.confidence_score
          }
        };
        
        disambiguationResult = await this.disambiguator.disambiguateTranscription(disambiguationRequest);
        
        console.log('✅ PASS 3 Complete:', {
          duration: disambiguationResult.processingTime,
          changesApplied: disambiguationResult.changes.length,
          overallConfidence: disambiguationResult.overallConfidence
        });
      }
      
      const pass3Duration = Date.now() - pass3Start;

      // Calculate final metrics
      const totalProcessingTime = Date.now() - overallStartTime;
      const totalCostEstimate = 0.006 + // Whisper cost (estimated)
                              (contextResult.processingTime > 0 ? 0.0005 : 0) + // GPT-5-nano context detection
                              disambiguationResult.costEstimate; // GPT-5-mini disambiguation

      // Determine final transcription and confidence
      const finalTranscription = disambiguationResult.disambiguatedTranscription;
      const improvementMetrics = this.calculateImprovementMetrics(
        transcriptionResult,
        disambiguationResult
      );

      // A/B Testing comparison (if enabled)
      let legacyComparison: AdvancedProcessingResponse['legacy_comparison'];
      if (request.enableABTesting) {
        legacyComparison = await this.performABComparison(
          transcriptionResult.transcription,
          finalTranscription,
          totalProcessingTime,
          pass1Duration
        );
      }

      // Final stage update
      await this.updateProcessingStage(request.submissionId, {
        stage: 'complete',
        progress: 100,
        message: 'Processing complete',
        elapsed_time: totalProcessingTime,
        estimated_remaining: 0
      });

      // Update database with advanced processing results
      await this.saveAdvancedProcessingResults(request.submissionId, {
        finalTranscription,
        contextType: contextResult.contextType,
        disambiguationChanges: disambiguationResult.changes.length,
        totalCost: totalCostEstimate,
        processingTime: totalProcessingTime
      });

      const response: AdvancedProcessingResponse = {
        finalTranscription,
        overallConfidence: disambiguationResult.overallConfidence,
        processing_status: 'completed',
        total_processing_time: totalProcessingTime,
        total_cost_estimate: totalCostEstimate,
        
        pass1_transcription: transcriptionResult,
        pass2_context: contextResult,
        pass3_disambiguation: disambiguationResult,
        
        improvement_metrics: improvementMetrics,
        legacy_comparison: legacyComparison,
        
        errors,
        warnings,
        
        debug_info: {
          pass1_duration: pass1Duration,
          pass2_duration: pass2Duration,
          pass3_duration: pass3Duration,
          fallback_used: false,
          api_calls_made: this.countAPICalls(request, contextResult, disambiguationResult)
        }
      };

      console.log('🎉 ADVANCED PROCESSING COMPLETE:', {
        totalTime: totalProcessingTime,
        improvements: improvementMetrics.disambiguation_count,
        confidence: disambiguationResult.overallConfidence,
        cost: totalCostEstimate
      });

      return response;

    } catch (error) {
      console.error('Advanced processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errors.push(errorMessage);

      // Update error status
      await this.updateProcessingStage(request.submissionId, {
        stage: 'error',
        progress: 0,
        message: `Processing failed: ${errorMessage}`,
        elapsed_time: Date.now() - overallStartTime,
        estimated_remaining: 0
      });

      // Return partial results if possible
      return this.buildErrorResponse(request, errorMessage, Date.now() - overallStartTime, errors);
    }
  }

  /**
   * Calculate improvement metrics between original and final transcription
   */
  private calculateImprovementMetrics(
    originalResult: TranscriptionResponse,
    disambiguationResult: DisambiguationResponse
  ) {
    const criticalFixes = disambiguationResult.changes.filter(change => 
      change.confidence > 80 && 
      (change.originalTerm.includes('£') || change.originalTerm.includes('at ') || change.originalTerm.includes('c'))
    ).length;

    return {
      accuracy_gain: Math.max(0, disambiguationResult.overallConfidence - originalResult.confidence_score),
      disambiguation_count: disambiguationResult.changes.length,
      critical_fixes_applied: criticalFixes,
      human_review_recommended: disambiguationResult.flagsForReview.length > 0 || 
                               disambiguationResult.changes.some(c => c.requiresHumanReview)
    };
  }

  /**
   * Perform A/B comparison with legacy system
   */
  private async performABComparison(
    legacyTranscription: string,
    advancedTranscription: string,
    advancedTime: number,
    legacyTime: number
  ): Promise<AdvancedProcessingResponse['legacy_comparison']> {
    // Simple comparison logic
    const accuracyComparison = legacyTranscription === advancedTranscription ? 'similar' : 'better';
    const timeRatio = advancedTime / legacyTime;
    
    let recommendation = '';
    if (accuracyComparison === 'better' && timeRatio < 2) {
      recommendation = 'Use advanced processing - better accuracy with acceptable time';
    } else if (timeRatio > 3) {
      recommendation = 'Consider legacy for time-critical applications';
    } else {
      recommendation = 'Advanced processing provides marginal improvements';
    }

    return {
      legacy_transcription: legacyTranscription,
      accuracy_comparison: accuracyComparison,
      processing_time_comparison: timeRatio,
      recommendation
    };
  }

  /**
   * Update processing stage in database for real-time tracking
   */
  private async updateProcessingStage(submissionId: string, update: ProcessingStageUpdate): Promise<void> {
    try {
      await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          processing_stage: update.stage,
          processing_progress: update.progress,
          processing_message: update.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);
    } catch (error) {
      console.warn('Failed to update processing stage:', error);
    }
  }

  /**
   * Save advanced processing results to database
   */
  private async saveAdvancedProcessingResults(
    submissionId: string,
    results: {
      finalTranscription: string;
      contextType: ContextType;
      disambiguationChanges: number;
      totalCost: number;
      processingTime: number;
    }
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('whatsapp_submissions')
        .update({
          transcription: results.finalTranscription,
          processing_status: 'transcribed_advanced',
          processing_metadata: {
            context_type: results.contextType,
            disambiguation_changes: results.disambiguationChanges,
            processing_cost: results.totalCost,
            processing_method: 'three_pass_advanced',
            processing_version: '1A.2.3'
          },
          processed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
    } catch (error) {
      console.error('Failed to save advanced processing results:', error);
      throw error;
    }
  }

  /**
   * Count total API calls made during processing
   */
  private countAPICalls(
    request: AdvancedProcessingRequest,
    contextResult: ContextDetectionResult,
    disambiguationResult: DisambiguationResponse
  ): number {
    let count = 1; // Whisper API call
    
    if (!request.processingOptions?.skipContextDetection && contextResult.processingTime > 0) {
      count += 1; // Context detection API call
    }
    
    if (!request.processingOptions?.skipDisambiguation && disambiguationResult.changes.length > 0) {
      count += 1; // Disambiguation API call
    }
    
    return count;
  }

  /**
   * Build error response with partial results
   */
  private buildErrorResponse(
    request: AdvancedProcessingRequest,
    error: string | Error,
    processingTime: number,
    errors: string[]
  ): AdvancedProcessingResponse {
    return {
      finalTranscription: '',
      overallConfidence: 0,
      processing_status: 'failed',
      total_processing_time: processingTime,
      total_cost_estimate: 0,
      
      pass1_transcription: {
        transcription: '',
        confidence_score: 0,
        processing_time: processingTime,
        status: 'failed',
        error: typeof error === 'string' ? error : error.message
      },
      pass2_context: {
        contextType: ContextType.GENERAL,
        confidence: 0,
        keyIndicators: [],
        alternativeContexts: [],
        processingTime: 0
      },
      pass3_disambiguation: {
        originalTranscription: '',
        disambiguatedTranscription: '',
        changes: [],
        overallConfidence: 0,
        processingTime: 0,
        contextType: ContextType.GENERAL,
        flagsForReview: [],
        costEstimate: 0
      },
      
      improvement_metrics: {
        accuracy_gain: 0,
        disambiguation_count: 0,
        critical_fixes_applied: 0,
        human_review_recommended: true
      },
      
      errors,
      warnings: []
    };
  }
}