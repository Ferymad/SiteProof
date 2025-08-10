/**
 * Story 1A.2.2 - Smart Suggestion Review System Tests
 * Comprehensive validation of acceptance criteria for MVP deployment
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmartSuggestionReview, SmartSuggestion } from '@/components/SmartSuggestionReview'

// Mock data based on critical test scenarios
const createHighRiskSuggestion = (id: string, estimatedValue?: number): SmartSuggestion => ({
  id,
  type: 'currency',
  original: '£2,500',
  suggested: '€2,500',
  confidence: 'HIGH',
  reason: 'Ireland uses euros, not pounds',
  businessRisk: 'CRITICAL',
  estimatedValue: estimatedValue || 2500,
  requiresReview: true,
  contextBefore: 'The concrete delivery cost',
  contextAfter: 'and we paid for steel',
})

const createLowRiskSuggestion = (id: string): SmartSuggestion => ({
  id,
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

const createSafetySuggestion = (id: string): SmartSuggestion => ({
  id,
  type: 'safety',
  original: 'engine protection',
  suggested: 'edge protection',
  confidence: 'HIGH',
  reason: 'Safety term correction',
  businessRisk: 'HIGH',
  requiresReview: true,
  contextBefore: 'Temporary',
  contextAfter: 'needs fixing',
})

describe('SmartSuggestionReview - MVP Acceptance Criteria', () => {
  const mockOnReview = jest.fn()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Test Case 1: High-Risk Currency (>€1,000)', () => {
    it('should flag CRITICAL risk and require manual review', () => {
      const suggestions = [createHighRiskSuggestion('high-risk-1', 2500)]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show risk warning
      expect(screen.getByText(/High-Risk Changes Detected/i)).toBeInTheDocument()
      expect(screen.getByText(/Financial value: €2,500/i)).toBeInTheDocument()
      
      // Should show manual review required
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
    })

    it('should correctly calculate business impact for currency corrections', () => {
      const suggestions = [
        createHighRiskSuggestion('currency-1', 1200),
        createHighRiskSuggestion('currency-2', 800),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Total value should be displayed
      expect(screen.getByText(/Financial value: €2,000/i)).toBeInTheDocument()
    })
  })

  describe('Test Case 2: Low-Risk Units (Auto-approval)', () => {
    it('should provide smart defaults interface for low-risk changes', () => {
      const suggestions = [
        createLowRiskSuggestion('low-risk-1'),
        createLowRiskSuggestion('low-risk-2'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show batch approval interface
      expect(screen.getByText(/Smart Suggestions Ready/i)).toBeInTheDocument()
      expect(screen.getByText(/Accept All \(2\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Estimated time: < 30 seconds/i)).toBeInTheDocument()
    })

    it('should complete workflow in under 30 seconds for auto-approval', async () => {
      const suggestions = [createLowRiskSuggestion('auto-approve-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Time estimation should be under 30 seconds
      expect(screen.getByText(/< 30 seconds/i)).toBeInTheDocument()
      
      // Click Accept All should trigger immediate completion
      const acceptButton = screen.getByText(/Accept All/i)
      fireEvent.click(acceptButton)

      expect(mockOnReview).toHaveBeenCalledWith({ 'auto-approve-1': 'accept' })
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Test Case 3: Safety Terms', () => {
    it('should properly identify safety-related corrections', () => {
      const suggestions = [createSafetySuggestion('safety-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Safety changes should trigger manual review
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument()
      expect(screen.getByText(/Safety-related changes/i)).toBeInTheDocument()
    })

    it('should provide context explanations for safety corrections', async () => {
      const suggestions = [createSafetySuggestion('safety-context-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Move to progressive review
      const reviewButton = screen.getByText(/Accept Safe Changes & Continue/i)
      fireEvent.click(reviewButton)

      await waitFor(() => {
        expect(screen.getByText(/Safety term correction/i)).toBeInTheDocument()
        expect(screen.getByText(/HIGH RISK/i)).toBeInTheDocument()
      })
    })
  })

  describe('Test Case 4: Mobile UX Requirements', () => {
    it('should have mobile-optimized touch targets (64px minimum)', () => {
      const suggestions = [createLowRiskSuggestion('mobile-test-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Check button classes for mobile sizing
      const acceptButton = screen.getByText(/Accept All/i)
      expect(acceptButton.closest('button')).toHaveClass('h-16') // 64px height
    })

    it('should display suggestions with adequate spacing for gloves', () => {
      const suggestions = [
        createLowRiskSuggestion('spacing-1'),
        createLowRiskSuggestion('spacing-2'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should have mobile spacing classes
      const container = screen.getByText(/Smart Suggestions Ready/i).closest('div')
      expect(container).toHaveClass('space-y-6') // Extra spacing for mobile
    })

    it('should support progressive review with large touch targets', async () => {
      const suggestions = [createHighRiskSuggestion('progressive-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review
      const reviewButton = screen.getByText(/Accept Safe Changes & Continue/i)
      fireEvent.click(reviewButton)

      await waitFor(() => {
        const acceptButton = screen.getByText(/Accept Change/i)
        const rejectButton = screen.getByText(/Keep Original/i)
        
        // Both buttons should have mobile-friendly heights
        expect(acceptButton.closest('button')).toHaveClass('h-16')
        expect(rejectButton.closest('button')).toHaveClass('h-16')
      })
    })
  })

  describe('Test Case 5: Performance Requirements', () => {
    it('should estimate review time correctly', () => {
      const suggestions = [
        createHighRiskSuggestion('perf-1'),
        createHighRiskSuggestion('perf-2'),
        createLowRiskSuggestion('perf-3'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show appropriate time estimate (2 high-risk items = ~1 minute)
      // Implementation shows 0.5 minutes per high-risk item
      expect(screen.getByText(/1 minutes/i)).toBeInTheDocument()
    })

    it('should handle batch operations efficiently', async () => {
      const suggestions = Array.from({ length: 10 }, (_, i) => 
        createLowRiskSuggestion(`batch-${i}`)
      )
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All \(10\)/i)
      fireEvent.click(acceptButton)

      // Should handle all suggestions in a single operation
      expect(mockOnReview).toHaveBeenCalledWith(
        Object.fromEntries(suggestions.map(s => [s.id, 'accept']))
      )
    })
  })

  describe('Progressive Review Workflow', () => {
    it('should support navigation between high-risk items', async () => {
      const suggestions = [
        createHighRiskSuggestion('nav-1'),
        createHighRiskSuggestion('nav-2'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      await waitFor(() => {
        expect(screen.getByText(/1 of 2/i)).toBeInTheDocument()
      })

      // Accept first item
      fireEvent.click(screen.getByText(/Accept Change/i))

      await waitFor(() => {
        expect(mockOnReview).toHaveBeenCalled()
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should show progress indicator during review', async () => {
      const suggestions = [
        createHighRiskSuggestion('progress-1'),
        createHighRiskSuggestion('progress-2'),
        createHighRiskSuggestion('progress-3'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      await waitFor(() => {
        expect(screen.getByText(/Review Progress/i)).toBeInTheDocument()
        expect(screen.getByText(/1 of 3/i)).toBeInTheDocument()
      })
    })
  })

  describe('Business Risk Assessment', () => {
    it('should escalate currency amounts over €1,000 to CRITICAL', () => {
      const suggestions = [createHighRiskSuggestion('critical-1', 5000)]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/Financial value: €5,000/i)).toBeInTheDocument()
      expect(screen.getByText(/High-Risk Changes Detected/i)).toBeInTheDocument()
    })

    it('should handle mixed risk levels appropriately', () => {
      const suggestions = [
        createHighRiskSuggestion('mixed-high-1'),
        createLowRiskSuggestion('mixed-low-1'),
        createSafetySuggestion('mixed-safety-1'),
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

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty suggestions gracefully', () => {
      render(
        <SmartSuggestionReview
          suggestions={[]}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should handle empty state appropriately
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('should support loading states', () => {
      const suggestions = [createLowRiskSuggestion('loading-test')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
          isProcessing={true}
        />
      )

      const acceptButton = screen.getByText(/Applying Changes.../i)
      expect(acceptButton).toBeDisabled()
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })
  })

  describe('Accessibility and Usability', () => {
    it('should provide clear visual feedback for user actions', async () => {
      const suggestions = [createHighRiskSuggestion('feedback-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Risk badges should be visually distinct
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      await waitFor(() => {
        expect(screen.getByText(/CRITICAL RISK/i)).toHaveClass('bg-red-100', 'text-red-800')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const suggestions = [createLowRiskSuggestion('keyboard-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i)
      
      // Should be focusable and activatable with keyboard
      await user.tab()
      expect(acceptButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(mockOnReview).toHaveBeenCalled()
    })
  })
})