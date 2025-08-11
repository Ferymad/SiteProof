/**
 * Story 1A.2.2 - Smart Suggestion Service Tests
 * Validates core business logic for construction transcription improvements
 */

import { SmartSuggestionService } from '@/lib/services/smart-suggestion.service'

// Mock the transcription fixer service
jest.mock('@/lib/services/transcription-fixer', () => ({
  applyPatternFixes: jest.fn((text: string, confidence: number) => ({
    fixed: text.replace(/£(\d+)/g, '€$1'), // Simple mock transformation
    criticalErrors: [],
    patternsApplied: ['currency-fix'],
  })),
  CRITICAL_ERROR_PATTERNS: [],
}))

describe('SmartSuggestionService - Business Logic Validation', () => {
  let service: SmartSuggestionService

  beforeEach(() => {
    service = SmartSuggestionService.getInstance()
  })

  describe('Currency Suggestions (Irish Market)', () => {
    it('should detect and correct pound symbols to euros', async () => {
      const text = 'The concrete delivery cost £2,500 and we paid £1,000 for steel'
      
      const analysis = await service.generateSuggestions({
        text,
        confidence: 80,
        audioQuality: 75,
      })

      // Should detect both currency instances
      const currencySuggestions = analysis.suggestions.filter(s => s.type === 'currency')
      expect(currencySuggestions).toHaveLength(2)
      
      // First suggestion
      expect(currencySuggestions[0]).toMatchObject({
        original: '£2,500',
        suggested: '€2,500',
        businessRisk: 'CRITICAL', // Over €1,000
        reason: 'Ireland uses euros, not pounds',
        estimatedValue: 2500,
      })
      
      // Second suggestion
      expect(currencySuggestions[1]).toMatchObject({
        original: '£1,000',
        suggested: '€1,000',
        businessRisk: 'CRITICAL',
        estimatedValue: 1000,
      })
    })

    it('should handle pound terminology correctly', async () => {
      const text = 'Material costs 500 pounds and 200 pound for transport'
      
      const analysis = await service.generateSuggestions({ text })
      
      const currencySuggestions = analysis.suggestions.filter(s => s.type === 'currency')
      expect(currencySuggestions).toHaveLength(2)
      
      expect(currencySuggestions[0].suggested).toContain('euros')
      expect(currencySuggestions[1].suggested).toContain('euros')
    })

    it('should assess financial risk correctly', async () => {
      const lowValue = 'Cost £500 for materials'
      const highValue = 'Total project cost £5,000'
      
      const lowAnalysis = await service.generateSuggestions({ text: lowValue })
      const highAnalysis = await service.generateSuggestions({ text: highValue })
      
      // Low value should be HIGH risk (still currency error)
      expect(lowAnalysis.suggestions[0].businessRisk).toBe('HIGH')
      
      // High value should be CRITICAL risk
      expect(highAnalysis.suggestions[0].businessRisk).toBe('CRITICAL')
      expect(highAnalysis.businessImpact).toBe('CRITICAL')
    })
  })

  describe('Unit Conversion Suggestions', () => {
    it('should convert imperial units to metric', async () => {
      const text = 'The wall is 10 feet high and 3 yards long with 2 inch thick panels'
      
      const analysis = await service.generateSuggestions({ text })
      
      const unitSuggestions = analysis.suggestions.filter(s => s.type === 'units')
      expect(unitSuggestions.length).toBeGreaterThan(0)
      
      // Check feet conversion
      const feetSuggestion = unitSuggestions.find(s => s.original.includes('feet'))
      expect(feetSuggestion).toBeTruthy()
      expect(feetSuggestion?.suggested).toContain('metres')
      
      // Check yards conversion
      const yardsSuggestion = unitSuggestions.find(s => s.original.includes('yards'))
      expect(yardsSuggestion?.suggested).toContain('metres')
      
      // Check inches conversion
      const inchesSuggestion = unitSuggestions.find(s => s.original.includes('inch'))
      expect(inchesSuggestion?.suggested).toContain('mm')
    })

    it('should standardize millimetre abbreviations', async () => {
      const text = 'Used 25 mil rebar and 50mil bolts'
      
      const analysis = await service.generateSuggestions({ text })
      
      const unitSuggestions = analysis.suggestions.filter(s => 
        s.type === 'units' && s.original.includes('mil')
      )
      
      expect(unitSuggestions).toHaveLength(2)
      expect(unitSuggestions[0].suggested).toBe('25mm')
      expect(unitSuggestions[1].suggested).toBe('50mm')
    })

    it('should assess unit conversion risk appropriately', async () => {
      const text = 'Foundation is 100 feet deep' // High risk due to measurement importance
      
      const analysis = await service.generateSuggestions({ text })
      
      const unitSuggestion = analysis.suggestions.find(s => s.type === 'units')
      expect(unitSuggestion?.businessRisk).toBe('HIGH') // Structural measurements are high risk
    })
  })

  describe('Safety Term Suggestions', () => {
    it('should identify and correct safety equipment terminology', async () => {
      const text = 'Workers need hard hat and safety boots, PPE inspection required'
      
      const analysis = await service.generateSuggestions({ text })
      
      const safetyTerms = analysis.suggestions.filter(s => s.type === 'safety')
      expect(safetyTerms.length).toBeGreaterThan(0)
      
      // Should suggest proper safety equipment names
      const hardHatSuggestion = safetyTerms.find(s => s.original.includes('hard hat'))
      expect(hardHatSuggestion?.suggested).toBe('safety helmet')
      
      const bootsSuggestion = safetyTerms.find(s => s.original.includes('safety boots'))
      expect(bootsSuggestion?.suggested).toBe('safety footwear')
      
      const ppeSuggestion = safetyTerms.find(s => s.original.includes('ppe'))
      expect(ppeSuggestion?.suggested).toBe('PPE (Personal Protective Equipment)')
    })

    it('should assign appropriate risk levels to safety terms', async () => {
      const text = 'PPE check needed for site entry'
      
      const analysis = await service.generateSuggestions({ text })
      
      const safetyTerms = analysis.suggestions.filter(s => s.type === 'safety')
      const ppeTerm = safetyTerms.find(s => s.original.toLowerCase().includes('ppe'))
      
      expect(ppeTerm?.businessRisk).toBe('HIGH') // PPE is critical for safety
    })
  })

  describe('Business Risk Assessment', () => {
    it('should escalate total financial exposure appropriately', async () => {
      const text = 'Concrete £2,000, steel £1,500, labour £2,000' // Total €5,500
      
      const analysis = await service.generateSuggestions({ text })
      
      // Should escalate to CRITICAL due to total exposure
      expect(analysis.businessImpact).toBe('CRITICAL')
      expect(analysis.requiresReview).toBe(true)
    })

    it('should require review for safety-related changes', async () => {
      const text = 'PPE check and hard hat inspection'
      
      const analysis = await service.generateSuggestions({ text })
      
      expect(analysis.requiresReview).toBe(true)
      expect(analysis.estimatedReviewTime).toBeGreaterThan(30) // Should take more than quick approval
    })

    it('should calculate review time estimates correctly', async () => {
      // Low risk scenario
      const lowRiskText = '25mil bolts and 30mil screws'
      const lowRiskAnalysis = await service.generateSuggestions({ text: lowRiskText })
      expect(lowRiskAnalysis.estimatedReviewTime).toBe(10) // Quick batch approval
      
      // High risk scenario
      const highRiskText = 'Cost £2,000 and PPE needed'
      const highRiskAnalysis = await service.generateSuggestions({ text: highRiskText })
      expect(highRiskAnalysis.estimatedReviewTime).toBeGreaterThan(30) // Manual review required
    })
  })

  describe('Suggestion Application', () => {
    it('should correctly apply accepted changes to text', () => {
      const originalText = 'The cost was £1,500 and depth 10 feet'
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
      
      const result = service.applyDecisions(originalText, suggestions, decisions)
      
      expect(result.correctedText).toBe('The cost was €1,500 and depth 3.0 metres')
      expect(result.appliedChanges).toHaveLength(2)
      expect(result.rejectedChanges).toHaveLength(0)
    })

    it('should handle rejected changes correctly', () => {
      const originalText = 'Cost £500'
      const suggestions = [{
        id: 'test-1',
        type: 'currency' as const,
        original: '£500',
        suggested: '€500',
        confidence: 'HIGH' as const,
        reason: 'Currency correction',
        businessRisk: 'HIGH' as const,
        requiresReview: true,
      }]
      
      const decisions = { 'test-1': 'reject' as const }
      
      const result = service.applyDecisions(originalText, suggestions, decisions)
      
      expect(result.correctedText).toBe(originalText) // Unchanged
      expect(result.appliedChanges).toHaveLength(0)
      expect(result.rejectedChanges).toHaveLength(1)
    })
  })

  describe('Context Generation', () => {
    it('should provide meaningful context for suggestions', async () => {
      const text = 'The concrete foundation costs £2,500 for the entire project'
      
      const analysis = await service.generateSuggestions({ text })
      
      const currencySuggestion = analysis.suggestions.find(s => s.type === 'currency')
      expect(currencySuggestion?.contextBefore).toContain('concrete foundation costs')
      expect(currencySuggestion?.contextAfter).toContain('for the entire')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty text gracefully', async () => {
      const analysis = await service.generateSuggestions({ text: '' })
      
      expect(analysis.suggestions).toHaveLength(0)
      expect(analysis.businessImpact).toBe('LOW')
      expect(analysis.requiresReview).toBe(false)
    })

    it('should handle text with no corrections needed', async () => {
      const text = 'Standard concrete mix C25/30 at 3.5 metres depth'
      
      const analysis = await service.generateSuggestions({ text })
      
      // Should have minimal suggestions if any
      expect(analysis.businessImpact).toBe('LOW')
      expect(analysis.requiresReview).toBe(false)
    })

    it('should maintain singleton instance', () => {
      const instance1 = SmartSuggestionService.getInstance()
      const instance2 = SmartSuggestionService.getInstance()
      
      expect(instance1).toBe(instance2) // Same instance
    })
  })

  describe('Construction Industry Specific Patterns', () => {
    it('should handle complex construction scenarios', async () => {
      const text = `
        Site visit notes: Foundation depth 12 feet, concrete cost £3,500.
        Safety concerns: workers need hard hats and PPE inspection.
        Materials: 250 cubic metres ready-mix, rebar 25 mil diameter.
        Payment terms: 2,000 pounds deposit, balance 1,500 pound on completion.
      `
      
      const analysis = await service.generateSuggestions({ text })
      
      // Should detect multiple types of suggestions
      const types = new Set(analysis.suggestions.map(s => s.type))
      expect(types).toContain('currency')
      expect(types).toContain('units')
      expect(types).toContain('safety')
      
      // Should have high business impact due to financial amounts
      expect(analysis.businessImpact).toBe('CRITICAL')
      expect(analysis.requiresReview).toBe(true)
    })
  })
})