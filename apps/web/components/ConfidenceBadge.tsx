import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({ 
  score, 
  label = 'Confidence', 
  showPercentage = true,
  size = 'md' 
}: ConfidenceBadgeProps) {
  // Determine color scheme based on confidence score
  const getConfidenceStyle = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
        dot: 'bg-green-500'
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500'
      };
    } else {
      return {
        bg: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-800',
        dot: 'bg-red-500'
      };
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 85) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const style = getConfidenceStyle(score);
  const confidenceLevel = getConfidenceLabel(score);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`inline-flex items-center rounded-full border ${style.bg} ${style.border} ${style.text} ${sizeClasses}`}>
      <div className={`w-2 h-2 rounded-full ${style.dot} mr-2`}></div>
      <span className="font-medium">
        {label}: {confidenceLevel}
        {showPercentage && (
          <span className="ml-1 font-normal">({score}%)</span>
        )}
      </span>
    </div>
  );
}

// Additional confidence indicator for construction-specific contexts
interface ConstructionConfidenceProps {
  transcriptionScore?: number;
  extractionScore?: number;
  combinedScore: number;
  hasHighValueItems?: boolean;
  isFridayAfternoon?: boolean;
}

export function ConstructionConfidenceDisplay({
  transcriptionScore,
  extractionScore,
  combinedScore,
  hasHighValueItems = false,
  isFridayAfternoon = false
}: ConstructionConfidenceProps) {
  return (
    <div className="space-y-2">
      {/* Combined score - most prominent */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="font-semibold text-gray-700">Overall Processing</span>
        <ConfidenceBadge score={combinedScore} label="" size="lg" />
      </div>
      
      {/* Individual scores */}
      <div className="grid grid-cols-2 gap-2">
        {transcriptionScore !== undefined && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Transcription</div>
            <ConfidenceBadge score={transcriptionScore} label="" size="sm" />
          </div>
        )}
        
        {extractionScore !== undefined && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Data Extraction</div>
            <ConfidenceBadge score={extractionScore} label="" size="sm" />
          </div>
        )}
      </div>
      
      {/* Context warnings */}
      {hasHighValueItems && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>High-value items detected - recommend manual review</span>
        </div>
      )}
      
      {isFridayAfternoon && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Friday afternoon processing - expedited review mode</span>
        </div>
      )}
    </div>
  );
}

export default ConfidenceBadge;