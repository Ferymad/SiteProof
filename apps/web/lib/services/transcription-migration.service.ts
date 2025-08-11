/**
 * Transcription Engine Migration Service
 * Story 1A.2.10: Smart Engine Migration with Fallback Support
 * 
 * Manages migration from OpenAI Whisper to AssemblyAI with intelligent fallbacks
 */

import { TranscriptionService } from './transcription.service';
import { AssemblyAITranscriptionService, AssemblyAIRequest, AssemblyAIResponse } from './assemblyai-transcription.service';
import { SpeechEngineBattleTestService } from './speech-engine-battle-test.service';
import { TranscriptionRequest, TranscriptionResponse } from './transcription.service';

export interface MigrationConfig {
  primaryEngine: 'whisper' | 'assemblyai';
  enableFallback: boolean;
  battleTestMode: boolean;
  costThreshold: number; // Maximum cost per transcription
  accuracyThreshold: number; // Minimum accuracy required
}

export interface MigrationStats {
  totalTranscriptions: number;
  assemblyaiSuccesses: number;
  whisperFallbacks: number;
  averageAccuracy: number;
  averageCost: number;
  criticalErrorsFixed: number;
}

export class TranscriptionMigrationService {
  private whisperService: TranscriptionService;
  private assemblyaiService: AssemblyAITranscriptionService;
  private battleTestService: SpeechEngineBattleTestService;
  
  private config: MigrationConfig = {
    primaryEngine: 'assemblyai', // Default to new engine
    enableFallback: true,
    battleTestMode: false,
    costThreshold: 0.01, // $0.01 per transcription limit
    accuracyThreshold: 85 // 85% minimum accuracy
  };
  
  private stats: MigrationStats = {
    totalTranscriptions: 0,
    assemblyaiSuccesses: 0,
    whisperFallbacks: 0,
    averageAccuracy: 0,
    averageCost: 0,
    criticalErrorsFixed: 0
  };

  constructor() {
    this.whisperService = new TranscriptionService();
    this.assemblyaiService = new AssemblyAITranscriptionService();
    this.battleTestService = new SpeechEngineBattleTestService();
  }

  /**
   * Process voice note with smart engine selection and fallback
   */
  async processVoiceNote(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    console.log('🔄 Migration Service Processing (Story 1A.2.10):', {
      primaryEngine: this.config.primaryEngine,
      fallbackEnabled: this.config.enableFallback,
      submissionId: request.submissionId
    });
    
    this.stats.totalTranscriptions++;
    
    // Battle test mode: Compare engines side by side
    if (this.config.battleTestMode) {
      return await this.runBattleTest(request);
    }
    
    // Production mode: Primary engine with fallback
    return await this.runWithFallback(request);
  }

  /**
   * Run battle test comparing engines
   */
  private async runBattleTest(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    console.log('⚔️ Battle Test Mode: Comparing engines...');
    
    try {
      const battleResults = await this.battleTestService.runBattleTest();
      
      // Use winner for this transcription
      if (battleResults.winner === 'AssemblyAI') {
        const result = await this.processWithAssemblyAI(request);
        result.transcription += `\n\n[BATTLE TEST: AssemblyAI won - ${battleResults.recommendation}]`;
        return result;
      } else if (battleResults.winner === 'Deepgram') {
        // Note: Deepgram not implemented yet, fallback to AssemblyAI
        const result = await this.processWithAssemblyAI(request);
        result.transcription += `\n\n[BATTLE TEST: Deepgram won but using AssemblyAI fallback]`;
        return result;
      } else {
        // Whisper or no winner
        const result = await this.processWithWhisper(request);
        result.transcription += `\n\n[BATTLE TEST: ${battleResults.winner} - ${battleResults.recommendation}]`;
        return result;
      }
    } catch (error) {
      console.error('Battle test failed, using primary engine:', error);
      return await this.runWithFallback(request);
    }
  }

  /**
   * Run with primary engine and intelligent fallback
   */
  private async runWithFallback(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    if (this.config.primaryEngine === 'assemblyai') {
      return await this.runAssemblyAIWithFallback(request);
    } else {
      return await this.runWhisperWithUpgrade(request);
    }
  }

  /**
   * Run AssemblyAI with Whisper fallback on failure
   */
  private async runAssemblyAIWithFallback(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    try {
      console.log('🚀 Attempting AssemblyAI (primary engine)...');
      const result = await this.processWithAssemblyAI(request);
      
      // Check if result meets quality thresholds
      if (this.validateResult(result)) {
        this.stats.assemblyaiSuccesses++;
        console.log('✅ AssemblyAI success:', {
          accuracy: result.confidence_score,
          cost: (result as any).cost || 'unknown',
          processingTime: result.processing_time
        });
        return result;
      } else {
        throw new Error(`AssemblyAI result below quality threshold (accuracy: ${result.confidence_score}%)`);
      }
      
    } catch (error) {
      console.warn('⚠️ AssemblyAI failed, falling back to Whisper:', error);
      
      if (this.config.enableFallback) {
        this.stats.whisperFallbacks++;
        const fallbackResult = await this.processWithWhisper(request);
        
        // Mark as fallback in response
        fallbackResult.transcription += '\n\n[Note: Processed with backup system due to technical issues]';
        
        console.log('🔄 Whisper fallback completed:', {
          accuracy: fallbackResult.confidence_score,
          processingTime: fallbackResult.processing_time
        });
        
        return fallbackResult;
      } else {
        throw error;
      }
    }
  }

  /**
   * Run Whisper with upgrade suggestion
   */
  private async runWhisperWithUpgrade(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    console.log('🔄 Using Whisper (legacy engine)...');
    
    const result = await this.processWithWhisper(request);
    
    // Suggest upgrade if accuracy is low
    if (result.confidence_score < this.config.accuracyThreshold) {
      result.transcription += '\n\n[Note: Consider upgrading to our enhanced transcription system for better accuracy]';
    }
    
    return result;
  }

  /**
   * Process with AssemblyAI
   */
  private async processWithAssemblyAI(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const assemblyAIRequest: AssemblyAIRequest = {
      fileUrl: request.fileUrl,
      userId: request.userId,
      submissionId: request.submissionId
    };
    
    const result = await this.assemblyaiService.processVoiceNote(assemblyAIRequest);
    
    // Convert AssemblyAI response to standard format
    const standardResponse: TranscriptionResponse = {
      transcription: result.transcription,
      confidence_score: result.confidence_score,
      processing_time: result.processing_time,
      status: result.status,
      error: result.error,
      word_count: result.word_count,
      duration: result.duration,
      // Add AssemblyAI-specific metadata
      ...(result.construction_terms_found && {
        construction_terms_found: result.construction_terms_found
      }),
      ...(result.critical_errors_fixed && {
        critical_errors_fixed: result.critical_errors_fixed
      }),
      ...(result.cost && {
        transcription_cost: result.cost
      })
    };
    
    // Update stats
    if (result.critical_errors_fixed) {
      this.stats.criticalErrorsFixed += result.critical_errors_fixed.length;
    }
    
    return standardResponse;
  }

  /**
   * Process with Whisper (legacy system)
   */
  private async processWithWhisper(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    return await this.whisperService.processVoiceNote(request);
  }

  /**
   * Validate transcription result meets quality thresholds
   */
  private validateResult(result: TranscriptionResponse): boolean {
    // Check accuracy threshold
    if (result.confidence_score < this.config.accuracyThreshold) {
      console.log(`❌ Accuracy below threshold: ${result.confidence_score}% < ${this.config.accuracyThreshold}%`);
      return false;
    }
    
    // Check cost threshold if available
    const cost = (result as any).transcription_cost;
    if (cost && cost > this.config.costThreshold) {
      console.log(`❌ Cost above threshold: $${cost} > $${this.config.costThreshold}`);
      return false;
    }
    
    // Check for empty transcription
    if (!result.transcription || result.transcription.trim().length === 0) {
      console.log('❌ Empty transcription');
      return false;
    }
    
    return true;
  }

  /**
   * Update migration configuration
   */
  updateConfig(newConfig: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Migration config updated:', this.config);
  }

  /**
   * Get current migration statistics
   */
  getStats(): MigrationStats {
    // Calculate averages
    if (this.stats.totalTranscriptions > 0) {
      this.stats.averageAccuracy = this.stats.assemblyaiSuccesses / this.stats.totalTranscriptions * 100;
    }
    
    return { ...this.stats };
  }

  /**
   * Force migration to AssemblyAI
   */
  enableAssemblyAI(): void {
    this.updateConfig({
      primaryEngine: 'assemblyai',
      enableFallback: true
    });
    console.log('🚀 AssemblyAI enabled as primary engine with Whisper fallback');
  }

  /**
   * Revert to Whisper only
   */
  revertToWhisper(): void {
    this.updateConfig({
      primaryEngine: 'whisper',
      enableFallback: false
    });
    console.log('🔄 Reverted to Whisper-only processing');
  }

  /**
   * Enable battle test mode for comparison
   */
  enableBattleTestMode(): void {
    this.updateConfig({
      battleTestMode: true
    });
    console.log('⚔️ Battle test mode enabled - engines will be compared on each request');
  }

  /**
   * Disable battle test mode
   */
  disableBattleTestMode(): void {
    this.updateConfig({
      battleTestMode: false
    });
    console.log('🎯 Battle test mode disabled - using production engine selection');
  }

  /**
   * Get engine performance comparison
   */
  async getEngineComparison(): Promise<{
    assemblyai: { accuracy: number; cost: number; speed: number };
    whisper: { accuracy: number; cost: number; speed: number };
    recommendation: string;
  }> {
    console.log('📊 Running engine performance comparison...');
    
    const battleResults = await this.battleTestService.runBattleTest();
    
    // Extract performance metrics
    const assemblyaiResult = battleResults.results.find(r => r.engine === 'AssemblyAI');
    const whisperResult = battleResults.results.find(r => r.engine === 'Whisper');
    
    return {
      assemblyai: {
        accuracy: assemblyaiResult?.accuracy || 0,
        cost: assemblyaiResult?.cost || 0,
        speed: assemblyaiResult?.processingTime || 0
      },
      whisper: {
        accuracy: whisperResult?.accuracy || 0,
        cost: whisperResult?.cost || 0,
        speed: whisperResult?.processingTime || 0
      },
      recommendation: battleResults.recommendation
    };
  }
}