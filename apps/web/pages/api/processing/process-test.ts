import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  try {
    const { submission_id, user_id } = req.body;
    
    if (!submission_id || !user_id) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'user_id']
      });
    }
    
    // Return mock processing results without database call
    return res.status(200).json({
      transcription: "Hey John, need to order materials for the foundation pour tomorrow. We'll need 15 cubic meters of concrete, 2 tonnes of rebar, and 200 concrete blocks. Total cost around €3,500. The scaffolding arrived this morning but needs inspection. Weather looks good for the pour.",
      transcription_confidence: 85,
      extracted_data: {
        amounts: ["€3,500", "15 cubic meters", "2 tonnes", "200 blocks"],
        materials: ["concrete", "rebar", "concrete blocks", "scaffolding"],
        dates: ["tomorrow", "this morning"],
        safety_concerns: ["scaffolding needs inspection"],
        work_status: "foundation pour planned"
      },
      extraction_confidence: 90,
      combined_confidence: 87,
      processing_time: {
        transcription: 2.5,
        extraction: 1.8,
        total: 4.3
      },
      status: 'completed'
    });
    
  } catch (error: unknown) {
    console.error('Processing endpoint error:', error);
    return res.status(500).json({
      detail: error instanceof Error ? error.message : 'Internal server error',
      status: 'error'
    });
  }
}