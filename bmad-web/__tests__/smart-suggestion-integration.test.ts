/**
 * Smart Suggestion Service Integration Tests
 * Validates the core service functionality that's actually implemented
 */

import { smartSuggestionService } from '@/lib/services/smart-suggestion.service'

// Mock the transcription fixer to avoid OpenAI dependency
jest.mock('@/lib/services/transcription-fixer', () => ({
  applyPatternFixes: jest.fn((text: string) => ({
    fixed: text
      .replace(/£(\d+)/g, '€$1')  // Convert pounds to euros
      .replace(/\bpounds?\b/gi, 'euros')  // Convert pounds word
      .replace(/\bJCP\b/gi, 'JCB'),  // Construction equipment fix
    criticalErrors: [],
    patternsApplied: ['currency-fix', 'equipment-fix'],
  })),
  CRITICAL_ERROR_PATTERNS: [],
}))

describe('Smart Suggestion Service - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Currency Detection (Irish Market)', () => {
    it('should detect and suggest euro corrections for pound symbols', async () => {
      const text = 'The delivery cost £2,500'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const currencySuggestions = analysis.suggestions.filter(s => s.type === 'currency')
      expect(currencySuggestions.length).toBeGreaterThan(0)
      
      const poundSuggestion = currencySuggestions.find(s => s.original.includes('£'))
      expect(poundSuggestion).toBeTruthy()
      expect(poundSuggestion?.suggested).toContain('€')
      expect(poundSuggestion?.businessRisk).toBe('CRITICAL')
    })

    it('should handle pounds terminology correctly', async () => {
      const text = 'Cost 1000 pounds for materials'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const currencySuggestions = analysis.suggestions.filter(s => s.type === 'currency')
      const poundWordSuggestion = currencySuggestions.find(s => s.original.includes('pounds'))
      
      expect(poundWordSuggestion).toBeTruthy()
      expect(poundWordSuggestion?.suggested).toContain('euros')
    })
  })

  describe('Unit Conversions', () => {
    it('should convert imperial to metric units', async () => {
      const text = 'Wall height is 10 feet and 2 inches thick'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const unitSuggestions = analysis.suggestions.filter(s => s.type === 'units')
      expect(unitSuggestions.length).toBeGreaterThan(0)
      
      // Should convert feet to metres
      const feetSuggestion = unitSuggestions.find(s => s.original.includes('feet'))
      expect(feetSuggestion?.suggested).toContain('metres')
      
      // Should convert inches to mm
      const inchSuggestion = unitSuggestions.find(s => s.original.includes('inches'))
      expect(inchSuggestion?.suggested).toContain('mm')
    })

    it('should standardize millimetre abbreviations', async () => {
      const text = 'Used 25 mil rebar'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const unitSuggestions = analysis.suggestions.filter(s => s.type === 'units')
      const milSuggestion = unitSuggestions.find(s => s.original.includes('mil'))
      
      expect(milSuggestion?.suggested).toBe('25mm')
    })
  })

  describe('Safety Term Detection', () => {
    it('should suggest proper safety equipment terminology', async () => {
      const text = 'Workers need hard hat and safety boots'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const safetyTerms = analysis.suggestions.filter(s => s.type === 'safety')
      expect(safetyTerms.length).toBeGreaterThan(0)
      
      const hardHatTerm = safetyTerms.find(s => s.original.includes('hard hat'))
      expect(hardHatTerm?.suggested).toBe('safety helmet')
      expect(hardHatTerm?.businessRisk).toBe('MEDIUM')
    })

    it('should clarify PPE abbreviations', async () => {
      const text = 'PPE inspection required'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      const safetyTerms = analysis.suggestions.filter(s => s.type === 'safety')
      const ppeTerm = safetyTerms.find(s => s.original.toLowerCase() === 'ppe')
      
      expect(ppeTerm?.suggested).toBe('PPE (Personal Protective Equipment)')
      expect(ppeTerm?.businessRisk).toBe('HIGH')
    })
  })

  describe('Business Risk Assessment', () => {
    it('should classify high-value currency errors as CRITICAL', async () => {
      const text = 'Project cost £5,000'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      expect(analysis.businessImpact).toBe('CRITICAL')
      expect(analysis.requiresReview).toBe(true)
      expect(analysis.estimatedReviewTime).toBeGreaterThan(30)
    })

    it('should allow quick approval for low-risk changes', async () => {
      const text = 'Used standard 25mm bolts'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      if (analysis.suggestions.length === 0) {
        expect(analysis.businessImpact).toBe('LOW')
        expect(analysis.requiresReview).toBe(false)
        expect(analysis.estimatedReviewTime).toBe(10)
      } else {
        // If suggestions exist, they should be low risk
        const allLowRisk = analysis.suggestions.every(s => 
          s.businessRisk === 'LOW' || s.businessRisk === 'MEDIUM'
        )
        expect(allLowRisk).toBe(true)
      }
    })

    it('should escalate safety-related changes', async () => {
      const text = 'PPE violation detected'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      expect(analysis.requiresReview).toBe(true)
      
      const safetySuggestions = analysis.suggestions.filter(s => s.type === 'safety')
      if (safetySuggestions.length > 0) {
        expect(safetySuggestions[0].businessRisk).not.toBe('LOW')
      }
    })
  })

  describe('Suggestion Application', () => {
    it('should apply accepted changes correctly', () => {
      const originalText = 'Cost £1,500 and depth 10 feet'
      const suggestions = [
        {
          id: 'currency-1',
          type: 'currency' as const,
          original: '£1,500',
          suggested: '€1,500',
          confidence: 'HIGH' as const,
          reason: 'Currency correction',
          businessRisk: 'CRITICAL' as const,
          requiresReview: true,
        },
        {
          id: 'units-1',
          type: 'units' as const,
          original: '10 feet',
          suggested: '3.0 metres',
          confidence: 'HIGH' as const,
          reason: 'Unit conversion',
          businessRisk: 'HIGH' as const,
          requiresReview: true,
        },
      ]
      
      const decisions = {
        'currency-1': 'accept' as const,
        'units-1': 'accept' as const,
      }
      
      const result = smartSuggestionService.applyDecisions(originalText, suggestions, decisions)
      
      expect(result.correctedText).toContain('€1,500')
      expect(result.correctedText).toContain('3.0 metres')
      expect(result.appliedChanges).toHaveLength(2)
    })

    it('should handle rejected changes correctly', () => {
      const originalText = 'Cost £500'
      const suggestions = [{
        id: 'reject-test',
        type: 'currency' as const,
        original: '£500',
        suggested: '€500',
        confidence: 'HIGH' as const,
        reason: 'Currency correction',
        businessRisk: 'HIGH' as const,
        requiresReview: true,
      }]
      
      const decisions = { 'reject-test': 'reject' as const }
      
      const result = smartSuggestionService.applyDecisions(originalText, suggestions, decisions)
      
      expect(result.correctedText).toBe(originalText)
      expect(result.rejectedChanges).toHaveLength(1)
    })
  })

  describe('Complex Construction Scenarios', () => {
    it('should handle multi-type suggestions in construction context', async () => {
      const text = `
        Site visit: Foundation depth 12 feet, concrete cost £3,500.
        Safety: workers need hard hats and PPE check required.
        Materials: 25 mil rebar, ready-mix concrete.
      `
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      // Should detect multiple types
      const types = new Set(analysis.suggestions.map(s => s.type))
      expect(types.size).toBeGreaterThan(1)
      
      // Should require review due to high-value currency
      expect(analysis.requiresReview).toBe(true)
      expect(analysis.businessImpact).not.toBe('LOW')
    })

    it('should provide appropriate time estimates', async () => {
      // Quick scenario
      const quickText = 'Standard concrete mix C25/30'
      const quickAnalysis = await smartSuggestionService.generateSuggestions({ text: quickText })
      
      // Complex scenario  
      const complexText = 'Cost £2,000, need PPE, foundation 15 feet deep'
      const complexAnalysis = await smartSuggestionService.generateSuggestions({ text: complexText })
      
      // Complex should take longer than quick
      expect(complexAnalysis.estimatedReviewTime).toBeGreaterThan(quickAnalysis.estimatedReviewTime)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty text gracefully', async () => {
      const analysis = await smartSuggestionService.generateSuggestions({ text: '' })
      
      expect(analysis.suggestions).toHaveLength(0)
      expect(analysis.businessImpact).toBe('LOW')
      expect(analysis.requiresReview).toBe(false)
    })

    it('should handle text with no corrections needed', async () => {
      const text = 'Standard concrete mix at 3.5 metres depth'
      
      const analysis = await smartSuggestionService.generateSuggestions({ text })
      
      // Should have minimal suggestions
      expect(analysis.businessImpact).toBe('LOW')
    })
  })
})