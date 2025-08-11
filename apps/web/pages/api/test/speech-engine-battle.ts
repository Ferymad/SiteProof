/**
 * Speech Engine Battle Test API Endpoint
 * Story 1A.2.10: Test AssemblyAI vs Deepgram vs Whisper
 * 
 * POST /api/test/speech-engine-battle
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechEngineBattleTestService } from '@/lib/services/speech-engine-battle-test.service';

// EMERGENCY SECURITY CHECK: Ensure this endpoint runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: Speech engine battle test must run server-side only. ' +
    'This endpoint contains API keys and must not be exposed to the browser.'
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to start battle test' 
    });
  }
  
  // Basic authentication check
  const { authorization } = req.headers;
  if (!authorization || !authorization.includes('Bearer')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key required for battle test' 
    });
  }

  try {
    console.log('🎯 Starting Speech Engine Battle Test API call...');
    
    const battleTestService = new SpeechEngineBattleTestService();
    
    // Get configuration from request body
    const { 
      testMode = 'full',
      maxSamples = 3,
      includeDeepgram = true 
    } = req.body || {};
    
    console.log('Battle test configuration:', {
      testMode,
      maxSamples,
      includeDeepgram,
      timestamp: new Date().toISOString()
    });
    
    // Run the battle test
    const startTime = Date.now();
    const results = await battleTestService.runBattleTest();
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('✅ Battle test completed in', totalTime, 'seconds');
    
    // Format results for API response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      battleTest: {
        winner: results.winner,
        recommendation: results.recommendation,
        totalTime,
        results: results.results.map(result => ({
          engine: result.engine,
          accuracy: result.accuracy,
          cost: result.cost,
          processingTime: result.processingTime,
          constructionTermsRecognized: result.constructionTermsRecognized,
          criticalErrorsFixed: result.criticalErrorsFixed.length,
          samplesProcessed: result.samples.length,
          // Include sample details for debugging
          sampleDetails: result.samples.map(sample => ({
            audioFile: sample.audioFile,
            accuracy: sample.accuracy,
            cost: sample.cost,
            constructionTermsFound: sample.constructionTermsFound.length,
            criticalErrors: sample.criticalErrors.length
          }))
        }))
      },
      mvpCriteria: {
        accuracyThreshold: 85,
        costThreshold: 0.01,
        met: results.winner !== 'NO_WINNER_MEETS_REQUIREMENTS'
      },
      nextSteps: results.winner !== 'NO_WINNER_MEETS_REQUIREMENTS' 
        ? [
            `Deploy ${results.winner} as primary engine`,
            'Configure production API keys',
            'Set up fallback to current system',
            'Monitor accuracy and costs',
            'Update transcription service'
          ]
        : [
            'No engine meets MVP requirements',
            'Consider hybrid approach with human validation',
            'Investigate custom model training',
            'Review audio quality requirements'
          ]
    };
    
    // Log summary for monitoring
    console.log('📊 Battle Test Summary:', {
      winner: results.winner,
      enginesCount: results.results.length,
      mvpReady: results.winner !== 'NO_WINNER_MEETS_REQUIREMENTS'
    });
    
    return res.status(200).json(response);
    
  } catch (error: unknown) {
    console.error('❌ Battle test API error:', error);
    
    // Return appropriate error response
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        type: 'BATTLE_TEST_FAILED',
        message: error instanceof Error ? (error.message || 'Unknown error during battle test') : 'Unknown error during battle test',
        details: error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 3) : []
      },
      troubleshooting: [
        'Check API keys are configured: ASSEMBLYAI_API_KEY, DEEPGRAM_API_KEY',
        'Ensure test audio samples are available in Supabase storage',
        'Verify network connectivity to speech services',
        'Check server logs for detailed error information'
      ]
    };
    
    // Different status codes based on error type
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('API_KEY') || errorMessage.includes('unauthorized')) {
      return res.status(401).json(errorResponse);
    } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return res.status(503).json(errorResponse);
    } else {
      return res.status(500).json(errorResponse);
    }
  }
}

/**
 * API Documentation
 * 
 * POST /api/test/speech-engine-battle
 * Authorization: Bearer <API_KEY>
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "testMode": "full" | "quick",
 *   "maxSamples": number,
 *   "includeDeepgram": boolean
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "timestamp": "2025-01-10T...",
 *   "battleTest": {
 *     "winner": "AssemblyAI" | "Deepgram" | "Whisper" | "NO_WINNER_MEETS_REQUIREMENTS",
 *     "recommendation": "RECOMMENDED: Migrate to AssemblyAI...",
 *     "totalTime": 45.2,
 *     "results": [
 *       {
 *         "engine": "AssemblyAI",
 *         "accuracy": 93.4,
 *         "cost": 0.00225,
 *         "processingTime": 12.5,
 *         "constructionTermsRecognized": 18,
 *         "criticalErrorsFixed": 3,
 *         "samplesProcessed": 3
 *       }
 *     ]
 *   },
 *   "mvpCriteria": {
 *     "accuracyThreshold": 85,
 *     "costThreshold": 0.01,
 *     "met": true
 *   },
 *   "nextSteps": [...]
 * }
 * 
 * Response (Error):
 * {
 *   "success": false,
 *   "timestamp": "2025-01-10T...",
 *   "error": {
 *     "type": "BATTLE_TEST_FAILED",
 *     "message": "ASSEMBLYAI_API_KEY not configured",
 *     "details": [...]
 *   },
 *   "troubleshooting": [...]
 * }
 */