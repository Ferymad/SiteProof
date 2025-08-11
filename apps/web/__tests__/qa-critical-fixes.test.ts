/**
 * QA Critical Fixes Test Suite
 * Senior QA Engineer: Quinn
 * 
 * Tests critical error pattern fixes for Irish construction transcription
 * This suite validates fix patterns without requiring API calls
 */

import { SimpleTranscriptionService } from '../lib/services/simple-transcription.service';

describe('QA Critical Fixes Validation', () => {
  let transcriptionService: SimpleTranscriptionService;

  beforeAll(() => {
    transcriptionService = SimpleTranscriptionService.getInstance();
  });

  describe('Time Disambiguation Fixes', () => {
    const timeTestCases = [
      {
        input: 'concrete delivery at 30',
        expected: 'concrete delivery at 8:30',
        description: 'Standard morning delivery time'
      },
      {
        input: 'meeting at 15',
        expected: 'meeting at 8:15',
        description: 'Morning meeting time'
      },
      {
        input: 'pour starts at 45',
        expected: 'pour starts at 8:45',
        description: 'Construction pour time'
      }
    ];

    timeTestCases.forEach(({ input, expected, description }) => {
      it(`should fix time: ${description}`, () => {
        const result = transcriptionService.applyCriticalFixes(input);
        
        console.log(`🕒 ${description}`);
        console.log(`📝 Input: "${input}"`);
        console.log(`✅ Expected: "${expected}"`);
        console.log(`🎯 Result: "${result}"`);

        // Check that the specific time was fixed correctly
        if (input.includes('at 30')) {
          expect(result).toContain('8:30');
        } else if (input.includes('at 15')) {
          expect(result).toContain('8:15');
        } else if (input.includes('at 45')) {
          expect(result).toContain('8:45');
        }
        
        // Ensure original time patterns are removed
        expect(result).not.toContain(' at 30');
        expect(result).not.toContain(' at 15');
        expect(result).not.toContain(' at 45');
      });
    });
  });

  describe('Currency Correction Fixes', () => {
    const currencyTestCases = [
      {
        input: 'cost 2850 pounds',
        expected: 'cost 2850 euros',
        description: 'Irish construction pricing'
      },
      {
        input: 'total £5000 for materials',
        expected: 'total €5000 for materials',
        description: 'Material cost correction'
      },
      {
        input: 'dayworks claim for 1200 pound',
        expected: 'dayworks claim for 1200 euros',
        description: 'Labour cost correction'
      }
    ];

    currencyTestCases.forEach(({ input, expected, description }) => {
      it(`should fix currency: ${description}`, () => {
        const result = transcriptionService.applyCriticalFixes(input);
        
        console.log(`💰 ${description}`);
        console.log(`📝 Input: "${input}"`);
        console.log(`✅ Expected: "${expected}"`);
        console.log(`🎯 Result: "${result}"`);

        // Check for either "euro" or "€" symbol
        const hasEuroTerm = result.toLowerCase().includes('euro') || result.includes('€');
        expect(hasEuroTerm).toBe(true);
        
        // Ensure pounds/£ are removed
        expect(result).not.toMatch(/pounds?/i);
        expect(result).not.toContain('£');
      });
    });
  });

  describe('Safety Terminology Fixes', () => {
    const safetyTestCases = [
      {
        input: 'check the engine protection',
        expected: 'check the edge protection',
        description: 'Scaffold safety terminology'
      },
      {
        input: 'safe farming practices on site',
        expected: 'safe working practices on site',
        description: 'Construction safety practices'
      }
    ];

    safetyTestCases.forEach(({ input, expected, description }) => {
      it(`should fix safety term: ${description}`, () => {
        const result = transcriptionService.applyCriticalFixes(input);
        
        console.log(`⚠️ ${description}`);
        console.log(`📝 Input: "${input}"`);
        console.log(`✅ Expected: "${expected}"`);
        console.log(`🎯 Result: "${result}"`);

        if (input.includes('engine protection')) {
          expect(result.toLowerCase()).toContain('edge protection');
          expect(result.toLowerCase()).not.toContain('engine protection');
        }
        
        if (input.includes('safe farming')) {
          expect(result.toLowerCase()).toContain('safe working');
          expect(result.toLowerCase()).not.toContain('safe farming');
        }
      });
    });
  });

  describe('Location Name Fixes', () => {
    const locationTestCases = [
      {
        input: 'delivery to Ballymune site',
        expected: 'delivery to Ballymun site',
        description: 'Dublin area name correction'
      }
    ];

    locationTestCases.forEach(({ input, expected, description }) => {
      it(`should fix location: ${description}`, () => {
        const result = transcriptionService.applyCriticalFixes(input);
        
        console.log(`📍 ${description}`);
        console.log(`📝 Input: "${input}"`);
        console.log(`✅ Expected: "${expected}"`);
        console.log(`🎯 Result: "${result}"`);

        expect(result.toLowerCase()).toContain('ballymun');
        expect(result.toLowerCase()).not.toContain('ballymune');
      });
    });
  });

  describe('Construction Terminology Fixes', () => {
    const constructionTestCases = [
      {
        input: 'working on the foundation port',
        expected: 'working on the foundation pour',
        description: 'Concrete terminology correction'
      }
    ];

    constructionTestCases.forEach(({ input, expected, description }) => {
      it(`should fix construction term: ${description}`, () => {
        const result = transcriptionService.applyCriticalFixes(input);
        
        console.log(`🏗️ ${description}`);
        console.log(`📝 Input: "${input}"`);
        console.log(`✅ Expected: "${expected}"`);
        console.log(`🎯 Result: "${result}"`);

        expect(result.toLowerCase()).toContain('foundation pour');
        expect(result.toLowerCase()).not.toContain('foundation port');
      });
    });
  });

  describe('Comprehensive Scenario Testing', () => {
    it('should handle multiple fixes in single text', () => {
      const complexInput = `Morning, concrete delivery at 30 to Ballymune site. 
        Cost 2850 pounds. Check engine protection before pour.
        Working on foundation port today.`;

      const result = transcriptionService.applyCriticalFixes(complexInput);
      
      console.log('🔧 Complex scenario test');
      console.log(`📝 Input: "${complexInput}"`);
      console.log(`🎯 Result: "${result}"`);

      // Validate all fixes applied
      expect(result).toContain('8:30');
      expect(result.toLowerCase()).toContain('ballymun');
      expect(result.toLowerCase()).toContain('euro');
      expect(result.toLowerCase()).toContain('edge protection');
      expect(result.toLowerCase()).toContain('foundation pour');
    });
  });
});

// QA Metrics Helper
describe('QA Fix Pattern Coverage', () => {
  it('should have comprehensive fix coverage', () => {
    const service = SimpleTranscriptionService.getInstance();
    
    // Test all critical patterns are implemented
    const testText = `
      at 30 at 15 at 45
      2850 pounds £5000 1200 pound
      engine protection safe farming
      Ballymune foundation port
    `;
    
    const result = service.applyCriticalFixes(testText);
    
    // Calculate coverage metrics
    const originalPatterns = [
      'at 30', 'at 15', 'at 45',
      'pounds', '£', 'pound',
      'engine protection', 'safe farming',
      'Ballymune', 'foundation port'
    ];
    
    const fixedPatterns = originalPatterns.filter(pattern => 
      !result.toLowerCase().includes(pattern.toLowerCase())
    );
    
    const coveragePercent = (fixedPatterns.length / originalPatterns.length) * 100;
    
    console.log(`📊 QA Fix Coverage: ${coveragePercent}%`);
    console.log(`✅ Fixed patterns: ${fixedPatterns.length}/${originalPatterns.length}`);
    
    expect(coveragePercent).toBeGreaterThanOrEqual(80); // 80% minimum coverage
  });
});