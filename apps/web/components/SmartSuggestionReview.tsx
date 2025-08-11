import React, { useState, useCallback, useMemo } from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';

/**
 * Story 1A.2.2 - Interactive Unit Disambiguation Layer
 * Smart Suggestion Review System for Construction PMs
 * 
 * Mobile-first UX optimized for construction gloves and quick decisions
 * - 95% cases: Single "Accept All" action with smart defaults
 * - 5% high-risk cases: Progressive review with risk prioritization
 */

export interface SmartSuggestion {
  id: string;
  type: 'currency' | 'units' | 'safety' | 'materials' | 'time' | 'amounts';
  original: string;
  suggested: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  businessRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedValue?: number;
  requiresReview: boolean;
  contextBefore?: string;
  contextAfter?: string;
}

export interface SmartSuggestionReviewProps {
  suggestions: SmartSuggestion[];
  onReview: (decisions: { [suggestionId: string]: 'accept' | 'reject' }) => void;
  onComplete: () => void;
  isProcessing?: boolean;
}

// Mobile-optimized touch targets and spacing
const MOBILE_TOUCH_HEIGHT = 'min-h-[80px]'; // 80px for gloves
const MOBILE_BUTTON_HEIGHT = 'h-16'; // 64px minimum touch target
const MOBILE_SPACING = 'space-y-6'; // Extra spacing for mobile

export function SmartSuggestionReview({ 
  suggestions, 
  onReview, 
  onComplete,
  isProcessing = false 
}: SmartSuggestionReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<{ [key: string]: 'accept' | 'reject' }>({});
  const [reviewMode, setReviewMode] = useState<'batch' | 'progressive'>('batch');

  // Smart categorization: Separate low-risk (auto-approvable) from high-risk
  const { lowRiskSuggestions, highRiskSuggestions, totalValue } = useMemo(() => {
    const lowRisk: SmartSuggestion[] = [];
    const highRisk: SmartSuggestion[] = [];
    let totalValue = 0;

    suggestions.forEach(suggestion => {
      // Calculate total financial impact
      if (suggestion.estimatedValue) {
        totalValue += suggestion.estimatedValue;
      }

      // Smart defaults - low risk suggestions can be batch approved
      if (
        suggestion.confidence === 'HIGH' && 
        suggestion.businessRisk !== 'CRITICAL' &&
        suggestion.businessRisk !== 'HIGH' &&
        (!suggestion.estimatedValue || suggestion.estimatedValue < 1000) // Under €1000
      ) {
        lowRisk.push(suggestion);
      } else {
        highRisk.push(suggestion);
      }
    });

    return { lowRiskSuggestions: lowRisk, highRiskSuggestions: highRisk, totalValue };
  }, [suggestions]);

  // Determine review mode based on risk profile
  const shouldUseProgressiveReview = useMemo(() => {
    return (
      highRiskSuggestions.length > 0 || 
      totalValue > 1000 ||
      suggestions.some(s => s.type === 'safety' && s.businessRisk === 'CRITICAL')
    );
  }, [highRiskSuggestions, totalValue, suggestions]);

  // Handle batch approval for low-risk suggestions (95% case)
  const handleAcceptAll = useCallback(() => {
    const batchDecisions: { [key: string]: 'accept' | 'reject' } = {};
    
    // Accept all low-risk suggestions
    lowRiskSuggestions.forEach(suggestion => {
      batchDecisions[suggestion.id] = 'accept';
    });

    // If no high-risk items, complete immediately
    if (!shouldUseProgressiveReview) {
      onReview(batchDecisions);
      onComplete();
    } else {
      // Move to progressive review for high-risk items
      setDecisions(batchDecisions);
      setReviewMode('progressive');
    }
  }, [lowRiskSuggestions, shouldUseProgressiveReview, onReview, onComplete]);

  // Handle individual decision in progressive review
  const handleIndividualDecision = useCallback((suggestionId: string, decision: 'accept' | 'reject') => {
    const newDecisions = { ...decisions, [suggestionId]: decision };
    setDecisions(newDecisions);

    // Move to next high-risk item
    if (currentIndex < highRiskSuggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete review
      onReview(newDecisions);
      onComplete();
    }
  }, [decisions, currentIndex, highRiskSuggestions, onReview, onComplete]);

  // Skip to specific suggestion (for back navigation)
  const handleSkipTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Render batch review mode (95% of cases)
  if (reviewMode === 'batch' && !shouldUseProgressiveReview) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-4 ${MOBILE_SPACING}`}>
        {/* Header with confidence summary */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Smart Suggestions Ready
          </h3>
          <div className="text-sm text-gray-500">
            {suggestions.length} improvements found
          </div>
        </div>

        {/* Preview of main corrections - mobile optimized */}
        <div className="space-y-3 mb-6">
          {suggestions.slice(0, 3).map(suggestion => (
            <div key={suggestion.id} className={`bg-gray-50 rounded-lg p-3 ${MOBILE_TOUCH_HEIGHT}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-600 mb-1">{suggestion.reason}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 line-through text-sm">
                      {suggestion.original}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium text-sm">
                      {suggestion.suggested}
                    </span>
                  </div>
                </div>
                <ConfidenceBadge 
                  score={suggestion.confidence === 'HIGH' ? 90 : suggestion.confidence === 'MEDIUM' ? 75 : 50} 
                  label={suggestion.confidence} 
                  size="sm" 
                />
              </div>
            </div>
          ))}
          
          {suggestions.length > 3 && (
            <div className="text-sm text-gray-500 text-center">
              +{suggestions.length - 3} more improvements
            </div>
          )}
        </div>

        {/* Single Accept All CTA - optimized for gloves */}
        <div className="space-y-3">
          <button
            onClick={handleAcceptAll}
            disabled={isProcessing}
            className={`w-full ${MOBILE_BUTTON_HEIGHT} bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Accept All ({suggestions.length})</span>
              </>
            )}
          </button>

          {/* Review individually option */}
          <button
            onClick={() => setReviewMode('progressive')}
            disabled={isProcessing}
            className={`w-full ${MOBILE_BUTTON_HEIGHT} bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Review One by One</span>
          </button>
        </div>

        {/* Time estimate */}
        <div className="mt-4 text-center text-sm text-gray-500">
          ⏱ Estimated time: &lt; 30 seconds
        </div>
      </div>
    );
  }

  // Render batch review with high-risk items
  if (reviewMode === 'batch' && shouldUseProgressiveReview) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-4 ${MOBILE_SPACING}`}>
        {/* Risk warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0l-8.118 8.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-amber-800 font-medium">High-Risk Changes Detected</h4>
              <p className="text-amber-700 text-sm mt-1">
                {totalValue > 1000 && `Financial value: €${totalValue.toLocaleString()}`}
                {highRiskSuggestions.some(s => s.type === 'safety') && ' • Safety-related changes'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick approve low-risk */}
        {lowRiskSuggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Safe Changes ({lowRiskSuggestions.length})
            </h4>
            <button
              onClick={handleAcceptAll}
              disabled={isProcessing}
              className={`w-full ${MOBILE_BUTTON_HEIGHT} bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Accept Safe Changes & Continue</span>
            </button>
          </div>
        )}

        {/* Manual review required notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-red-800 font-medium">Manual Review Required</h4>
              <p className="text-red-700 text-sm mt-1">
                {highRiskSuggestions.length} high-risk changes need individual review
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render progressive review mode (5% of cases)
  const currentSuggestion = highRiskSuggestions[currentIndex];
  const progress = ((currentIndex + 1) / highRiskSuggestions.length) * 100;

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${MOBILE_SPACING}`}>
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Review Progress</span>
          <span>{currentIndex + 1} of {highRiskSuggestions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current suggestion */}
      {currentSuggestion && (
        <div className="mb-6">
          {/* Risk badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentSuggestion.businessRisk === 'CRITICAL' 
                ? 'bg-red-100 text-red-800' 
                : currentSuggestion.businessRisk === 'HIGH'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentSuggestion.businessRisk} RISK
            </div>
            <ConfidenceBadge 
              score={currentSuggestion.confidence === 'HIGH' ? 90 : currentSuggestion.confidence === 'MEDIUM' ? 75 : 50} 
              label={currentSuggestion.confidence} 
              size="sm" 
            />
          </div>

          {/* Change preview with context */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm font-medium text-gray-900 mb-2">
              {currentSuggestion.reason}
            </div>
            
            {/* Context display */}
            <div className="bg-white rounded p-3 font-mono text-sm">
              <span className="text-gray-600">{currentSuggestion.contextBefore}</span>
              <span className="bg-red-100 text-red-800 px-1 mx-1 line-through">
                {currentSuggestion.original}
              </span>
              <span className="bg-green-100 text-green-800 px-1 mx-1">
                {currentSuggestion.suggested}
              </span>
              <span className="text-gray-600">{currentSuggestion.contextAfter}</span>
            </div>

            {/* Financial impact */}
            {currentSuggestion.estimatedValue && (
              <div className="mt-3 text-sm text-gray-700">
                <strong>Financial Impact:</strong> €{currentSuggestion.estimatedValue.toLocaleString()}
              </div>
            )}
          </div>

          {/* Mobile-optimized decision buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleIndividualDecision(currentSuggestion.id, 'reject')}
              className={`${MOBILE_BUTTON_HEIGHT} bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Keep Original</span>
            </button>

            <button
              onClick={() => handleIndividualDecision(currentSuggestion.id, 'accept')}
              className={`${MOBILE_BUTTON_HEIGHT} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Accept Change</span>
            </button>
          </div>

          {/* Navigation helpers */}
          {currentIndex > 0 && (
            <button
              onClick={() => handleSkipTo(currentIndex - 1)}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          )}
        </div>
      )}

      {/* Time estimate for progressive review */}
      <div className="text-center text-sm text-gray-500">
        ⏱ Estimated time remaining: {Math.ceil((highRiskSuggestions.length - currentIndex) * 0.5)} minutes
      </div>
    </div>
  );
}

export default SmartSuggestionReview;