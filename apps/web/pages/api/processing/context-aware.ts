/**
 * Story 1A.2.3: Context-Aware Processing API Endpoint
 * SiteProof - Construction Evidence Machine
 * 
 * Advanced three-pass processing endpoint with A/B testing capability
 * 
 * POST /api/processing/context-aware
 * - Supports all advanced processing features
 * - A/B testing against legacy system
 * - Real-time progress updates via WebSocket (future)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AdvancedProcessorService, AdvancedProcessingRequest, AdvancedProcessingResponse } from '@/lib/services/advanced-processor.service';
import { ExtractionService } from '@/lib/services/extraction.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Request body interface for context-aware processing
 */
interface ContextAwareProcessingRequestBody {
  // Core parameters (matches frontend structure)
  submission_id: string;
  user_id: string;
  
  // Optional processing configuration
  processing_options?: {
    skip_context_detection?: boolean;
    skip_disambiguation?: boolean;
    max_processing_time?: number;
  };
  
  // A/B Testing
  enable_ab_testing?: boolean;
  
  // Client metadata
  client_info?: {
    version: string;
    platform: string;
    user_agent?: string;
  };
}

/**
 * Response interface matching Django REST Framework structure
 */
interface ContextAwareProcessingResponseBody {
  // Success response
  success: boolean;
  data?: AdvancedProcessingResponse;
  
  // Error response  
  error?: string;
  error_code?: string;
  
  // API metadata
  api_version: string;
  processing_method: string;
  request_id: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContextAwareProcessingResponseBody>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      error_code: 'METHOD_NOT_ALLOWED',
      api_version: '1A.2.3',
      processing_method: 'context_aware_advanced',
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }

  console.log('🚀 Context-aware processing request received:', {
    requestId,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type']
  });

  try {
    // Validate and parse request body
    const body: ContextAwareProcessingRequestBody = req.body;
    
    console.log('📋 Request body received:', JSON.stringify({
      submission_id: body.submission_id,
      user_id: body.user_id,
      enable_ab_testing: body.enable_ab_testing
    }));
    
    // Input validation
    const validationError = validateProcessingRequest(body);
    if (validationError) {
      console.error('❌ Validation failed:', validationError);
      return res.status(400).json({
        success: false,
        error: validationError,
        error_code: 'VALIDATION_ERROR',
        api_version: '1A.2.3',
        processing_method: 'context_aware_advanced',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Request validation passed:', {
      submissionId: body.submission_id,
      enableABTesting: body.enable_ab_testing || false,
      options: body.processing_options
    });

    // CRITICAL FIX: Fetch voice_file_url from database using submission_id
    console.log('🔍 Fetching submission data from database...');
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('whatsapp_submissions')
      .select('voice_file_path, user_id')
      .eq('id', body.submission_id)
      .single();
    
    if (fetchError || !submission) {
      console.error('❌ Failed to fetch submission:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Submission not found or inaccessible',
        error_code: 'SUBMISSION_NOT_FOUND',
        api_version: '1A.2.3',
        processing_method: 'context_aware_advanced',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    if (!submission.voice_file_path) {
      console.error('❌ No voice file path in submission');
      return res.status(400).json({
        success: false,
        error: 'No voice file path found for this submission',
        error_code: 'MISSING_VOICE_FILE',
        api_version: '1A.2.3',
        processing_method: 'context_aware_advanced',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Submission data fetched:', {
      submissionId: body.submission_id,
      hasVoiceFile: !!submission.voice_file_path,
      voiceFilePath: submission.voice_file_path.substring(0, 50) + '...'
    });

    // Create advanced processing service instance
    const processorService = new AdvancedProcessorService();
    
    // Build processing request with file path from database
    const processingRequest: AdvancedProcessingRequest = {
      fileUrl: submission.voice_file_path, // FIXED: Get from database, not request body
      userId: body.user_id,
      submissionId: body.submission_id,
      enableABTesting: body.enable_ab_testing,
      processingOptions: body.processing_options ? {
        skipContextDetection: body.processing_options.skip_context_detection,
        skipDisambiguation: body.processing_options.skip_disambiguation,
        maxProcessingTime: body.processing_options.max_processing_time
      } : undefined
    };

    // Execute advanced processing pipeline
    console.log('🔄 Starting advanced processing pipeline...');
    const startTime = Date.now();
    
    const processingResult = await processorService.processAdvanced(processingRequest);
    
    const totalTime = Date.now() - startTime;
    console.log('✅ Advanced processing complete:', {
      requestId,
      totalTime,
      status: processingResult.processing_status,
      confidence: processingResult.overallConfidence,
      improvements: processingResult.improvement_metrics.disambiguation_count
    });

    // CRITICAL FIX: Add extraction service call (missing from GPT-5 system)
    console.log('📊 Starting data extraction from GPT-5 transcription...');
    const extractionService = new ExtractionService();
    let extractionResult = null;
    
    try {
      extractionResult = await extractionService.extractData({
        transcription: processingResult.finalTranscription,
        whatsappText: undefined, // GPT-5 system is voice-only
        userId: body.user_id,
        submissionId: body.submission_id
      });
      
      if (extractionResult?.status === 'failed') {
        console.warn('⚠️ Extraction failed, using empty data:', extractionResult.error);
      } else {
        console.log('✅ Extraction complete:', {
          amounts: extractionResult?.extracted_data?.amounts?.length || 0,
          materials: extractionResult?.extracted_data?.materials?.length || 0,
          dates: extractionResult?.extracted_data?.dates?.length || 0,
          safety_concerns: extractionResult?.extracted_data?.safety_concerns?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Extraction service error:', error);
      extractionResult = null;
    }

    // Transform to match UI expectations - flatten the response
    const uiResponse = {
      // Core fields expected by ProcessingStatus component
      transcription: processingResult.finalTranscription,
      transcription_confidence: processingResult.overallConfidence,
      extracted_data: extractionResult?.extracted_data || {
        amounts: [],
        materials: [],
        dates: [],
        safety_concerns: [],
        work_status: null
      },
      processing_cost: processingResult.total_cost_estimate + (extractionResult?.processing_time ? 0.001 : 0),
      processing_system: 'gpt5_context_aware',
      
      // GPT-5 specific fields
      context_detection: {
        detected_type: processingResult.pass2_context.contextType,
        confidence: processingResult.pass2_context.confidence / 100, // Convert to decimal
        indicators: processingResult.pass2_context.keyIndicators
      },
      disambiguation_log: processingResult.pass3_disambiguation.changes.map(change => ({
        original: change.originalTerm,
        corrected: change.suggestedReplacement,
        reason: change.reasoning || 'Context-aware correction',
        confidence: change.confidence
      })),
      
      // Processing metadata
      processing_time: {
        total: processingResult.total_processing_time / 1000, // Convert to seconds
        transcription: processingResult.debug_info?.pass1_duration ? processingResult.debug_info.pass1_duration / 1000 : 0,
        extraction: ((processingResult.debug_info?.pass2_duration || 0) + (processingResult.debug_info?.pass3_duration || 0)) / 1000
      },
      
      // Include raw response for debugging
      _raw_gpt5_response: processingResult,
      
      // API metadata
      success: true,
      api_version: '1A.2.3',
      processing_method: 'context_aware_advanced',
      request_id: requestId,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 API Response being sent to UI:', JSON.stringify(uiResponse, null, 2));

    // Return appropriate HTTP status based on processing result
    const httpStatus = processingResult.processing_status === 'completed' ? 200 :
                      processingResult.processing_status === 'partial' ? 206 : 500;

    res.status(httpStatus).json(uiResponse);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Context-aware processing error:', {
      requestId,
      error: errorMessage,
      stack: errorStack
    });

    // Determine error type and appropriate response
    const errorCode = getErrorCode(error);
    const httpStatus = getErrorHttpStatus(errorCode);

    const errorResponse: ContextAwareProcessingResponseBody = {
      success: false,
      error: getUserFriendlyError(error),
      error_code: errorCode,
      api_version: '1A.2.3',
      processing_method: 'context_aware_advanced',
      request_id: requestId,
      timestamp: new Date().toISOString()
    };

    res.status(httpStatus).json(errorResponse);
  }
}

/**
 * Validate incoming processing request
 */
function validateProcessingRequest(body: ContextAwareProcessingRequestBody): string | null {
  if (!body) {
    return 'Request body is required';
  }

  if (!body.user_id || typeof body.user_id !== 'string') {
    return 'user_id is required and must be a string';
  }

  if (!body.submission_id || typeof body.submission_id !== 'string') {
    return 'submission_id is required and must be a string';
  }

  // REMOVED file_url validation - we fetch it from database instead

  // Validate processing options if provided
  if (body.processing_options) {
    if (body.processing_options.max_processing_time && 
        (body.processing_options.max_processing_time < 30000 || body.processing_options.max_processing_time > 600000)) {
      return 'max_processing_time must be between 30 seconds and 10 minutes';
    }
  }

  return null; // No validation errors
}

/**
 * Get error code from error object
 */
function getErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  
  if (message.includes('api key') || message.includes('unauthorized')) {
    return 'API_KEY_ERROR';
  }
  if (message.includes('rate limit') || message.includes('quota')) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  if (message.includes('transcription') || message.includes('whisper')) {
    return 'TRANSCRIPTION_FAILED';
  }
  if (message.includes('context') || message.includes('detection')) {
    return 'CONTEXT_DETECTION_FAILED';
  }
  if (message.includes('disambiguation')) {
    return 'DISAMBIGUATION_FAILED';
  }
  if (message.includes('storage') || message.includes('file')) {
    return 'FILE_ACCESS_ERROR';
  }
  if (message.includes('database') || message.includes('supabase')) {
    return 'DATABASE_ERROR';
  }
  if (message.includes('timeout')) {
    return 'PROCESSING_TIMEOUT';
  }
  
  return 'INTERNAL_SERVER_ERROR';
}

/**
 * Get appropriate HTTP status for error code
 */
function getErrorHttpStatus(errorCode: string): number {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'API_KEY_ERROR':
      return 401;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'FILE_ACCESS_ERROR':
      return 404;
    case 'PROCESSING_TIMEOUT':
      return 408;
    case 'TRANSCRIPTION_FAILED':
    case 'CONTEXT_DETECTION_FAILED':
    case 'DISAMBIGUATION_FAILED':
      return 422; // Unprocessable Entity
    case 'DATABASE_ERROR':
    case 'INTERNAL_SERVER_ERROR':
    default:
      return 500;
  }
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  
  if (message.includes('api key')) {
    return 'AI service configuration error. Please contact support.';
  }
  if (message.includes('rate limit') || message.includes('quota')) {
    return 'Service temporarily busy. Please try again in a moment.';
  }
  if (message.includes('transcription')) {
    return 'Unable to transcribe audio. Please check audio quality and try again.';
  }
  if (message.includes('context')) {
    return 'Context analysis failed. Falling back to basic processing.';
  }
  if (message.includes('file') || message.includes('storage')) {
    return 'Audio file not found or inaccessible. Please re-upload the file.';
  }
  if (message.includes('timeout')) {
    return 'Processing is taking longer than expected. Please try with a shorter audio file.';
  }
  if (message.includes('format') || message.includes('size')) {
    return 'Audio file format or size not supported. Please use MP3, M4A, or WAV files under 25MB.';
  }
  
  return 'Processing failed due to an unexpected error. Please try again or contact support.';
}