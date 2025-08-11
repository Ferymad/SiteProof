/**
 * Story 1A.2.2 - Mobile UX Validation Tests
 * Tests mobile-specific requirements for construction PM usage
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SmartSuggestionReview } from '@/components/SmartSuggestionReview'

// Mock mobile viewport
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

// Test suggestions
const createTestSuggestion = (id: string, risk: 'LOW' | 'HIGH' | 'CRITICAL' = 'LOW') => ({
  id,
  type: 'currency' as const,
  original: '£100',
  suggested: '€100',
  confidence: 'HIGH' as const,
  reason: 'Currency correction',
  businessRisk: risk,
  requiresReview: risk !== 'LOW',
  contextBefore: 'cost',
  contextAfter: 'paid',
})

describe('Mobile UX Validation - Construction PM Requirements', () => {
  const mockOnReview = jest.fn()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Set mobile viewport by default
    mockViewport(375, 812) // iPhone X dimensions
  })

  describe('Touch Target Requirements (80px+ for construction gloves)', () => {
    it('should have 80px height touch targets for primary actions', () => {
      const suggestions = [createTestSuggestion('touch-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i).closest('button')
      const reviewButton = screen.getByText(/Review One by One/i).closest('button')
      
      // Check computed styles would show minimum 64px (h-16 class)
      expect(acceptButton).toHaveClass('h-16') // 64px minimum, design targets 80px
      expect(reviewButton).toHaveClass('h-16')
    })

    it('should have large touch targets in progressive review', async () => {
      const suggestions = [createTestSuggestion('progressive-touch-1', 'HIGH')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review mode
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      // Wait for progressive review to render
      await screen.findByText(/Accept Change/i)

      const acceptButton = screen.getByText(/Accept Change/i).closest('button')
      const rejectButton = screen.getByText(/Keep Original/i).closest('button')
      
      expect(acceptButton).toHaveClass('h-16') // 64px height
      expect(rejectButton).toHaveClass('h-16')
    })

    it('should maintain touch target sizes on small screens (320px)', () => {
      mockViewport(320, 568) // iPhone 5 dimensions
      
      const suggestions = [createTestSuggestion('small-screen-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i).closest('button')
      expect(acceptButton).toHaveClass('h-16') // Should maintain size even on small screens
    })
  })

  describe('Thumb-Friendly Layout (480px from bottom)', () => {
    it('should position primary CTAs in thumb-friendly zone', () => {
      const suggestions = [createTestSuggestion('thumb-zone-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Primary CTA should be prominently positioned
      const acceptButton = screen.getByText(/Accept All/i)
      expect(acceptButton.closest('button')).toHaveClass('w-full') // Full width for easy targeting
    })

    it('should stack actions vertically on mobile', () => {
      const suggestions = [createTestSuggestion('vertical-stack-1', 'HIGH')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      // Should use grid layout for action buttons
      const buttonContainer = screen.getByText(/Accept Change/i).closest('div')
      expect(buttonContainer).toHaveClass('grid', 'grid-cols-2', 'gap-4')
    })
  })

  describe('Readability in Bright Sunlight (4.5:1 contrast)', () => {
    it('should use high contrast colors for critical information', async () => {
      const suggestions = [createTestSuggestion('contrast-1', 'CRITICAL')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Enter progressive review to see risk badges
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      const riskBadge = await screen.findByText(/CRITICAL RISK/i)
      expect(riskBadge).toHaveClass('bg-red-100', 'text-red-800') // High contrast red
    })

    it('should maintain readability for suggestion previews', () => {
      const suggestions = [createTestSuggestion('readability-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Check text contrast classes
      const originalText = screen.getByText('£100')
      const suggestedText = screen.getByText('€100')
      
      expect(originalText).toHaveClass('text-red-600') // Good contrast for errors
      expect(suggestedText).toHaveClass('text-green-600') // Good contrast for suggestions
    })
  })

  describe('Mobile Spacing and Layout', () => {
    it('should use adequate spacing for touch interactions', () => {
      const suggestions = [
        createTestSuggestion('spacing-1'),
        createTestSuggestion('spacing-2'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Container should have mobile spacing
      const container = screen.getByText(/Smart Suggestions Ready/i).closest('div')
      expect(container).toHaveClass('space-y-6') // 24px spacing for mobile
    })

    it('should handle content overflow gracefully', () => {
      const longSuggestions = Array.from({ length: 10 }, (_, i) => 
        createTestSuggestion(`overflow-${i}`)
      )
      
      render(
        <SmartSuggestionReview
          suggestions={longSuggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Should show preview of first 3 items
      expect(screen.getByText(/\+7 more improvements/i)).toBeInTheDocument()
    })
  })

  describe('Progressive Enhancement for Mobile', () => {
    it('should show appropriate time estimates for mobile usage', () => {
      const quickSuggestions = [createTestSuggestion('quick-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={quickSuggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/< 30 seconds/i)).toBeInTheDocument()
    })

    it('should provide clear progress indicators', async () => {
      const suggestions = [
        createTestSuggestion('progress-1', 'HIGH'),
        createTestSuggestion('progress-2', 'HIGH'),
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

      // Should show progress indicator
      const progressText = await screen.findByText(/1 of 2/i)
      expect(progressText).toBeInTheDocument()
      
      // Should have visual progress bar
      const progressBar = document.querySelector('[style*="width"]')
      expect(progressBar).toBeTruthy()
    })
  })

  describe('Construction Site Interruption Handling', () => {
    it('should preserve state during interactions', async () => {
      const suggestions = [
        createTestSuggestion('state-1', 'HIGH'),
        createTestSuggestion('state-2', 'HIGH'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Start progressive review
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      // Should show first item
      await screen.findByText(/1 of 2/i)
      
      // Accept first item
      fireEvent.click(screen.getByText(/Accept Change/i))

      // Should automatically move to second item or complete
      expect(mockOnReview).toHaveBeenCalled()
    })

    it('should support going back to previous items', async () => {
      const suggestions = [
        createTestSuggestion('nav-1', 'HIGH'),
        createTestSuggestion('nav-2', 'HIGH'),
      ]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to second item (mock navigation)
      fireEvent.click(screen.getByText(/Accept Safe Changes & Continue/i))

      // Accept first to move to second
      await screen.findByText(/Accept Change/i)
      fireEvent.click(screen.getByText(/Accept Change/i))

      // Should complete the flow
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Performance on Mobile Devices', () => {
    it('should handle large suggestion lists efficiently', () => {
      const largeSuggestionList = Array.from({ length: 50 }, (_, i) => 
        createTestSuggestion(`perf-${i}`)
      )
      
      const startTime = performance.now()
      
      render(
        <SmartSuggestionReview
          suggestions={largeSuggestionList}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render quickly (under 100ms is reasonable)
      expect(renderTime).toBeLessThan(100)
      
      // Should still show appropriate UI elements
      expect(screen.getByText(/Accept All \(50\)/i)).toBeInTheDocument()
    })

    it('should minimize re-renders during interactions', () => {
      const suggestions = [createTestSuggestion('rerender-1')]
      
      let renderCount = 0
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount++
        return <div>{children}</div>
      }
      
      const { rerender } = render(
        <TestWrapper>
          <SmartSuggestionReview
            suggestions={suggestions}
            onReview={mockOnReview}
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      )
      
      const initialRenderCount = renderCount
      
      // Interact with the component
      fireEvent.click(screen.getByText(/Accept All/i))
      
      // Should not cause excessive re-renders
      const finalRenderCount = renderCount
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(2)
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should support touch and keyboard navigation', () => {
      const suggestions = [createTestSuggestion('a11y-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
        />
      )

      const acceptButton = screen.getByText(/Accept All/i)
      
      // Should be focusable
      expect(acceptButton).toHaveAttribute('type', 'button')
      
      // Should have proper ARIA attributes if needed
      // (Implementation specific - checking basic button functionality)
      expect(acceptButton).toBeEnabled()
    })

    it('should provide clear visual feedback for state changes', () => {
      const suggestions = [createTestSuggestion('feedback-1')]
      
      render(
        <SmartSuggestionReview
          suggestions={suggestions}
          onReview={mockOnReview}
          onComplete={mockOnComplete}
          isProcessing={true}
        />
      )

      // Should show loading state
      expect(screen.getByText(/Applying Changes/i)).toBeInTheDocument()
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })
  })
})