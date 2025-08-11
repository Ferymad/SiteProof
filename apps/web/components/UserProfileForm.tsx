import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'pm' | 'validator' | 'viewer'
  company_id: string
  preferences: {
    construction_experience_years?: number
    construction_specialties?: string[]
    project_types?: string[]
    certifications?: string[]
    preferred_units?: 'metric' | 'imperial'
    language?: string
    timezone?: string
    notifications?: {
      email: boolean
      browser: boolean
      weekly_summary: boolean
      project_updates: boolean
      validation_requests: boolean
      deadline_reminders: boolean
      company_updates: boolean
      user_management: boolean
      billing_alerts: boolean
      quality_alerts: boolean
    }
    ui?: {
      theme: 'light' | 'dark' | 'auto'
      compact_mode: boolean
      show_tutorials: boolean
    }
  }
}

interface UserProfileFormProps {
  onSave: (profile: Partial<UserProfile>) => void
  onCancel?: () => void
}

const CONSTRUCTION_SPECIALTIES = [
  'General Construction',
  'Electrical Work',
  'Plumbing & HVAC',
  'Roofing',
  'Flooring',
  'Painting & Finishing',
  'Concrete & Masonry',
  'Carpentry & Woodwork',
  'Demolition',
  'Site Preparation',
  'Safety & Inspection',
  'Project Management'
]

const PROJECT_TYPES = [
  'Residential Construction',
  'Commercial Buildings',
  'Industrial Projects',
  'Infrastructure',
  'Renovations & Repairs',
  'Green Building/LEED',
  'Emergency Repairs',
  'Maintenance'
]

const CERTIFICATIONS = [
  'CSCS Card',
  'CITB Certification',
  'Health & Safety',
  'Asbestos Awareness',
  'Working at Height',
  'Manual Handling',
  'First Aid',
  'SMSTS/SSSTS',
  'NVQ/SVQ Construction',
  'Professional Engineering',
  'Trade Specific License',
  'Other'
]

export default function UserProfileForm({ onSave, onCancel }: UserProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(userProfile)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setProfile(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences,
          [parent]: {
            ...(prev.preferences[parent as keyof typeof prev.preferences] as any),
            [child]: value
          }
        }
      } : null)
    } else if (field.startsWith('preferences.')) {
      const prefField = field.replace('preferences.', '')
      setProfile(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      } : null)
    } else {
      setProfile(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    if (!profile) return
    
    const currentArray = profile.preferences[field as keyof typeof profile.preferences] as string[] || []
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value)
    
    handleInputChange(`preferences.${field}`, newArray)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          preferences: profile.preferences
        })
        .eq('id', profile.id)

      if (error) throw error

      onSave(profile)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          Failed to load profile data
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Profile Information
          </h3>
          <p className="text-sm text-gray-600">
            Update your personal information and construction industry preferences
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-construction-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
          </div>
        </div>

        {/* Construction Experience */}
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
            Construction Experience (Years)
          </label>
          <select
            id="experience"
            value={profile.preferences.construction_experience_years || ''}
            onChange={(e) => handleInputChange('preferences.construction_experience_years', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-construction-500"
          >
            <option value="">Select experience level</option>
            <option value="0">Less than 1 year</option>
            <option value="1">1-2 years</option>
            <option value="3">3-5 years</option>
            <option value="6">6-10 years</option>
            <option value="11">11-15 years</option>
            <option value="16">16-20 years</option>
            <option value="21">20+ years</option>
          </select>
        </div>

        {/* Construction Specialties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Construction Specialties
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONSTRUCTION_SPECIALTIES.map((specialty) => (
              <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(profile.preferences.construction_specialties || []).includes(specialty)}
                  onChange={(e) => handleArrayChange('construction_specialties', specialty, e.target.checked)}
                  className="rounded border-gray-300 text-construction-600 focus:ring-construction-500"
                />
                <span className="text-sm text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Project Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Project Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROJECT_TYPES.map((type) => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(profile.preferences.project_types || []).includes(type)}
                  onChange={(e) => handleArrayChange('project_types', type, e.target.checked)}
                  className="rounded border-gray-300 text-construction-600 focus:ring-construction-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Certifications & Licenses
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CERTIFICATIONS.map((cert) => (
              <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(profile.preferences.certifications || []).includes(cert)}
                  onChange={(e) => handleArrayChange('certifications', cert, e.target.checked)}
                  className="rounded border-gray-300 text-construction-600 focus:ring-construction-500"
                />
                <span className="text-sm text-gray-700">{cert}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Units
            </label>
            <select
              id="units"
              value={profile.preferences.preferred_units || 'metric'}
              onChange={(e) => handleInputChange('preferences.preferred_units', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-construction-500"
            >
              <option value="metric">Metric (meters, kg, °C)</option>
              <option value="imperial">Imperial (feet, lbs, °F)</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              id="language"
              value={profile.preferences.language || 'en'}
              onChange={(e) => handleInputChange('preferences.language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-construction-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}