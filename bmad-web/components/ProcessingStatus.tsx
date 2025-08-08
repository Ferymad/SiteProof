import React from 'react';
import { ConfidenceBadge, ConstructionConfidenceDisplay } from './ConfidenceBadge';

interface ProcessingResult {
  transcription?: string;
  transcription_confidence?: number;
  extracted_data?: {
    amounts: string[];
    materials: string[];
    dates: string[];
    safety_concerns: string[];
    work_status: string | null;
  };
  extraction_confidence?: number;
  combined_confidence?: number;
  processing_time?: {
    transcription?: number;
    extraction?: number;
    total?: number;
  };
  status: 'processing' | 'completed' | 'failed' | 'pending';
  error?: string;
}

interface ProcessingStatusProps {
  result: ProcessingResult;
  submissionId: string;
}

export function ProcessingStatus({ result, submissionId }: ProcessingStatusProps) {
  if (result.status === 'processing') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <div>
            <h3 className="text-blue-800 font-medium">Processing your construction data...</h3>
            <p className="text-blue-600 text-sm mt-1">
              Transcribing voice notes and extracting construction information using AI
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-red-800 font-medium">Processing Failed</h3>
            <p className="text-red-600 text-sm mt-1">
              {result.error || 'Unable to process your construction data. Please try again.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'completed') {
    const hasHighValueItems = result.extracted_data?.amounts.some(amount => {
      // Check for high-value amounts (over €1000 or £1000)
      const numericValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
      return numericValue > 1000;
    }) || false;

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 5 = Friday
    const isFridayAfternoon = currentDay === 5 && currentHour >= 14 && currentHour < 18;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
        {/* Success Header */}
        <div className="flex items-center">
          <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="text-green-800 font-medium">Processing Complete</h3>
            <p className="text-green-600 text-sm mt-1">
              Your construction evidence has been processed and analyzed
            </p>
          </div>
        </div>

        {/* Confidence Display */}
        {result.combined_confidence && (
          <ConstructionConfidenceDisplay
            transcriptionScore={result.transcription_confidence}
            extractionScore={result.extraction_confidence}
            combinedScore={result.combined_confidence}
            hasHighValueItems={hasHighValueItems}
            isFridayAfternoon={isFridayAfternoon}
          />
        )}

        {/* Transcription Results */}
        {result.transcription && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v16.5a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3z" />
              </svg>
              Voice Note Transcription
            </h4>
            <div className="text-gray-700 text-sm bg-gray-50 rounded p-3 font-mono leading-relaxed">
              {result.transcription}
            </div>
          </div>
        )}

        {/* Extracted Data */}
        {result.extracted_data && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Extracted Construction Data
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Amounts */}
              {result.extracted_data.amounts.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Amounts & Values
                  </h5>
                  <div className="space-y-1">
                    {result.extracted_data.amounts.map((amount, index) => (
                      <div key={index} className="text-sm bg-green-50 px-2 py-1 rounded border border-green-200">
                        {amount}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {result.extracted_data.materials.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Materials
                  </h5>
                  <div className="space-y-1">
                    {result.extracted_data.materials.map((material, index) => (
                      <div key={index} className="text-sm bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {material}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              {result.extracted_data.dates.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Dates & Deadlines
                  </h5>
                  <div className="space-y-1">
                    {result.extracted_data.dates.map((date, index) => (
                      <div key={index} className="text-sm bg-purple-50 px-2 py-1 rounded border border-purple-200">
                        {date}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Concerns */}
              {result.extracted_data.safety_concerns.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Safety Concerns
                  </h5>
                  <div className="space-y-1">
                    {result.extracted_data.safety_concerns.map((concern, index) => (
                      <div key={index} className="text-sm bg-red-50 px-2 py-1 rounded border border-red-200">
                        {concern}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Work Status */}
            {result.extracted_data.work_status && (
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Work Status Summary</h5>
                <p className="text-sm text-gray-600">{result.extracted_data.work_status}</p>
              </div>
            )}
          </div>
        )}

        {/* Processing Time */}
        {result.processing_time && (
          <div className="text-xs text-gray-500 text-right">
            Processing completed in {result.processing_time.total?.toFixed(1)}s
            {result.processing_time.transcription && result.processing_time.extraction && (
              <span>
                {' '}(Transcription: {result.processing_time.transcription.toFixed(1)}s, 
                Extraction: {result.processing_time.extraction.toFixed(1)}s)
              </span>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="text-blue-800 font-medium mb-2">What's Next?</h4>
          <p className="text-blue-700 text-sm">
            This processed data is now ready for PDF evidence generation (Story 1A.3). 
            The extracted information can be used to create professional construction evidence packages.
          </p>
        </div>
      </div>
    );
  }

  // Default pending state
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="w-6 h-6 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
          <span className="text-gray-600 text-xs">?</span>
        </div>
        <div>
          <h3 className="text-gray-700 font-medium">Ready for Processing</h3>
          <p className="text-gray-600 text-sm mt-1">
            Click "Process with AI" to begin transcription and data extraction
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProcessingStatus;