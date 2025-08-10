import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import TranscriptionCard from './TranscriptionCard';

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

interface ValidationSession {
  submissionId: string;
  audioUrl: string;
  audioDuration: number;
  corrections: TranscriptionCard[];
  originalTranscription: string;
  suggestedTranscription: string;
}

interface ValidationToolProps {
  session: ValidationSession;
  onValidationComplete: (decisions: ValidationDecision[]) => void;
  gloveMode?: boolean;
}

interface ValidationDecision {
  cardIndex: number;
  decision: 'approve' | 'reject' | 'edit';
  editedText?: string;
  timestamp: string;
}

export default function ValidationTool({ 
  session, 
  onValidationComplete, 
  gloveMode = false 
}: ValidationToolProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [decisions, setDecisions] = useState<ValidationDecision[]>([]);
  const [highlightedCard, setHighlightedCard] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle audio time updates for transcript synchronization
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    // Highlight current card based on audio position
    const activeCard = session.corrections.find(
      card => Math.abs(card.audioPosition - time) < 2 // 2 second tolerance
    );
    
    if (activeCard) {
      const cardIndex = session.corrections.indexOf(activeCard);
      setHighlightedCard(cardIndex);
    }
  };

  // Jump to specific audio position when card is clicked
  const handleCardClick = (card: TranscriptionCard) => {
    if (audioRef.current) {
      audioRef.current.currentTime = card.audioPosition;
      setCurrentTime(card.audioPosition);
    }
  };

  // Handle validation decisions
  const handleDecision = (cardIndex: number, decision: 'approve' | 'reject' | 'edit', editedText?: string) => {
    const newDecision: ValidationDecision = {
      cardIndex,
      decision,
      editedText,
      timestamp: new Date().toISOString()
    };

    setDecisions(prev => {
      const updated = prev.filter(d => d.cardIndex !== cardIndex);
      return [...updated, newDecision];
    });
  };

  // Complete validation session
  const handleCompleteValidation = () => {
    onValidationComplete(decisions);
  };

  // Calculate validation progress
  const validatedCount = decisions.length;
  const totalCount = session.corrections.length;
  const progressPercent = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;

  return (
    <div className="validation-tool max-w-7xl mx-auto p-4">
      {/* Header with progress */}
      <div className="validation-header mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Transcription Validation
          </h1>
          <div className="text-sm text-gray-600">
            Progress: {validatedCount}/{totalCount} ({Math.round(progressPercent)}%)
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main validation interface */}
      <div className="validation-interface grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left column: Audio player and original transcription */}
        <div className="audio-section">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Audio & Original Transcription</h2>
            
            {/* Audio player with glove-friendly controls */}
            <AudioPlayer
              ref={audioRef}
              src={session.audioUrl}
              duration={session.audioDuration}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              gloveMode={gloveMode}
            />
            
            {/* Original transcription display */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Transcription:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
                {session.originalTranscription}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Validation cards */}
        <div className="validation-cards">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Suggested Corrections ({session.corrections.length})
            </h2>
            
            {/* Correction cards stack */}
            <div className="corrections-stack space-y-4 max-h-96 overflow-y-auto">
              {session.corrections.map((card, index) => (
                <TranscriptionCard
                  key={index}
                  card={card}
                  index={index}
                  isHighlighted={highlightedCard === index}
                  decision={decisions.find(d => d.cardIndex === index)}
                  onCardClick={() => handleCardClick(card)}
                  onDecision={(decision, editedText) => handleDecision(index, decision, editedText)}
                  gloveMode={gloveMode}
                />
              ))}
            </div>

            {/* Validation actions */}
            <div className="validation-actions mt-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    // Approve all remaining corrections
                    session.corrections.forEach((_, index) => {
                      if (!decisions.find(d => d.cardIndex === index)) {
                        handleDecision(index, 'approve');
                      }
                    });
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ minHeight: gloveMode ? '48px' : '40px' }}
                >
                  ✅ Approve All Remaining
                </button>
                
                <button
                  onClick={handleCompleteValidation}
                  disabled={validatedCount === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ minHeight: gloveMode ? '48px' : '40px' }}
                >
                  🚀 Complete Validation ({validatedCount})
                </button>
              </div>
              
              {/* Legend */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-2">Confidence Levels:</div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Low (&lt;80%) - Needs review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Medium (80-94%) - Worth checking</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>High (95%+) - Likely correct</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-first responsive adjustments */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .validation-interface {
            grid-template-columns: 1fr;
          }
          
          .audio-section {
            order: 1;
          }
          
          .validation-cards {
            order: 2;
          }
        }
        
        @media (max-width: 640px) {
          .validation-tool {
            padding: 1rem;
          }
          
          .corrections-stack {
            max-height: 60vh;
          }
        }
      `}</style>
    </div>
  );
}