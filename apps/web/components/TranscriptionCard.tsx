import React, { useState } from 'react';

// Exact interface from requirements
interface TranscriptionCard {
  confidence: 'high' | 'medium' | 'low';
  original: string;
  suggested: string;
  timestamp: string;
  audioPosition: number;
  category: 'TIME' | 'SAFETY' | 'MATERIAL' | 'LOCATION';
  quickActions: ['approve', 'reject', 'edit'];
  gloveMode: boolean;
}

interface ValidationDecision {
  cardIndex: number;
  decision: 'approve' | 'reject' | 'edit';
  editedText?: string;
  timestamp: string;
}

interface TranscriptionCardProps {
  card: TranscriptionCard;
  index: number;
  isHighlighted: boolean;
  decision?: ValidationDecision;
  onCardClick: () => void;
  onDecision: (decision: 'approve' | 'reject' | 'edit', editedText?: string) => void;
  gloveMode: boolean;
}

export default function TranscriptionCard({
  card,
  index,
  isHighlighted,
  decision,
  onCardClick,
  onDecision,
  gloveMode
}: TranscriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card.suggested);

  // Get confidence color based on requirements
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'low': return 'bg-red-100 border-red-300 text-red-800'; // <80%
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800'; // 80-94%
      case 'high': return 'bg-green-100 border-green-300 text-green-800'; // 95%+
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'low': return '🔴';
      case 'medium': return '🟡';
      case 'high': return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category: 'TIME' | 'SAFETY' | 'MATERIAL' | 'LOCATION') => {
    switch (category) {
      case 'TIME': return '⏰';
      case 'SAFETY': return '⚠️';
      case 'MATERIAL': return '🏗️';
      case 'LOCATION': return '📍';
      default: return '📝';
    }
  };

  const handleApprove = () => {
    onDecision('approve');
  };

  const handleReject = () => {
    onDecision('reject');
  };

  const handleEdit = () => {
    if (isEditing) {
      onDecision('edit', editText);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditText(card.suggested);
    setIsEditing(false);
  };

  // Format timestamp for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get decision status styling
  const getDecisionStatus = () => {
    if (!decision) return '';
    
    switch (decision.decision) {
      case 'approve': return 'border-green-500 bg-green-50';
      case 'reject': return 'border-red-500 bg-red-50';
      case 'edit': return 'border-blue-500 bg-blue-50';
      default: return '';
    }
  };

  const buttonHeight = gloveMode ? '48px' : '40px';

  return (
    <div 
      className={`transcription-card p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
        isHighlighted ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      } ${getDecisionStatus()}`}
      onClick={onCardClick}
    >
      {/* Card header */}
      <div className="card-header flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="confidence-indicator">{getConfidenceIcon(card.confidence)}</span>
          <span className="category-icon">{getCategoryIcon(card.category)}</span>
          <span className="text-sm text-gray-600">{card.category}</span>
          <span className="timestamp text-xs text-gray-500">
            @ {formatTime(card.audioPosition)}
          </span>
        </div>
        
        {/* Confidence badge */}
        <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(card.confidence)}`}>
          {card.confidence.toUpperCase()}
        </div>
      </div>

      {/* Original vs Suggested comparison */}
      <div className="comparison-section mb-4">
        <div className="grid grid-cols-1 gap-3">
          {/* Original text */}
          <div className="original-text">
            <div className="text-xs text-gray-600 mb-1">Original:</div>
            <div className="bg-gray-100 p-2 rounded text-sm font-mono">
              "{card.original}"
            </div>
          </div>
          
          {/* Suggested text */}
          <div className="suggested-text">
            <div className="text-xs text-gray-600 mb-1">Suggested:</div>
            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 border rounded text-sm font-mono resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="bg-blue-100 p-2 rounded text-sm font-mono">
                "{decision?.decision === 'edit' ? decision.editedText : card.suggested}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - 48px minimum for gloves */}
      <div className="action-buttons grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleApprove}
          disabled={decision?.decision === 'approve'}
          className={`approve-btn flex items-center justify-center gap-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
            decision?.decision === 'approve'
              ? 'bg-green-200 text-green-800 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          style={{ minHeight: buttonHeight }}
        >
          ✅ {decision?.decision === 'approve' ? 'Approved' : 'Approve'}
        </button>
        
        <button
          onClick={handleReject}
          disabled={decision?.decision === 'reject'}
          className={`reject-btn flex items-center justify-center gap-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
            decision?.decision === 'reject'
              ? 'bg-red-200 text-red-800 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          style={{ minHeight: buttonHeight }}
        >
          ❌ {decision?.decision === 'reject' ? 'Rejected' : 'Reject'}
        </button>
        
        <button
          onClick={isEditing ? handleEdit : () => setIsEditing(true)}
          className={`edit-btn flex items-center justify-center gap-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
            decision?.decision === 'edit'
              ? 'bg-blue-200 text-blue-800'
              : isEditing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          style={{ minHeight: buttonHeight }}
        >
          ✏️ {decision?.decision === 'edit' ? 'Edited' : isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Cancel edit button when editing */}
      {isEditing && (
        <div className="mt-2">
          <button
            onClick={handleCancelEdit}
            className="cancel-edit w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium text-sm transition-colors"
            style={{ minHeight: buttonHeight }}
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Decision timestamp */}
      {decision && (
        <div className="decision-info mt-2 pt-2 border-t text-xs text-gray-500">
          Decision made: {new Date(decision.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* Mobile responsive adjustments */}
      <style>{`
        @media (max-width: 640px) {
          .comparison-section {
            margin-bottom: 1rem;
          }
          
          .action-buttons {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .transcription-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}