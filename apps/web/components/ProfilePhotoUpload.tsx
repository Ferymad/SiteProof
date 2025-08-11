import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string
  userId: string
  onPhotoUpdate: (photoUrl: string | null) => void
}

export default function ProfilePhotoUpload({ 
  currentPhotoUrl, 
  userId, 
  onPhotoUpdate 
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB'
    }

    // Check image dimensions (optional - could be done with canvas)
    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          preferences: {
            // Preserve existing preferences
            ...(await getCurrentPreferences()),
            profile_photo_url: publicUrl
          }
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      onPhotoUpdate(publicUrl)
    } catch (error: any) {
      setError(error.message || 'Failed to upload photo')
      console.error('Photo upload error:', error)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getCurrentPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data?.preferences || {}
    } catch (error) {
      console.error('Error fetching preferences:', error)
      return {}
    }
  }

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return

    setUploading(true)
    setError('')

    try {
      // Extract file path from URL
      const urlParts = currentPhotoUrl.split('profile-photos/')
      if (urlParts.length > 1) {
        const filePath = `profile-photos/${urlParts[1]}`
        
        // Delete from storage (optional - you might want to keep files for audit)
        await supabase.storage
          .from('profile-photos')
          .remove([filePath])
      }

      // Update user profile in database
      const currentPrefs = await getCurrentPreferences()
      const updatedPrefs = { ...currentPrefs }
      delete updatedPrefs.profile_photo_url

      const { error: updateError } = await supabase
        .from('users')
        .update({ preferences: updatedPrefs })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      onPhotoUpdate(null)
    } catch (error: any) {
      setError(error.message || 'Failed to remove photo')
      console.error('Photo removal error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        {/* Profile Photo Display */}
        <div 
          className="relative cursor-pointer group"
          onClick={handlePhotoClick}
        >
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow">
            {currentPhotoUrl ? (
              <img 
                src={currentPhotoUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="text-2xl font-semibold text-gray-500">
                {/* Could show user initials here */}
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM8.5 9.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zM12 16c-3.314 0-6 2.686-6 6h12c0-3.314-2.686-6-6-6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-construction-600"></div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Profile Photo</h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload a professional photo to help your team recognize you
          </p>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploading}
              className="px-4 py-2 bg-construction-600 text-white text-sm rounded-md hover:bg-construction-700 disabled:opacity-50"
            >
              {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            
            {currentPhotoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG or GIF • Max 5MB • Square images work best
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Upload guidelines */}
      <div className="bg-gray-50 rounded-md p-4">
        <h5 className="text-sm font-medium text-gray-800 mb-2">Photo Guidelines</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use a clear, professional headshot</li>
          <li>• Face should be clearly visible and well-lit</li>
          <li>• Avoid sunglasses, hats, or other face coverings</li>
          <li>• Square format (1:1 ratio) works best</li>
          <li>• Minimum recommended size: 200x200 pixels</li>
        </ul>
      </div>
    </div>
  )
}