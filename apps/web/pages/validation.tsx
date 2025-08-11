import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ValidationTool from '@/components/ValidationTool';

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

interface ValidationDecision {
  cardIndex: number;
  decision: 'approve' | 'reject' | 'edit';
  editedText?: string;
  timestamp: string;
}

export default function ValidationPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load validation session with submission ID from URL
  useEffect(() => {
    if (router.isReady) {
      loadValidationSession();
    }
  }, [router.isReady, router.query.id]);

  const loadValidationSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get submission ID from URL query parameters
      const submissionId = router.query.id as string;
      
      if (!submissionId) {
        console.error('No submission ID provided');
        setError('No submission ID provided in URL');
        setLoading(false);
        return;
      }
      
      // Fetch validation session from our new API
      const response = await fetch(`/api/validation/${submissionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch validation session: ${response.status}`);
      }
      
      const sessionData = await response.json();
      setSession(sessionData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading validation session:', error);
      setError('Failed to load validation session. Please try again.');
      setLoading(false);
      
      // Fallback to mock data for development
      const mockSession: ValidationSession = {
        submissionId: 'mock',
        audioUrl: '/audio/sample-construction-voice.mp3',
        audioDuration: 45,
        originalTranscription: "delivery at 30 and safe farming project needs 50 pounds of concrete",
        suggestedTranscription: "delivery at 8:30 and safe working project needs 50 euros of concrete",
        corrections: [
          {
            confidence: 'high',
            original: 'at 30',
            suggested: 'at 8:30',
            timestamp: '00:15',
            audioPosition: 15,
            category: 'TIME',
            quickActions: ['approve', 'reject', 'edit'],
            gloveMode: false
          },
          {
            confidence: 'medium',
            original: 'pounds',
            suggested: 'euros',
            timestamp: '00:35',
            audioPosition: 35,
            category: 'MATERIAL',
            quickActions: ['approve', 'reject', 'edit'],
            gloveMode: false
          }
        ]
      };
      setSession(mockSession);
      setError(null);
    }
  };

  const handleValidationComplete = async (decisions: ValidationDecision[]) => {
    try {
      console.log('Validation completed with decisions:', decisions);
      
      if (session?.submissionId && session.submissionId !== 'mock') {
        // Send decisions to API
        const response = await fetch(`/api/validation/${session.submissionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decisions }),
        });

        if (!response.ok) {
          throw new Error('Failed to save validation decisions');
        }

        const result = await response.json();
        console.log('Validation decisions saved:', result);
      }
      
      // Redirect to results page instead of showing alert
      router.push('/results');
      
    } catch (error) {
      console.error('Error saving validation decisions:', error);
      alert('Failed to save validation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="validation-page min-h-screen bg-gray-50">
        <Head>
          <title>Transcription Validation - BMAD Construction</title>
          <meta name="description" content="AI-powered transcription validation for construction sites" />
        </Head>
        
        <div className="loading-container flex items-center justify-center min-h-screen">
          <div className="loading-content text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Validation Session</h2>
            <p className="text-gray-600">Preparing transcription data and audio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="validation-page min-h-screen bg-gray-50">
        <Head>
          <title>Transcription Validation - BMAD Construction</title>
          <meta name="description" content="AI-powered transcription validation for construction sites" />
        </Head>
        
        <div className="error-container flex items-center justify-center min-h-screen">
          <div className="error-content text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Session</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadValidationSession}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="validation-page min-h-screen bg-gray-50">
      <Head>
        <title>Transcription Validation - BMAD Construction</title>
        <meta name="description" content="AI-powered transcription validation for construction sites" />
      </Head>

      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/upload')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                🎙️ New Upload
              </button>
              <button
                onClick={() => router.push('/results')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                📊 View All Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {session && (
        <ValidationTool 
          session={session} 
          onValidationComplete={handleValidationComplete}
          gloveMode={false}
        />
      )}
    </div>
  );
}