import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import UserProfileForm from '@/components/UserProfileForm'
import NotificationSettings from '@/components/NotificationSettings'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'pm' | 'validator' | 'viewer'
  company_id: string
  preferences: any
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    checkAuthAndFetchProfile()
  }, [])

  const checkAuthAndFetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(userProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = (updatedProfile: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile })
    }
    setSaveMessage('Profile updated successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleNotificationSave = () => {
    setSaveMessage('Notification settings updated!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handlePhotoUpdate = (photoUrl: string | null) => {
    if (profile) {
      setProfile(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences,
          profile_photo_url: photoUrl
        }
      } : null)
    }
    setSaveMessage('Profile photo updated!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: '👤' },
    { id: 'photo', name: 'Profile Photo', icon: '📷' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'account', name: 'Account Settings', icon: '⚙️' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">Profile Settings</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your personal information and account preferences
              </p>
            </div>

            {/* Profile Summary */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                <div className="text-sm text-gray-600">{profile.email}</div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                  profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                  profile.role === 'pm' ? 'bg-blue-100 text-blue-800' :
                  profile.role === 'validator' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role === 'pm' ? 'Project Manager' : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
              
              <div className="w-12 h-12 rounded-full bg-construction-600 flex items-center justify-center text-white font-semibold">
                {profile.preferences?.profile_photo_url ? (
                  <img 
                    src={profile.preferences.profile_photo_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saveMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {saveMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-construction-500 text-construction-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <UserProfileForm 
                onSave={handleProfileSave}
              />
            )}

            {activeTab === 'photo' && (
              <ProfilePhotoUpload
                currentPhotoUrl={profile.preferences?.profile_photo_url}
                userId={profile.id}
                onPhotoUpdate={handlePhotoUpdate}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettings
                onSave={handleNotificationSave}
              />
            )}

            {activeTab === 'account' && (
              <AccountSettings profile={profile} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Account Settings Component
function AccountSettings({ profile }: { profile: UserProfile }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDataExport = async () => {
    setLoading(true)
    try {
      // This would call an API endpoint to generate and download user data
      const response = await fetch('/api/user/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bmad-profile-${profile.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Account deletion failed')
      }

      await supabase.auth.signOut()
      router.push('/')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Account Created:</span>
            <span className="text-gray-600">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">User ID:</span>
            <span className="text-gray-600 font-mono text-sm">{profile.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Company ID:</span>
            <span className="text-gray-600 font-mono text-sm">{profile.company_id}</span>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
        <p className="text-gray-600 mb-4">
          Download a copy of all your personal data and activity history.
        </p>
        <button
          onClick={handleDataExport}
          disabled={loading}
          className="px-4 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700 disabled:opacity-50"
        >
          {loading ? 'Generating Export...' : 'Export My Data'}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
          <p className="text-red-700 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-800 mb-2">
                  Type "DELETE MY ACCOUNT" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAccountDeletion}
                  disabled={loading || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}