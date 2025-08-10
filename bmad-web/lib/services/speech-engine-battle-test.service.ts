/**
 * Speech Engine Battle Test Service
 * Story 1A.2.10: Speech-to-Text Engine Migration
 * 
 * Tests AssemblyAI vs Deepgram vs Current Whisper
 * Measures accuracy, cost, and processing time for construction voice notes
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import openai, { WHISPER_CONFIG } from '@/lib/openai';

// Battle Test Configuration
interface BattleTestConfig {
  constructionVocabulary: string[];
  testAudioSamples: string[]; // Supabase file paths
  accuracyThreshold: number; // 85%+ required
  costThreshold: number; // <$0.01 per transcription
}

interface BattleTestResult {
  engine: string;
  accuracy: number;
  cost: number;
  processingTime: number;
  samples: TestSample[];
  constructionTermsRecognized: number;
  criticalErrorsFixed: string[];
}

interface TestSample {
  audioFile: string;
  groundTruth: string; // Manual transcription
  engineResult: string;
  accuracy: number;
  processingTime: number;
  cost: number;
  constructionTermsFound: string[];
  criticalErrors: string[];
}

export class SpeechEngineBattleTestService {
  private config: BattleTestConfig = {
    constructionVocabulary: [
      // Critical time references (MVP blocker)
      'at thirty', 'at 8:30', 'nine thirty', 'ten fifteen',
      
      // Safety critical terms 
      'safe working', 'PPE', 'hazard', 'scaffold', 'hard hat',
      
      // Irish construction materials
      '804 stone', '6F2 aggregate', 'DPC', 'formwork', 'rebar',
      
      // Concrete & materials
      'C25/30', 'C30/37', 'ready-mix', 'cubic metres',
      
      // Equipment & tools
      'pump truck', 'concrete mixer', 'vibrator', 'shuttering'
    ],
    testAudioSamples: [], // Will be populated with real samples
    accuracyThreshold: 85,
    costThreshold: 0.01
  };

  /**
   * Run complete battle test comparing all engines
   */
  async runBattleTest(): Promise<{
    winner: string;
    results: BattleTestResult[];
    recommendation: string;
  }> {
    console.log('🎯 Starting Speech Engine Battle Test (Story 1A.2.10)');
    
    // Test order based on research recommendations
    const engines = [
      { name: 'AssemblyAI', test: this.testAssemblyAI.bind(this) },
      { name: 'Deepgram', test: this.testDeepgram.bind(this) },
      { name: 'Whisper (Baseline)', test: this.testWhisper.bind(this) }
    ];
    
    const results: BattleTestResult[] = [];
    
    for (const engine of engines) {
      console.log(`\n🧪 Testing ${engine.name}...`);
      try {
        const result = await engine.test();
        results.push(result);
        
        console.log(`✅ ${engine.name} Results:`, {
          accuracy: `${result.accuracy}%`,
          cost: `$${result.cost.toFixed(5)}`,
          time: `${result.processingTime}s`,
          terms: `${result.constructionTermsRecognized}/${this.config.constructionVocabulary.length}`
        });
      } catch (error) {
        console.error(`❌ ${engine.name} failed:`, error);
        results.push({
          engine: engine.name,
          accuracy: 0,
          cost: 999,
          processingTime: 999,
          samples: [],
          constructionTermsRecognized: 0,
          criticalErrorsFixed: []
        });
      }
    }
    
    // Determine winner based on MVP criteria
    const winner = this.determineWinner(results);
    const recommendation = this.generateRecommendation(results, winner);
    
    console.log('\n🏆 Battle Test Complete!');
    console.log('Winner:', winner);
    console.log('Recommendation:', recommendation);
    
    return { winner, results, recommendation };
  }

  /**
   * Test AssemblyAI Universal-2 with custom vocabulary
   */
  private async testAssemblyAI(): Promise<BattleTestResult> {
    const startTime = Date.now();
    
    // AssemblyAI API configuration
    const API_KEY = process.env.ASSEMBLYAI_API_KEY;
    if (!API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY not configured');
    }
    
    const samples: TestSample[] = [];
    let totalCost = 0;
    let totalAccuracy = 0;
    let constructionTermsFound = 0;
    
    // Use sample construction voice notes
    const testSamples = await this.getTestSamples();
    
    for (const sample of testSamples) {
      const sampleStart = Date.now();
      
      try {
        // Upload audio to AssemblyAI
        const audioFile = await this.getFileFromStorage(sample.audioFile);
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            'Authorization': API_KEY
          },
          body: audioFile
        });
        
        const { upload_url } = await uploadResponse.json();
        
        // Start transcription with construction vocabulary
        const transcriptRequest = {
          audio_url: upload_url,
          word_boost: this.config.constructionVocabulary,
          boost_param: 'high', // Maximum boost for construction terms
          speaker_labels: false,
          disfluencies: false,
          punctuate: true,
          format_text: true
        };
        
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transcriptRequest)
        });
        
        const { id } = await transcriptResponse.json();
        
        // Poll for completion
        let transcript = null;
        let pollAttempts = 0;
        const maxAttempts = 30;
        
        while (!transcript && pollAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { 'Authorization': API_KEY }
          });
          
          const result = await pollResponse.json();
          
          if (result.status === 'completed') {
            transcript = result;
            break;
          } else if (result.status === 'error') {
            throw new Error(`AssemblyAI error: ${result.error}`);
          }
          
          pollAttempts++;
        }
        
        if (!transcript) {
          throw new Error('AssemblyAI transcription timeout');
        }
        
        // Calculate metrics
        const processingTime = (Date.now() - sampleStart) / 1000;
        const audioDuration = transcript.audio_duration / 1000; // Convert ms to seconds
        const cost = (audioDuration / 60) * 0.0045; // $0.0045 per minute
        
        // Calculate accuracy vs ground truth
        const accuracy = this.calculateAccuracy(transcript.text, sample.groundTruth);
        
        // Check construction terms
        const foundTerms = this.findConstructionTerms(transcript.text);
        const criticalErrors = this.findCriticalErrors(transcript.text, sample.groundTruth);
        
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: transcript.text,
          accuracy,
          processingTime,
          cost,
          constructionTermsFound: foundTerms,
          criticalErrors
        });
        
        totalCost += cost;
        totalAccuracy += accuracy;
        constructionTermsFound += foundTerms.length;
        
      } catch (error) {
        console.error(`AssemblyAI sample ${sample.audioFile} failed:`, error);
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: 'TRANSCRIPTION_FAILED',
          accuracy: 0,
          processingTime: (Date.now() - sampleStart) / 1000,
          cost: 0,
          constructionTermsFound: [],
          criticalErrors: ['TRANSCRIPTION_FAILED']
        });
      }
    }
    
    return {
      engine: 'AssemblyAI',
      accuracy: totalAccuracy / testSamples.length,
      cost: totalCost / testSamples.length,
      processingTime: (Date.now() - startTime) / 1000 / testSamples.length,
      samples,
      constructionTermsRecognized: constructionTermsFound,
      criticalErrorsFixed: this.analyzeCriticalErrorFixes(samples)
    };
  }

  /**
   * Test Deepgram Nova-3 with keyterm prompting
   */
  private async testDeepgram(): Promise<BattleTestResult> {
    const startTime = Date.now();
    
    const API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!API_KEY) {
      throw new Error('DEEPGRAM_API_KEY not configured');
    }
    
    const samples: TestSample[] = [];
    let totalCost = 0;
    let totalAccuracy = 0;
    let constructionTermsFound = 0;
    
    const testSamples = await this.getTestSamples();
    
    for (const sample of testSamples) {
      const sampleStart = Date.now();
      
      try {
        const audioFile = await this.getFileFromStorage(sample.audioFile);
        
        // Build keyterm prompting URL
        const keyterms = this.config.constructionVocabulary
          .map(term => `keyterm=${encodeURIComponent(term)}`)
          .join('&');
        
        const url = `https://api.deepgram.com/v1/listen?model=nova-3&${keyterms}&punctuate=true`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${API_KEY}`,
            'Content-Type': audioFile.type || 'audio/mpeg'
          },
          body: audioFile
        });
        
        const result = await response.json();
        
        if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
          throw new Error('Deepgram returned no transcript');
        }
        
        const transcript = result.results.channels[0].alternatives[0].transcript;
        const confidence = result.results.channels[0].alternatives[0].confidence;
        
        // Calculate metrics
        const processingTime = (Date.now() - sampleStart) / 1000;
        const audioDuration = result.metadata?.duration || 30; // Default 30 seconds
        const cost = (audioDuration / 60) * 0.0043; // Nova-3 pricing
        
        const accuracy = this.calculateAccuracy(transcript, sample.groundTruth);
        const foundTerms = this.findConstructionTerms(transcript);
        const criticalErrors = this.findCriticalErrors(transcript, sample.groundTruth);
        
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: transcript,
          accuracy,
          processingTime,
          cost,
          constructionTermsFound: foundTerms,
          criticalErrors
        });
        
        totalCost += cost;
        totalAccuracy += accuracy;
        constructionTermsFound += foundTerms.length;
        
      } catch (error) {
        console.error(`Deepgram sample ${sample.audioFile} failed:`, error);
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: 'TRANSCRIPTION_FAILED',
          accuracy: 0,
          processingTime: (Date.now() - sampleStart) / 1000,
          cost: 0,
          constructionTermsFound: [],
          criticalErrors: ['TRANSCRIPTION_FAILED']
        });
      }
    }
    
    return {
      engine: 'Deepgram',
      accuracy: totalAccuracy / testSamples.length,
      cost: totalCost / testSamples.length,
      processingTime: (Date.now() - startTime) / 1000 / testSamples.length,
      samples,
      constructionTermsRecognized: constructionTermsFound,
      criticalErrorsFixed: this.analyzeCriticalErrorFixes(samples)
    };
  }

  /**
   * Test current Whisper system (baseline)
   */
  private async testWhisper(): Promise<BattleTestResult> {
    const startTime = Date.now();
    
    const samples: TestSample[] = [];
    let totalCost = 0;
    let totalAccuracy = 0;
    let constructionTermsFound = 0;
    
    const testSamples = await this.getTestSamples();
    
    for (const sample of testSamples) {
      const sampleStart = Date.now();
      
      try {
        const audioFile = await this.getFileFromStorage(sample.audioFile);
        
        const file = new File([audioFile], 'test.mp3', {
          type: audioFile.type || 'audio/mpeg'
        });
        
        const response = await openai.audio.transcriptions.create({
          file,
          model: WHISPER_CONFIG.model,
          language: WHISPER_CONFIG.language,
          temperature: WHISPER_CONFIG.temperature,
          response_format: WHISPER_CONFIG.response_format,
          prompt: WHISPER_CONFIG.prompt
        } as any);
        
        const transcript = response.text || '';
        
        // Calculate metrics
        const processingTime = (Date.now() - sampleStart) / 1000;
        const audioDuration = 30; // Estimate 30 seconds
        const cost = (audioDuration / 60) * 0.006; // Whisper pricing
        
        const accuracy = this.calculateAccuracy(transcript, sample.groundTruth);
        const foundTerms = this.findConstructionTerms(transcript);
        const criticalErrors = this.findCriticalErrors(transcript, sample.groundTruth);
        
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: transcript,
          accuracy,
          processingTime,
          cost,
          constructionTermsFound: foundTerms,
          criticalErrors
        });
        
        totalCost += cost;
        totalAccuracy += accuracy;
        constructionTermsFound += foundTerms.length;
        
      } catch (error) {
        console.error(`Whisper sample ${sample.audioFile} failed:`, error);
        samples.push({
          audioFile: sample.audioFile,
          groundTruth: sample.groundTruth,
          engineResult: 'TRANSCRIPTION_FAILED',
          accuracy: 0,
          processingTime: (Date.now() - sampleStart) / 1000,
          cost: 0,
          constructionTermsFound: [],
          criticalErrors: ['TRANSCRIPTION_FAILED']
        });
      }
    }
    
    return {
      engine: 'Whisper',
      accuracy: totalAccuracy / testSamples.length,
      cost: totalCost / testSamples.length,
      processingTime: (Date.now() - startTime) / 1000 / testSamples.length,
      samples,
      constructionTermsRecognized: constructionTermsFound,
      criticalErrorsFixed: this.analyzeCriticalErrorFixes(samples)
    };
  }

  /**
   * Get test audio samples with ground truth transcriptions
   */
  private async getTestSamples(): Promise<{ audioFile: string; groundTruth: string; }[]> {
    // For MVP testing, use key samples representing critical scenarios
    return [
      {
        audioFile: 'test-samples/irish-foreman-machinery.mp3',
        groundTruth: 'Morning lads, concrete delivery at 8:30. Safe working required around the pump truck.'
      },
      {
        audioFile: 'test-samples/polish-worker-wind.mp3', 
        groundTruth: 'Need 804 stone for the DPC. Three cubic metres should do it.'
      },
      {
        audioFile: 'test-samples/romanian-worker-drilling.mp3',
        groundTruth: 'C25/30 ready-mix arriving at ten fifteen. Check the formwork is ready.'
      }
      // Add more real samples as available
    ];
  }

  /**
   * Calculate transcription accuracy using Levenshtein distance
   */
  private calculateAccuracy(result: string, groundTruth: string): number {
    const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const normalizedResult = normalize(result);
    const normalizedTruth = normalize(groundTruth);
    
    if (normalizedTruth.length === 0) return 0;
    
    const distance = this.levenshteinDistance(normalizedResult, normalizedTruth);
    const accuracy = Math.max(0, (1 - distance / normalizedTruth.length) * 100);
    
    return Math.round(accuracy);
  }

  /**
   * Find construction terms in transcription
   */
  private findConstructionTerms(transcript: string): string[] {
    const found: string[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    for (const term of this.config.constructionVocabulary) {
      if (lowerTranscript.includes(term.toLowerCase())) {
        found.push(term);
      }
    }
    
    return found;
  }

  /**
   * Find critical errors that block MVP launch
   */
  private findCriticalErrors(result: string, groundTruth: string): string[] {
    const errors: string[] = [];
    
    // Check for critical time reference failures
    if (groundTruth.includes('8:30') && !result.includes('8:30') && result.includes('30')) {
      errors.push('TIME_CONTEXT_FAILURE: "at 30" not corrected to "at 8:30"');
    }
    
    // Check for safety term failures
    if (groundTruth.includes('safe working') && result.includes('safe farming')) {
      errors.push('SAFETY_TERM_FAILURE: "safe working" transcribed as "safe farming"');
    }
    
    // Check for material code failures
    if (groundTruth.includes('C25/30') && !result.toLowerCase().includes('c25/30')) {
      errors.push('MATERIAL_CODE_FAILURE: C25/30 not recognized');
    }
    
    return errors;
  }

  /**
   * Analyze critical error fixes across all samples
   */
  private analyzeCriticalErrorFixes(samples: TestSample[]): string[] {
    const fixes: string[] = [];
    
    for (const sample of samples) {
      if (sample.criticalErrors.length === 0) {
        fixes.push(`Fixed critical errors in ${sample.audioFile}`);
      }
    }
    
    return fixes;
  }

  /**
   * Determine winner based on MVP criteria
   */
  private determineWinner(results: BattleTestResult[]): string {
    // Filter engines that meet minimum requirements
    const qualifiedEngines = results.filter(result => 
      result.accuracy >= this.config.accuracyThreshold && 
      result.cost <= this.config.costThreshold
    );
    
    if (qualifiedEngines.length === 0) {
      return 'NO_WINNER_MEETS_REQUIREMENTS';
    }
    
    // Rank by accuracy first, then cost, then construction terms
    qualifiedEngines.sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return b.constructionTermsRecognized - a.constructionTermsRecognized;
    });
    
    return qualifiedEngines[0].engine;
  }

  /**
   * Generate implementation recommendation
   */
  private generateRecommendation(results: BattleTestResult[], winner: string): string {
    const winnerResult = results.find(r => r.engine === winner);
    
    if (!winnerResult) {
      return 'CRITICAL: No engine meets MVP requirements (85%+ accuracy, <$0.01 cost). Consider hybrid approach with human validation.';
    }
    
    return `RECOMMENDED: Migrate to ${winner} immediately. ` +
           `Achieves ${winnerResult.accuracy}% accuracy (${winnerResult.accuracy - 85}% above target) ` +
           `at $${winnerResult.cost.toFixed(5)} per transcription (${((this.config.costThreshold - winnerResult.cost) / this.config.costThreshold * 100).toFixed(1)}% under budget). ` +
           `Recognizes ${winnerResult.constructionTermsRecognized}/${this.config.constructionVocabulary.length} construction terms. ` +
           `MVP UNBLOCKED.`;
  }

  /**
   * Levenshtein distance calculation for accuracy measurement
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get file from Supabase storage
   */
  private async getFileFromStorage(fileUrl: string): Promise<Blob> {
    const { data, error } = await supabaseAdmin.storage
      .from('voice-notes')
      .download(fileUrl);
    
    if (error || !data) {
      throw new Error(`Failed to retrieve audio file: ${error?.message}`);
    }
    
    return data;
  }
}