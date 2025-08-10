/**
 * Simple Validation API Endpoint
 * Story 1A.3 - Clean MVP Implementation
 * 
 * GET /api/simple-validation/[id] - Fetch validation session
 * POST /api/simple-validation/[id] - Submit validation decisions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: submissionId } = req.query;

  if (!submissionId || typeof submissionId !== 'string') {
    return res.status(400).json({ error: 'Invalid submission ID' });
  }

  // GET: Fetch validation session
  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching validation session:', submissionId);

      // Get submission from database
      const { data: submission, error } = await supabase
        .from('whatsapp_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        return res.status(404).json({ 
          error: 'Validation session not found',
          submissionId 
        });
      }

      // Generate suggestions if not already present
      let suggestions = [];
      if (submission.raw_transcription) {
        const suggestionResult = await smartSuggestionService.generateSuggestions({
          text: submission.raw_transcription,
          confidence: submission.confidence_score || 85,
        });
        suggestions = suggestionResult.suggestions;
      }

      // Format for ValidationTool
      const corrections = suggestions.map((sugg: any, index: number) => ({
        confidence: sugg.confidence?.toLowerCase() || 'medium',
        original: sugg.original,
        suggested: sugg.suggested,
        timestamp: `0:${Math.floor(index * 5)}`, // Mock timestamps
        audioPosition: index * 5,
        category: sugg.type?.toUpperCase() || 'GENERAL',
        quickActions: ['approve', 'reject', 'edit'],
        gloveMode: false,
      }));

      return res.status(200).json({
        submissionId: submission.id,
        audioUrl: submission.voice_file_path || '',
        audioDuration: 45, // Mock duration
        transcription: submission.raw_transcription || '',
        corrections,
        originalTranscription: submission.raw_transcription || '',
        suggestedTranscription: submission.transcription || '',
      });

    } catch (error: any) {
      console.error('❌ Fetch session error:', error);
      return res.status(500).json({
        error: 'Failed to fetch session',
        details: error.message,
      });
    }
  }

  // POST: Submit validation decisions
  if (req.method === 'POST') {
    try {
      console.log('✅ Processing validation decisions:', submissionId);

      const { decisions } = req.body;

      if (!decisions || !Array.isArray(decisions)) {
        return res.status(400).json({ error: 'Invalid decisions format' });
      }

      // Get current submission
      const { data: submission, error: fetchError } = await supabase
        .from('whatsapp_submissions')
        .select('raw_transcription, transcription')
        .eq('id', submissionId)
        .single();

      if (fetchError || !submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Apply decisions to transcription
      let finalText = submission.raw_transcription || '';
      
      // Process each decision
      decisions.forEach((decision: any) => {
        if (decision.action === 'approve' && decision.suggested) {
          // Apply the suggestion
          finalText = finalText.replace(decision.original, decision.suggested);
        } else if (decision.action === 'edit' && decision.editedText) {
          // Apply custom edit
          finalText = finalText.replace(decision.original, decision.editedText);
        }
        // 'reject' keeps original text
      });

      // Update database with validated transcription
      const { error: updateError } = await supabase
        .from('whatsapp_submissions')
        .update({
          transcription: finalText,
          processing_status: 'completed',
          processing_stage: 'validated',
          disambiguation_log: JSON.stringify(decisions),
          completed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) {
        throw new Error('Failed to update submission');
      }

      return res.status(200).json({
        success: true,
        submissionId,
        finalTranscription: finalText,
        decisionsApplied: decisions.length,
      });

    } catch (error: any) {
      console.error('❌ Submit decisions error:', error);
      return res.status(500).json({
        error: 'Failed to process decisions',
        details: error.message,
      });
    }
  }

  // Other methods not allowed
  return res.status(405).json({ 
    error: 'Method not allowed',
    allowed: ['GET', 'POST']
  });
}