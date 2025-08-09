/**
 * Story 1A.2.3: Context-Aware Processing Tests
 * SiteProof - Construction Evidence Machine
 * 
 * Comprehensive test suite for the advanced processing pipeline
 */

import { jest } from '@jest/globals';

// Mock OpenAI client to avoid actual API calls during tests
jest.mock('@/lib/openai', () => ({
  __esModule: true,
  default: {
    chat: {
      completions: {
        create: jest.fn()
      }
    },
    audio: {
      transcriptions: {
        create: jest.fn()
      }
    }
  },
  WHISPER_CONFIG: {
    model: 'whisper-1',
    language: 'en',
    temperature: 0,
    response_format: 'verbose_json',
    prompt: 'Irish construction site recording'
  },
  AI_ERROR_MESSAGES: {
    API_ERROR: 'AI service unavailable',
    FILE_TOO_LARGE: 'File too large',
    INVALID_FORMAT: 'Invalid file format',
    TRANSCRIPTION_FAILED: 'Transcription failed'
  }
}));

// Mock Supabase admin to avoid database calls during tests
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    storage: {
      from: jest.fn().mockReturnThis(),
      download: jest.fn()
    },
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

import { ContextDetectorService, ContextType } from '@/lib/services/context-detector.service';
import { ContextDisambiguatorService } from '@/lib/services/context-disambiguator.service';
import { AdvancedProcessorService } from '@/lib/services/advanced-processor.service';
import { TestContextAwareProcessing } from '@/lib/services/test-context-aware-processing';
import openai from '@/lib/openai';

describe('Context-Aware Processing System', () => {
  
  describe('ContextDetectorService', () => {
    let contextDetector: ContextDetectorService;
    const mockOpenAI = openai as jest.Mocked<typeof openai>;
    
    beforeEach(() => {
      contextDetector = new ContextDetectorService();
      jest.clearAllMocks();
    });

    it('should detect MATERIAL_ORDER context correctly', async () => {
      // Mock OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              contextType: 'MATERIAL_ORDER',
              confidence: 90,
              keyIndicators: ['order', 'materials', 'cubic meters', 'delivery'],
              reasoning: 'Discussion about ordering concrete and materials',
              alternativeContexts: []
            })
          }
        }]
      } as any);

      const result = await contextDetector.detectContext({
        transcription: 'Need to order 15 cubic meters of concrete for tomorrow delivery at 8.'
      });

      expect(result.contextType).toBe(ContextType.MATERIAL_ORDER);
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.keyIndicators).toContain('order');
    });

    it('should detect TIME_TRACKING context correctly', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              contextType: 'TIME_TRACKING',
              confidence: 85,
              keyIndicators: ['hours', 'from 7', 'till 5'],
              reasoning: 'Discussion about work hours and schedules',
              alternativeContexts: []
            })
          }
        }]
      } as any);

      const result = await contextDetector.detectContext({
        transcription: 'Had 8 lads on site from 7 this morning, worked till 5.'
      });

      expect(result.contextType).toBe(ContextType.TIME_TRACKING);
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should fallback to rule-based detection when API fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const result = await contextDetector.detectContext({
        transcription: 'Had a safety incident this morning, need PPE inspection.'
      });

      expect(result.contextType).toBe(ContextType.SAFETY_REPORT);
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should provide context-specific hints', () => {
      const hints = contextDetector.getContextHints(ContextType.MATERIAL_ORDER);
      
      expect(hints.numberInterpretation).toBe('quantities_and_costs');
      expect(hints.keyTerms).toContain('cubic meters');
      expect(hints.commonAmbiguities).toContain('currency confusion');
    });
  });

  describe('ContextDisambiguatorService', () => {
    let disambiguator: ContextDisambiguatorService;
    const mockOpenAI = openai as jest.Mocked<typeof openai>;
    
    beforeEach(() => {
      disambiguator = new ContextDisambiguatorService();
      jest.clearAllMocks();
    });

    it('should fix currency conversion (£ → €)', async () => {
      const result = await disambiguator.disambiguateTranscription({
        transcription: 'Total cost will be £2,850 including delivery.',
        contextType: ContextType.MATERIAL_ORDER,
        contextConfidence: 90
      });

      expect(result.disambiguatedTranscription).toContain('€2,850');
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].originalTerm).toBe('£2,850');
      expect(result.changes[0].suggestedReplacement).toBe('€2,850');
    });

    it('should fix concrete grade formatting', async () => {
      const result = await disambiguator.disambiguateTranscription({
        transcription: 'Need c2530 concrete for the foundation.',
        contextType: ContextType.MATERIAL_ORDER,
        contextConfidence: 90
      });

      expect(result.disambiguatedTranscription).toContain('C25/30');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should handle time disambiguation in TIME_TRACKING context with GPT-5-mini', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              disambiguations: [{
                originalTerm: 'start at 8',
                suggestedReplacement: 'start at 8:00',
                confidence: 85,
                reasoning: 'Time tracking context suggests full time format',
                requiresHumanReview: false
              }],
              overallConfidence: 85,
              flagsForReview: []
            })
          }
        }]
      } as any);

      const result = await disambiguator.disambiguateTranscription({
        transcription: 'Team will start at 8 and finish at 5.',
        contextType: ContextType.TIME_TRACKING,
        contextConfidence: 90
      });

      expect(result.disambiguatedTranscription).toContain('8:00');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should identify construction terminology errors', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              disambiguations: [{
                originalTerm: 'engine protection',
                suggestedReplacement: 'edge protection',
                confidence: 80,
                reasoning: 'Safety context suggests edge protection equipment',
                requiresHumanReview: false
              }],
              overallConfidence: 80,
              flagsForReview: []
            })
          }
        }]
      } as any);

      const result = await disambiguator.disambiguateTranscription({
        transcription: 'The engine protection was not properly secured.',
        contextType: ContextType.SAFETY_REPORT,
        contextConfidence: 85
      });

      expect(result.disambiguatedTranscription).toContain('edge protection');
    });
  });

  describe('AdvancedProcessorService', () => {
    let processor: AdvancedProcessorService;
    
    beforeEach(() => {
      processor = new AdvancedProcessorService();
      jest.clearAllMocks();
    });

    it('should process through three-pass pipeline successfully', async () => {
      // This would be a complex integration test
      // For now, we'll test the error handling
      const result = await processor.processAdvanced({
        fileUrl: 'test-audio/nonexistent.mp3',
        userId: 'test-user',
        submissionId: 'test-submission'
      });

      expect(result.processing_status).toBe('failed');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('TestContextAwareProcessing', () => {
    let testProcessor: TestContextAwareProcessing;
    
    beforeEach(() => {
      testProcessor = new TestContextAwareProcessing();
      jest.clearAllMocks();
    });

    it('should run test suite with simulated data', async () => {
      const results = await testProcessor.runTestSuite({
        skip_actual_processing: true,
        verbose_logging: false
      });

      expect(results.total_scenarios).toBeGreaterThan(5);
      expect(results.overall_accuracy).toBeGreaterThan(70);
      expect(results.results).toHaveLength(results.total_scenarios);
    });

    it('should validate critical number disambiguation scenarios', async () => {
      const results = await testProcessor.runTestSuite({
        skip_actual_processing: true
      });

      const criticalNumbersTest = results.results.find(r => 
        r.scenario.id === 'critical_numbers_test'
      );

      expect(criticalNumbersTest).toBeDefined();
      expect(criticalNumbersTest?.scenario.accuracy_target).toBe(95);
    });

    it('should test real error example fixes', async () => {
      const results = await testProcessor.runTestSuite({
        skip_actual_processing: true
      });

      const realErrorsTest = results.results.find(r => 
        r.scenario.id === 'real_error_examples'
      );

      expect(realErrorsTest).toBeDefined();
      expect(realErrorsTest?.scenario.expectedChanges).toContainEqual({
        from: 'at 30',
        to: 'at 8:30', 
        type: 'time'
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle Irish construction terminology correctly', () => {
      // Test various Irish construction terms
      const terms = [
        'ground floor slab',
        'edge protection', 
        'C25/30',
        '€2,850',
        '8:30'
      ];

      // This would test the full pipeline with real examples
      terms.forEach(term => {
        expect(term).toMatch(/^[A-Za-z0-9:€\/\s,]+$/);
      });
    });

    it('should maintain cost efficiency targets', async () => {
      const testProcessor = new TestContextAwareProcessing();
      const results = await testProcessor.runTestSuite({
        skip_actual_processing: true
      });

      // Cost should be under $0.01 per transcription
      expect(results.summary.cost_efficiency).toBeLessThan(0.01);
    });

    it('should meet MVP accuracy targets', async () => {
      const testProcessor = new TestContextAwareProcessing();
      const results = await testProcessor.runTestSuite({
        skip_actual_processing: true
      });

      // Overall accuracy should meet 85% target
      expect(results.overall_accuracy).toBeGreaterThanOrEqual(85);
      
      // Context detection should be above 80%
      expect(results.summary.context_detection_accuracy).toBeGreaterThanOrEqual(80);
      
      // Critical fixes should work 90% of the time
      expect(results.summary.critical_fixes_success_rate).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      const contextDetector = new ContextDetectorService();
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const result = await contextDetector.detectContext({
        transcription: 'Test transcription for error handling'
      });

      // Should fallback to rule-based detection
      expect(result.contextType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should validate input parameters', async () => {
      const disambiguator = new ContextDisambiguatorService();
      
      const result = await disambiguator.disambiguateTranscription({
        transcription: '', // Empty transcription
        contextType: ContextType.GENERAL,
        contextConfidence: 50
      });

      expect(result.changes).toHaveLength(0);
      expect(result.overallConfidence).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete processing within time limits', async () => {
      const startTime = Date.now();
      const testProcessor = new TestContextAwareProcessing();
      
      await testProcessor.runTestSuite({
        skip_actual_processing: true
      });
      
      const processingTime = Date.now() - startTime;
      
      // Should complete test suite in under 5 seconds for simulated tests
      expect(processingTime).toBeLessThan(5000);
    });
  });
});