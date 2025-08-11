/**
 * QA Accuracy Validation Framework
 * Target: 85% transcription accuracy for Irish construction audio
 * 
 * Senior QA Review: This test suite validates the critical accuracy requirements
 * for real-world Irish construction site transcriptions.
 */

import fs from 'fs';
import path from 'path';
import { SimpleTranscriptionService } from '../lib/services/simple-transcription.service';

// Test data with expected transcriptions for Irish construction scenarios
const IRISH_CONSTRUCTION_TEST_CASES = [
  {
    audioFile: 'tom-ballymun-free.mp3',
    expectedKeywords: [
      'Ballymun', 'concrete', 'delivery', 'site', 'morning'
    ],
    criticalPhrases: [
      { phrase: 'Ballymun', alternatives: ['Ballymune', 'Bally moon'] },
      { phrase: 'concrete', alternatives: ['concrete delivery', 'ready mix'] },
      { phrase: 'euros', alternatives: ['pounds', '€'] }
    ],
    expectedContext: 'construction_material_order'
  },
  {
    audioFile: 'tom-ballymun-same.mp3',
    expectedKeywords: [
      'lads', 'hours', 'work', 'site', 'dayworks'
    ],
    criticalPhrases: [
      { phrase: 'dayworks', alternatives: ['day works', 'day work'] },
      { phrase: 'knocked off', alternatives: ['knocked off at'] },
      { phrase: 'half 5', alternatives: ['5:30', '17:30'] }
    ],
    expectedContext: 'time_tracking'
  }
];

describe('Irish Construction Accuracy Validation', () => {
  let transcriptionService: SimpleTranscriptionService;
  const audioBasePath = '../vocie-test-repo';

  beforeAll(() => {
    transcriptionService = SimpleTranscriptionService.getInstance();
    
    // Validate OpenAI API key is present
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        '❌ QA CRITICAL: OPENAI_API_KEY not found in environment. ' +
        'Set this in .env.local for testing.'
      );
    }
  });

  describe('Real Audio File Transcription Accuracy', () => {
    IRISH_CONSTRUCTION_TEST_CASES.forEach((testCase, index) => {
      it(`should achieve 85%+ accuracy for ${testCase.audioFile}`, async () => {
        // Load real audio file
        const audioPath = path.join(process.cwd(), audioBasePath, testCase.audioFile);
        
        if (!fs.existsSync(audioPath)) {
          throw new Error(`❌ QA CRITICAL: Test audio file not found: ${audioPath}`);
        }

        const audioBuffer = fs.readFileSync(audioPath);
        console.log(`🎙️ Testing ${testCase.audioFile} (${audioBuffer.length} bytes)`);

        // Transcribe with construction context
        const result = await transcriptionService.transcribeAudio(
          audioBuffer,
          testCase.audioFile,
          {
            language: 'en',
            temperature: 0.1,
            response_format: 'verbose_json'
          }
        );

        console.log(`📝 Transcription: "${result.text}"`);
        console.log(`📊 Confidence: ${result.confidence}%`);

        // QA Validation Checks
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(10);
        
        // Critical: Must achieve target confidence
        expect(result.confidence).toBeGreaterThanOrEqual(70); // Minimum baseline
        
        // Apply construction fixes
        const fixedText = transcriptionService.applyCriticalFixes(result.text);
        console.log(`🔧 After fixes: "${fixedText}"`);

        // Keyword accuracy validation
        const keywordAccuracy = calculateKeywordAccuracy(
          fixedText.toLowerCase(), 
          testCase.expectedKeywords
        );
        console.log(`🎯 Keyword accuracy: ${keywordAccuracy}%`);

        // Critical phrase accuracy
        const phraseAccuracy = calculatePhraseAccuracy(
          fixedText.toLowerCase(),
          testCase.criticalPhrases
        );
        console.log(`🎯 Phrase accuracy: ${phraseAccuracy}%`);

        // Overall accuracy target
        const overallAccuracy = (keywordAccuracy + phraseAccuracy + result.confidence) / 3;
        console.log(`📈 OVERALL ACCURACY: ${overallAccuracy.toFixed(1)}%`);

        // QA CRITICAL: Must meet 85% target
        expect(overallAccuracy).toBeGreaterThanOrEqual(85);

      }, 30000); // 30s timeout for API calls
    });
  });

  describe('Critical Error Pattern Validation', () => {
    const CRITICAL_ERROR_PATTERNS = [
      {
        input: 'concrete delivery at 30',
        expected: 'concrete delivery at 8:30',
        category: 'time_disambiguation'
      },
      {
        input: 'cost 2850 pounds',
        expected: 'cost 2850 euros',
        category: 'currency_correction'
      },
      {
        input: 'working on the forest lab',
        expected: 'working on the floor slab',
        category: 'construction_terminology'
      },
      {
        input: 'engine protection',
        expected: 'edge protection',
        category: 'safety_terminology'
      }
    ];

    CRITICAL_ERROR_PATTERNS.forEach((pattern) => {
      it(`should fix critical error: ${pattern.category}`, () => {
        const result = transcriptionService.applyCriticalFixes(pattern.input);
        
        console.log(`🔧 Pattern: ${pattern.category}`);
        console.log(`📝 Input: "${pattern.input}"`);
        console.log(`✅ Expected: "${pattern.expected}"`);
        console.log(`🎯 Result: "${result}"`);

        expect(result.toLowerCase()).toContain(
          pattern.expected.toLowerCase().split(' ').slice(-2).join(' ')
        );
      });
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should complete full transcription workflow with real audio', async () => {
      const testAudioPath = path.join(process.cwd(), audioBasePath, 'tom-ballymun-free.mp3');
      
      if (!fs.existsSync(testAudioPath)) {
        throw new Error('❌ Real audio file required for E2E testing');
      }

      console.log('🔄 Starting end-to-end workflow validation...');

      // Step 1: Load audio
      const audioBuffer = fs.readFileSync(testAudioPath);
      expect(audioBuffer.length).toBeGreaterThan(1000); // Valid audio file

      // Step 2: Transcribe
      const transcriptionResult = await transcriptionService.transcribeAudio(
        audioBuffer,
        'tom-ballymun-free.mp3'
      );

      expect(transcriptionResult.text).toBeDefined();
      expect(transcriptionResult.confidence).toBeGreaterThan(50);

      // Step 3: Apply fixes
      const fixedText = transcriptionService.applyCriticalFixes(transcriptionResult.text);
      expect(fixedText).toBeDefined();

      // Step 4: Validate business logic
      const containsConstructionTerms = 
        fixedText.toLowerCase().includes('concrete') ||
        fixedText.toLowerCase().includes('site') ||
        fixedText.toLowerCase().includes('ballymun') ||
        fixedText.toLowerCase().includes('delivery');

      expect(containsConstructionTerms).toBe(true);

      console.log('✅ End-to-end workflow validation completed successfully');

    }, 45000); // 45s timeout for full workflow
  });
});

// Helper Functions
function calculateKeywordAccuracy(text: string, expectedKeywords: string[]): number {
  const foundKeywords = expectedKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  return (foundKeywords.length / expectedKeywords.length) * 100;
}

function calculatePhraseAccuracy(text: string, criticalPhrases: any[]): number {
  let totalScore = 0;
  
  criticalPhrases.forEach(({ phrase, alternatives }) => {
    const mainPhrase = phrase.toLowerCase();
    const altPhrases = alternatives.map((alt: string) => alt.toLowerCase());
    
    if (text.includes(mainPhrase)) {
      totalScore += 100; // Perfect match
    } else {
      // Check alternatives
      const altMatch = altPhrases.some((alt: string) => text.includes(alt));
      if (altMatch) {
        totalScore += 70; // Partial credit for alternatives
      }
    }
  });
  
  return criticalPhrases.length > 0 ? totalScore / criticalPhrases.length : 0;
}

// QA Reporting Helper
export function generateAccuracyReport(results: any[]) {
  console.log('\n📊 QA ACCURACY VALIDATION REPORT');
  console.log('================================');
  
  const overallAccuracy = results.reduce((sum, result) => sum + result.accuracy, 0) / results.length;
  
  console.log(`🎯 Overall Accuracy: ${overallAccuracy.toFixed(1)}%`);
  console.log(`✅ Target Met: ${overallAccuracy >= 85 ? 'YES' : 'NO'}`);
  console.log(`🧪 Total Tests: ${results.length}`);
  console.log(`📈 Above 85%: ${results.filter(r => r.accuracy >= 85).length}`);
  
  return {
    overallAccuracy,
    targetMet: overallAccuracy >= 85,
    totalTests: results.length,
    passedTests: results.filter((r: any) => r.accuracy >= 85).length
  };
}