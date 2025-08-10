import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SmartSuggestionService } from '@/lib/services/smart-suggestion.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    if (req.method === 'GET') {
      // Get validation session data
      const { data: submission, error } = await supabase
        .from('whatsapp_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !submission) {
        return res.status(404).json({ error: 'Validation session not found' });
      }

      // Generate smart suggestions if we have transcription
      let corrections: TranscriptionCard[] = [];
      let suggestedTranscription = submission.transcription || '';

      if (submission.transcription) {
        const suggestionService = SmartSuggestionService.getInstance();
        const analysis = await suggestionService.generateSuggestions({
          text: submission.transcription,
          confidence: submission.confidence_score || 75,
          audioQuality: 80,
          submissionId: id
        });

        // Convert smart suggestions to TranscriptionCard format
        corrections = analysis.suggestions.map((suggestion, index) => ({
          confidence: suggestion.confidence >= 80 ? 'high' : 
                     suggestion.confidence >= 60 ? 'medium' : 'low',
          original: suggestion.original,
          suggested: suggestion.suggested,
          timestamp: suggestion.timestamp || '00:00',
          audioPosition: suggestion.position || 0,
          category: suggestion.category as 'TIME' | 'SAFETY' | 'MATERIAL' | 'LOCATION',
          quickActions: ['approve', 'reject', 'edit'] as ['approve', 'reject', 'edit'],
          gloveMode: false
        }));

        // Apply suggestions to create suggested transcription
        suggestedTranscription = analysis.suggestions.reduce((text, suggestion) => {
          return text.replace(suggestion.original, suggestion.suggested);
        }, submission.transcription);
      }

      const validationSession: ValidationSession = {
        submissionId: id,
        audioUrl: submission.voice_file_path || '/api/placeholder-audio',
        audioDuration: 120, // Default 2 minutes - will be actual duration later
        corrections,
        originalTranscription: submission.transcription || 'No transcription available',
        suggestedTranscription
      };

      return res.status(200).json(validationSession);

    } else if (req.method === 'POST') {
      // Save validation decisions
      const { decisions }: { decisions: ValidationDecision[] } = req.body;

      if (!Array.isArray(decisions)) {
        return res.status(400).json({ error: 'Invalid decisions format' });
      }

      // Apply decisions to create final transcription
      const { data: submission } = await supabase
        .from('whatsapp_submissions')
        .select('transcription')
        .eq('id', id)
        .single();

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // For now, just store the decisions in processing_metadata
      const { error: updateError } = await supabase
        .from('whatsapp_submissions')
        .update({
          transcription_metadata: {
            validation_decisions: decisions,
            validation_completed_at: new Date().toISOString(),
            validation_session_id: id
          },
          processing_status: 'validated'
        })
        .eq('id', id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to save validation decisions' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Validation decisions saved successfully' 
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not allowed` });
    }

  } catch (error) {
    console.error('Validation API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}