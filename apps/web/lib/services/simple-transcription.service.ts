// Simple transcription service for MVP
// Uses OpenAI Whisper API for reliable audio transcription

import OpenAI from 'openai';
import path from 'path';

// Initialize OpenAI only if API key is available (for testing)
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI initialization failed - running in test mode');
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration?: number;
  language?: string;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

/**
 * Simple transcription service using OpenAI Whisper
 * Optimized for construction site audio with critical error patterns
 */
export class SimpleTranscriptionService {
  private static instance: SimpleTranscriptionService;
  
  public static getInstance(): SimpleTranscriptionService {
    if (!SimpleTranscriptionService.instance) {
      SimpleTranscriptionService.instance = new SimpleTranscriptionService();
    }
    return SimpleTranscriptionService.instance;
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(
    audioBuffer: Buffer | Blob | File,
    filename: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      console.log('🎙️ Starting transcription:', { filename, size: audioBuffer instanceof Buffer ? audioBuffer.length : 'unknown' });
      
      // Check if OpenAI is available
      if (!openai) {
        throw new Error('OpenAI not available - check API key configuration');
      }
      
      // Prepare file for OpenAI API
      const file = audioBuffer instanceof Buffer 
        ? new File([new Uint8Array(audioBuffer)], filename)
        : audioBuffer as File;

      // Call Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: options.language || 'en',
        prompt: options.prompt || this.getConstructionPrompt(),
        temperature: options.temperature || 0.1, // Low temperature for accuracy
        response_format: options.response_format || 'verbose_json',
      });

      // Process response based on format
      if (options.response_format === 'verbose_json' && 'segments' in transcription) {
        // Cast to any to access verbose_json properties
        const verboseResponse = transcription as any;
        const result: TranscriptionResult = {
          text: verboseResponse.text,
          confidence: this.calculateOverallConfidence(verboseResponse.segments || []),
          duration: verboseResponse.duration,
          language: verboseResponse.language,
          segments: verboseResponse.segments?.map((segment: any) => ({
            text: segment.text,
            start: segment.start,
            end: segment.end,
            confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) * 100 : undefined
          }))
        };

        console.log('✅ Transcription completed:', {
          text: result.text.substring(0, 100) + '...',
          confidence: result.confidence,
          duration: result.duration,
          segments: result.segments?.length
        });

        return result;
      } else {
        // Simple text response
        return {
          text: typeof transcription === 'string' ? transcription : transcription.text,
          confidence: 80, // Default confidence for text responses
        };
      }

    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcribe from URL (for files already uploaded to storage)
   */
  async transcribeFromUrl(audioUrl: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    try {
      console.log('🌐 Transcribing from URL:', audioUrl);
      
      // Download audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const filename = this.extractFilenameFromUrl(audioUrl);

      return await this.transcribeAudio(
        Buffer.from(audioBuffer), 
        filename, 
        options
      );

    } catch (error) {
      console.error('❌ URL transcription error:', error);
      throw new Error(`URL transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply critical fixes to transcription for construction context
   */
  applyCriticalFixes(text: string): string {
    console.log('🔧 Applying construction-specific fixes...');
    
    let fixedText = text;
    
    // Critical time fixes
    fixedText = fixedText.replace(/\bat 30\b/g, 'at 8:30');
    fixedText = fixedText.replace(/\bat 15\b/g, 'at 8:15');
    fixedText = fixedText.replace(/\bat 45\b/g, 'at 8:45');
    
    // Safety terminology
    fixedText = fixedText.replace(/safe farming/gi, 'safe working');
    fixedText = fixedText.replace(/engine protection/gi, 'edge protection');
    
    // Currency (Irish construction context)
    fixedText = fixedText.replace(/(\d+)\s*pounds?/gi, '$1 euros');
    fixedText = fixedText.replace(/£(\d+)/g, '€$1');
    
    // Location fixes (Dublin context)
    fixedText = fixedText.replace(/Ballymune/gi, 'Ballymun');
    
    // Material fixes
    fixedText = fixedText.replace(/foundation port/gi, 'foundation pour');
    
    console.log('✅ Applied critical fixes');
    return fixedText;
  }

  /**
   * Get construction-specific prompt to improve accuracy
   */
  private getConstructionPrompt(): string {
    return `This is audio from a construction site in Dublin, Ireland. 
Common terms include: concrete, steel, scaffolding, DPC (damp proof course), 
foundation pour, safe working, edge protection, Ballymun area.
Times are often in 24-hour format (8:30, 9:15, etc.).
Amounts are in euros (€).`;
  }

  /**
   * Calculate overall confidence from segments
   */
  private calculateOverallConfidence(segments: any[]): number {
    if (!segments.length) return 80;
    
    const avgLogProb = segments.reduce((sum, seg) => {
      return sum + (seg.avg_logprob || -1);
    }, 0) / segments.length;

    return Math.max(0, Math.min(100, Math.exp(avgLogProb) * 100));
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlPath = new URL(url).pathname;
      return path.basename(urlPath) || 'audio.mp3';
    } catch {
      return 'audio.mp3';
    }
  }
}