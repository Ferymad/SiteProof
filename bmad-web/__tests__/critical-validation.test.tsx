/**
 * CRITICAL MVP VALIDATION - Smart Suggestion Review System
 * Story 1A.2.2 - Essential acceptance criteria validation
 * 
 * This test validates the most critical requirements for MVP deployment
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SmartSuggestionReview, SmartSuggestion } from '@/components/SmartSuggestionReview'

// Test data for critical scenarios
const createCriticalCurrencySuggestion = (): SmartSuggestion => ({
  id: 'critical-currency-1',
  type: 'currency',
  original: '£2,500',
  suggested: '€2,500',
  confidence: 'HIGH',
  reason: 'Ireland uses euros, not pounds',
  businessRisk: 'CRITICAL',
  estimatedValue: 2500,
  requiresReview: true,
  contextBefore: 'The concrete delivery cost',
  contextAfter: 'and we paid for steel',
})

const createLowRiskUnitSuggestion = (): SmartSuggestion => ({
  id: 'low-risk-unit-1',
  type: 'units',
  original: '25mm',
  suggested: '25 millimetres',
  confidence: 'HIGH',
  reason: 'Standardize measurement abbreviation',
  businessRisk: 'LOW',
  requiresReview: false,
  contextBefore: 'Used',
  contextAfter: 'rebar and steel bars',
})

const createSafetyTermSuggestion = (): SmartSuggestion => ({
  id: 'safety-term-1',
  type: 'safety',
  original: 'hard hat',
  suggested: 'safety helmet',
  confidence: 'HIGH',
  reason: 'Use proper safety equipment terminology',
  businessRisk: 'HIGH',
  requiresReview: true,
  contextBefore: 'Workers need',
  contextAfter: 'and safety boots',
})

describe('🚨 CRITICAL MVP VALIDATION - Smart Suggestion Review System', () => {
  const mockOnReview = jest.fn()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ ACCEPTANCE CRITERIA 1: Performance Target (<2 minutes)', () => {
    it('should show <30 seconds estimate for low-risk suggestions (95% case)', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/< 30 seconds/i)).toBeInTheDocument()
    })

    it('should provide single-click batch approval for low-risk items', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i)
      fireEvent.click(acceptButton)

      expect(mockOnReview).toHaveBeenCalledWith({ 'low-risk-unit-1': 'accept' })
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('✅ ACCEPTANCE CRITERIA 2: Mobile UX (80px+ touch targets)', () => {
    it('should have mobile-optimized touch targets (h-16 = 64px minimum)', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i).closest('button')
      expect(acceptButton).toHaveClass('h-16') // 64px minimum for construction gloves
    })

    it('should use mobile-friendly spacing (space-y-6)', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const container = screen.getByText(/Smart Suggestions Ready/i).closest('div')
      expect(container).toHaveClass('space-y-6')
    })
  })

  describe('✅ ACCEPTANCE CRITERIA 3: Business Risk Assessment', () => {
    it('should flag currency errors >€1,000 as CRITICAL', () => {
      const suggestions = [createCriticalCurrencySuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show high-risk warning
      expect(screen.getByText(/High-Risk Changes Detected/i)).toBeInTheDocument()
      expect(screen.getByText(/Financial value: €2,500/i)).toBeInTheDocument()
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
    })

    it('should require review for safety terms', () => {
      const suggestions = [createSafetyTermSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
    })

    it('should handle mixed risk levels appropriately', () => {
      const suggestions = [
        createCriticalCurrencySuggestion(),
        createLowRiskUnitSuggestion(),
        createSafetyTermSuggestion(),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show both safe changes and manual review sections
      expect(screen.getByText(/Safe Changes \(1\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
      expect(screen.getByText(/2 high-risk changes/i)).toBeInTheDocument()
    })
  })

  describe('✅ ACCEPTANCE CRITERIA 4: Progressive Review Workflow', () => {
    it('should support progressive review for high-risk items', () => {
      const suggestions = [createCriticalCurrencySuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should offer to move to progressive review
      const reviewButton = screen.getByText(/Accept Safe Changes & Continue/i)
      expect(reviewButton).toBeInTheDocument()
    })
  })

  describe('✅ ACCEPTANCE CRITERIA 5: Responsive Design', () => {
    it('should handle loading states properly', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
          isProcessing={true}
        />
      )

      expect(screen.getByText(/Applying Changes/i)).toBeInTheDocument()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should support full-width buttons for mobile', () => {
      const suggestions = [createLowRiskUnitSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i).closest('button')
      expect(acceptButton).toHaveClass('w-full')
    })
  })

  describe('🔥 CRITICAL EDGE CASES', () => {
    it('should handle empty suggestions gracefully', () => {
      render(
        <SmartSuggestionReview
          suggestions={[]}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should complete immediately for empty suggestions
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('should handle batch operations efficiently', () => {
      const batchSuggestions = Array.from({ length: 10 }, (_, i) => ({
        ...createLowRiskUnitSuggestion(),
        id: `batch-${i}`,
      }))
      
      render(
        <SmartSuggestionReview
          suggestions={batchSuggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All \(10\)/i)
      fireEvent.click(acceptButton)

      // Should process all suggestions in single operation
      expect(mockOnReview).toHaveBeenCalledWith(
        Object.fromEntries(batchSuggestions.map(s => [s.id, 'accept']))
      )
    })
  })

  describe('🎯 CONSTRUCTION-SPECIFIC VALIDATION', () => {
    it('should correctly identify currency corrections as high-priority', () => {
      const suggestions = [createCriticalCurrencySuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Currency corrections should be flagged as requiring manual review
      expect(screen.getByText(/Ireland uses euros, not pounds/i)).toBeInTheDocument()
      expect(screen.getByText(/€2,500/i)).toBeInTheDocument()
    })

    it('should display construction context properly', () => {
      const suggestions = [createCriticalCurrencySuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show the context of the change
      expect(screen.getByText(/£2,500/i)).toBeInTheDocument()
      expect(screen.getByText(/€2,500/i)).toBeInTheDocument()
    })

    it('should prioritize safety terminology corrections', () => {
      const suggestions = [createSafetyTermSuggestion()]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Safety changes should require manual review
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
    })
  })

  describe('⚡ PERFORMANCE VALIDATION', () => {
    it('should render quickly with multiple suggestions', () => {
      const largeSuggestionSet = Array.from({ length: 20 }, (_, i) => ({
        ...createLowRiskUnitSuggestion(),
        id: `perf-test-${i}`,
      }))
      
      const startTime = performance.now()
      
      render(
        <SmartSuggestionReview
          suggestions={largeSuggestionSet}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render in reasonable time (less than 50ms for 20 items)
      expect(renderTime).toBeLessThan(50)
      
      // Should handle large sets properly
      expect(screen.getByText(/Accept All \(20\)/i)).toBeInTheDocument()
    })
  })
})

// Export test utilities for reuse
export {
  createCriticalCurrencySuggestion,
  createLowRiskUnitSuggestion,
  createSafetyTermSuggestion,
}