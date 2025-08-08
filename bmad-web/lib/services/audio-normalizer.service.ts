/**
 * Story 1A.2.1: Audio Normalizer Service
 * SiteProof - Construction Evidence Machine
 * 
 * Normalizes audio for consistent Whisper processing
 * Converts to mono 16kHz WAV format with normalized gain
 */

export interface AudioNormalizationResult {
  normalizedBlob: Blob;
  originalSize: number;
  normalizedSize: number;
  processingTime: number;
  format: {
    channels: number;
    sampleRate: number;
    bitDepth: number;
  };
}

export class AudioNormalizerService {
  /**
   * Normalize audio for optimal Whisper transcription
   * Converts to mono 16kHz WAV with consistent volume
   */
  async normalizeAudio(audioBlob: Blob, fileName: string): Promise<AudioNormalizationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎵 Starting audio normalization:', {
        originalSize: audioBlob.size,
        fileName,
        type: audioBlob.type
      });
      
      // For now, implement client-side audio normalization using Web Audio API
      // In production, this could be replaced with ffmpeg server-side processing
      const normalizedBlob = await this.normalizeWithWebAudio(audioBlob);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      const result: AudioNormalizationResult = {
        normalizedBlob,
        originalSize: audioBlob.size,
        normalizedSize: normalizedBlob.size,
        processingTime,
        format: {
          channels: 1, // Mono
          sampleRate: 16000, // 16kHz
          bitDepth: 16
        }
      };
      
      console.log('🎵 Audio normalization complete:', {
        originalSize: result.originalSize,
        normalizedSize: result.normalizedSize,
        processingTime: result.processingTime,
        compressionRatio: (result.normalizedSize / result.originalSize).toFixed(2)
      });
      
      return result;
      
    } catch (error: any) {
      console.error('Audio normalization failed:', error);
      
      // Fallback: return original blob if normalization fails
      console.log('🎵 Falling back to original audio blob');
      return {
        normalizedBlob: audioBlob,
        originalSize: audioBlob.size,
        normalizedSize: audioBlob.size,
        processingTime: (Date.now() - startTime) / 1000,
        format: {
          channels: 2, // Unknown, assume stereo
          sampleRate: 44100, // Unknown, assume CD quality
          bitDepth: 16
        }
      };
    }
  }
  
  /**
   * Normalize audio using Web Audio API
   * Converts to mono 16kHz with volume normalization
   */
  private async normalizeWithWebAudio(audioBlob: Blob): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.log('🎵 Server-side environment, returning original blob');
      return audioBlob;
    }
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a new buffer for normalized audio (mono, 16kHz)
      const targetSampleRate = 16000;
      const targetChannels = 1;
      const normalizedBuffer = audioContext.createBuffer(
        targetChannels,
        Math.floor(audioBuffer.duration * targetSampleRate),
        targetSampleRate
      );
      
      // Mix down to mono if stereo
      const sourceData = audioBuffer.getChannelData(0); // Left channel
      const sourceData2 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null; // Right channel
      
      // Resample and normalize
      const targetData = normalizedBuffer.getChannelData(0);
      const ratio = audioBuffer.sampleRate / targetSampleRate;
      
      let maxAmplitude = 0;
      
      // First pass: downsample and find max amplitude
      for (let i = 0; i < targetData.length; i++) {
        const sourceIndex = Math.floor(i * ratio);
        if (sourceIndex < sourceData.length) {
          let sample = sourceData[sourceIndex];
          
          // Mix stereo to mono
          if (sourceData2) {
            sample = (sample + sourceData2[sourceIndex]) / 2;
          }
          
          targetData[i] = sample;
          maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
        }
      }
      
      // Second pass: normalize amplitude
      if (maxAmplitude > 0 && maxAmplitude < 0.95) {
        const normalizationFactor = 0.8 / maxAmplitude; // Target 80% of max to avoid clipping
        for (let i = 0; i < targetData.length; i++) {
          targetData[i] *= normalizationFactor;
        }
      }
      
      // Convert to WAV blob
      const wavBlob = this.audioBufferToWav(normalizedBuffer);
      audioContext.close();
      
      return wavBlob;
      
    } catch (error) {
      console.error('Web Audio API normalization failed:', error);
      throw error;
    }
  }
  
  /**
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const int16 = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, int16 < 0 ? int16 * 0x8000 : int16 * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  /**
   * Analyze audio quality for routing decisions
   */
  async analyzeAudioQuality(audioBlob: Blob): Promise<{
    quality: 'high' | 'medium' | 'low';
    score: number;
    duration?: number;
    fileSize: number;
    estimatedBitrate?: number;
  }> {
    try {
      const fileSize = audioBlob.size;
      
      // Basic quality assessment based on file size and duration
      // In production, this could use more sophisticated audio analysis
      
      let quality: 'high' | 'medium' | 'low' = 'medium';
      let score = 70;
      
      // Size-based quality estimation
      if (fileSize < 50000) { // < 50KB
        quality = 'low';
        score = 40;
      } else if (fileSize > 500000) { // > 500KB
        quality = 'high';
        score = 85;
      }
      
      // For audio files, we can estimate duration from size
      // This is rough but useful for routing decisions
      const estimatedBitrate = fileSize * 8 / 60; // Assume 1-minute average
      const duration = estimatedBitrate > 0 ? (fileSize * 8) / estimatedBitrate : 60;
      
      return {
        quality,
        score,
        duration,
        fileSize,
        estimatedBitrate
      };
      
    } catch (error) {
      console.error('Audio quality analysis failed:', error);
      return {
        quality: 'medium',
        score: 50,
        fileSize: audioBlob.size
      };
    }
  }
}