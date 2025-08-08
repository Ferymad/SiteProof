import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Story 1A.3: Evidence Package Generation - PDF Download Endpoint
 * 
 * This endpoint will handle PDF download requests
 * Structured for easy migration to Django: /api/evidence/download/{id}/
 * 
 * Future Django equivalent:
 * class EvidenceDownloadView(RetrieveAPIView):
 *     def get(self, request, id):
 *         # Serve PDF file for download
 * 
 * TODO: Implement in Story 1A.3
 * - Retrieve PDF from Supabase storage
 * - Set proper headers for download
 * - Stream file to client
 * - Handle authentication and permissions
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['GET']
    });
  }

  // TODO: Implement in Story 1A.3
  return res.status(501).json({
    detail: 'PDF download endpoint not yet implemented',
    story: '1A.3',
    requested_id: id,
    message: 'This will be implemented when building the evidence package generation'
  });
}