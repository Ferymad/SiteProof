import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Story 1A.3: Evidence Package Generation - PDF Generation Endpoint
 * 
 * This endpoint will generate professional PDF evidence packages
 * Structured for easy migration to Django: /api/evidence/generate/
 * 
 * Future Django equivalent:
 * class EvidenceGenerateView(APIView):
 *     def post(self, request):
 *         # Generate PDF evidence package
 * 
 * TODO: Implement in Story 1A.3
 * - Receive transcription and extracted data
 * - Generate PDF using @react-pdf/renderer
 * - Include photos from WhatsApp input
 * - Store PDF in Supabase storage
 * - Return download URL
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  // TODO: Implement in Story 1A.3
  return res.status(501).json({
    detail: 'PDF generation endpoint not yet implemented',
    story: '1A.3',
    message: 'This will be implemented when building the evidence package generation'
  });
}