/**
 * Story 1A.2.2 - Smart Suggestions API Tests
 * Integration tests for the smart suggestion test endpoint
 */

import { createMocks } from 'node-mocks-http'
import handler, { TEST_CASES } from '@/pages/api/test/smart-suggestions'

describe('/api/test/smart-suggestions', () => {
  describe('POST requests', () => {
    it('should generate suggestions for high-risk currency text', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: TEST_CASES.highRisk,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.suggestions).toBeDefined()
      expect(data.analysis).toBeDefined()
      
      // Should have high business impact due to currency and safety
      expect(data.analysis.business_impact).toBe('CRITICAL')
      expect(data.analysis.requires_review).toBe(true)
      
      // Should have currency suggestions
      const currencySuggestions = data.suggestions.filter((s: any) => s.type === 'currency')
      expect(currencySuggestions.length).toBeGreaterThan(0)
    })

    it('should handle low-risk scenarios with quick approval', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: TEST_CASES.lowRisk,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.analysis.business_impact).toBe('LOW')
      expect(data.analysis.requires_review).toBe(false)
      expect(data.analysis.estimated_review_time).toBeLessThanOrEqual(30)
    })

    it('should detect safety-focused issues', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: TEST_CASES.safetyFocus,
        },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      const safetySuggestions = data.suggestions.filter((s: any) => s.type === 'safety')
      
      expect(safetySuggestions.length).toBeGreaterThan(0)
      expect(data.analysis.requires_review).toBe(true) // Safety requires review
    })

    it('should handle mixed risk scenarios appropriately', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: TEST_CASES.mixedRisk,
        },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      // Should have both currency and unit suggestions
      const suggestionTypes = new Set(data.suggestions.map((s: any) => s.type))
      expect(suggestionTypes.size).toBeGreaterThan(1) // Multiple types
    })

    it('should return error for missing text', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}, // Missing text
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Text is required')
    })
  })

  describe('HTTP method validation', () => {
    it('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData()).error).toBe('Method not allowed')
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { text: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Test Cases Validation', () => {
    it('should have appropriate test cases for all scenarios', () => {
      // Validate test case structure
      expect(TEST_CASES.highRisk).toContain('£') // Currency
      expect(TEST_CASES.highRisk).toContain('feet') // Units
      expect(TEST_CASES.highRisk).toMatch(/safety|hat/i) // Safety terms
      
      expect(TEST_CASES.lowRisk).toContain('mil') // Unit standardization
      expect(TEST_CASES.lowRisk).not.toContain('£') // No currency issues
      
      expect(TEST_CASES.safetyFocus).toMatch(/ppe|hat|boots/i) // Safety focused
      
      expect(TEST_CASES.currencyFocus).toMatch(/£.*pound/i) // Multiple currency formats
    })

    it('should process all predefined test cases without errors', async () => {
      for (const [testName, testText] of Object.entries(TEST_CASES)) {
        const { req, res } = createMocks({
          method: 'POST',
          body: { text: testText },
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
        expect(data.suggestions).toBeDefined()
        expect(data.analysis).toBeDefined()
        
        // Each test case should generate at least one suggestion
        expect(data.suggestions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Response Format Validation', () => {
    it('should return properly formatted response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test £100 payment',
        },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      // Validate response structure
      expect(data).toMatchObject({
        success: true,
        suggestions: expect.any(Array),
        analysis: expect.objectContaining({
          total_risk_score: expect.any(Number),
          business_impact: expect.stringMatching(/^(LOW|MEDIUM|HIGH|CRITICAL)$/),
          estimated_review_time: expect.any(Number),
          requires_review: expect.any(Boolean),
        }),
      })
      
      // Validate suggestion structure
      if (data.suggestions.length > 0) {
        expect(data.suggestions[0]).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          original: expect.any(String),
          suggested: expect.any(String),
          confidence: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
          reason: expect.any(String),
          businessRisk: expect.stringMatching(/^(LOW|MEDIUM|HIGH|CRITICAL)$/),
          requiresReview: expect.any(Boolean),
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service to throw error
      jest.doMock('@/lib/services/smart-suggestion.service', () => ({
        smartSuggestionService: {
          generateSuggestions: jest.fn().mockRejectedValue(new Error('Service error')),
        },
      }))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'test text',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Failed to generate suggestions')
      expect(data.details).toBe('Service error')
      
      // Restore mocks
      jest.clearAllMocks()
    })
  })
})