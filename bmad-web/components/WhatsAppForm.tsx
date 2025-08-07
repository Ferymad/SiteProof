import { useState } from 'react'
import { supabase, uploadVoiceNote } from '@/lib/supabase'

interface WhatsAppFormProps {
  user: any
}

export default function WhatsAppForm({ user }: WhatsAppFormProps) {
  const [whatsappText, setWhatsappText] = useState('')
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

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

      // For now, we'll just store the data in a simple table
      // In later stories, this will trigger AI processing
      const { error: insertError } = await supabase
        .from('whatsapp_submissions')
        .insert([
          {
            user_id: user.id,
            whatsapp_text: whatsappText.trim() || null,
            voice_file_path: voiceFileUrl,
            created_at: new Date().toISOString()
          }
        ])

      if (insertError) throw insertError

      setSuccess('Data submitted successfully! Processing will be added in the next story.')
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BMAD Construction</h1>
            <p className="text-gray-600 mt-1">WhatsApp Data Input</p>
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
              {loading ? 'Uploading...' : 'Submit Data'}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <p className="text-sm text-blue-800">
            This is the basic data input interface for MVP validation. 
            AI processing and PDF generation will be added in the next development stories.
          </p>
        </div>
      </div>
    </div>
  )
}