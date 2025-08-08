import { useState, useEffect } from 'react'
import { supabase, uploadVoiceNote } from '@/lib/supabase'
import ProcessingStatus from './ProcessingStatus'

interface WhatsAppFormProps {
  user: any
}

export default function WhatsAppForm({ user }: WhatsAppFormProps) {
  const [whatsappText, setWhatsappText] = useState('')
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [processingLoading, setProcessingLoading] = useState(false)
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid audio file (.mp3, .m4a, .wav, .ogg)')
        return
      }
      
      // Check file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        setError('File size must be less than 25MB')
        return
      }
      
      setVoiceFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatsappText.trim() && !voiceFile) {
      setError('Please provide either WhatsApp text or a voice note')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let voiceFileUrl = null
      
      if (voiceFile) {
        const uploadResult = await uploadVoiceNote(voiceFile, user.id)
        voiceFileUrl = uploadResult.path
      }

      // Store the data with processing status
      const { data: insertData, error: insertError } = await supabase
        .from('whatsapp_submissions')
        .insert([
          {
            user_id: user.id,
            whatsapp_text: whatsappText.trim() || null,
            voice_file_path: voiceFileUrl,
            processing_status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Store submission ID for processing
      if (insertData) {
        setLastSubmissionId(insertData.id)
        setProcessingResult({ status: 'pending' })
      }

      setSuccess('Data submitted successfully! Now you can process it with AI.')
      setWhatsappText('')
      setVoiceFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('voice-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      console.error('Submission error:', error)
      setError(error.message || 'Failed to submit data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleProcessWithAI = async () => {
    if (!lastSubmissionId) {
      setError('No submission to process. Please submit data first.')
      return
    }

    setProcessingLoading(true)
    setProcessingResult({ status: 'processing' })
    setError('')

    try {
      const response = await fetch('/api/processing/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submission_id: lastSubmissionId,
          user_id: user.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Processing failed')
      }

      setProcessingResult({
        ...result,
        status: 'completed'
      })
      setSuccess('AI processing completed successfully!')

    } catch (error: any) {
      console.error('Processing error:', error)
      setError(error.message || 'Failed to process with AI')
      setProcessingResult({
        status: 'failed',
        error: error.message || 'Processing failed'
      })
    } finally {
      setProcessingLoading(false)
    }
  }

  // Load existing submission for processing if user refreshes
  useEffect(() => {
    const loadRecentSubmission = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_submissions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data && !error) {
          setLastSubmissionId(data.id)
          
          // Set processing result based on existing data
          if (data.processing_status === 'completed' && data.transcription) {
            setProcessingResult({
              transcription: data.transcription,
              transcription_confidence: data.confidence_score,
              extracted_data: data.extracted_data,
              extraction_confidence: data.extraction_confidence,
              combined_confidence: Math.round((data.confidence_score + data.extraction_confidence) / 2),
              status: 'completed'
            })
          } else if (data.processing_status === 'failed') {
            setProcessingResult({
              status: 'failed',
              error: data.processing_error || 'Processing failed'
            })
          } else if (data.processing_status === 'pending') {
            setProcessingResult({ status: 'pending' })
          }
        }
      } catch (error) {
        console.error('Error loading recent submission:', error)
      }
    }

    loadRecentSubmission()
  }, [user.id])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SiteProof</h1>
            <p className="text-gray-600 mt-1">Construction Evidence Collection</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <p className="text-sm text-gray-600">
            Signed in as: <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="whatsapp-text" className="block text-lg font-medium text-gray-700 mb-3">
                WhatsApp Messages
              </label>
              <textarea
                id="whatsapp-text"
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                className="textarea-field"
                rows={6}
                placeholder="Paste your WhatsApp conversation here..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Copy and paste the relevant WhatsApp messages from the construction site
              </p>
            </div>

            <div>
              <label htmlFor="voice-file" className="block text-lg font-medium text-gray-700 mb-3">
                Voice Note
              </label>
              <div className="relative">
                <input
                  id="voice-file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".mp3,.m4a,.wav,.ogg,audio/mp3,audio/mpeg,audio/mp4,audio/m4a,audio/wav,audio/ogg"
                  className="file-upload"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500">
                    {voiceFile ? voiceFile.name : 'Tap to select voice note file'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Upload a single voice note file (.mp3, .m4a, .wav, .ogg) - Max 25MB
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || (!whatsappText.trim() && !voiceFile)}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Submit Construction Data'}
            </button>
          </form>
        </div>

        {/* AI Processing Section */}
        {(success || processingResult) && (
          <div className="mt-6 space-y-4">
            {/* Processing Button */}
            {processingResult?.status === 'pending' && (
              <div className="text-center">
                <button
                  onClick={handleProcessWithAI}
                  disabled={processingLoading}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
                >
                  {processingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Process with AI
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Transcribe voice notes and extract construction data using SiteProof AI
                </p>
              </div>
            )}
            
            {/* Processing Results */}
            {processingResult && lastSubmissionId && (
              <ProcessingStatus
                result={processingResult}
                submissionId={lastSubmissionId}
              />
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">About SiteProof AI Processing</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Voice Transcription:</strong> Using OpenAI Whisper for accurate Irish construction site transcription
            </p>
            <p>
              <strong>Data Extraction:</strong> GPT-4 identifies amounts, materials, dates, and safety concerns from your communications
            </p>
            <p>
              <strong>Next Step:</strong> Story 1A.3 will add professional PDF evidence generation from this processed data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}