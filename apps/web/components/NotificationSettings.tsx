import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRole } from './RoleBasedAccess'

interface NotificationPreferences {
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

interface NotificationSettingsProps {
  onSave: (preferences: NotificationPreferences) => void
}

export default function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const { role } = useRole()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    browser: true,
    weekly_summary: true,
    project_updates: false,
    validation_requests: false,
    deadline_reminders: false,
    company_updates: false,
    user_management: false,
    billing_alerts: false,
    quality_alerts: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const notificationCategories = [
    {
      id: 'general',
      title: 'General Notifications',
      description: 'Basic notification preferences',
      settings: [
        {
          key: 'email' as keyof NotificationPreferences,
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          availableFor: ['admin', 'pm', 'validator', 'viewer']
        },
        {
          key: 'browser' as keyof NotificationPreferences,
          label: 'Browser Notifications',
          description: 'Show desktop notifications in browser',
          availableFor: ['admin', 'pm', 'validator', 'viewer']
        },
        {
          key: 'weekly_summary' as keyof NotificationPreferences,
          label: 'Weekly Summary',
          description: 'Weekly digest of activity and updates',
          availableFor: ['admin', 'pm', 'validator', 'viewer']
        }
      ]
    },
    {
      id: 'project',
      title: 'Project & Work',
      description: 'Notifications about projects and work activities',
      settings: [
        {
          key: 'project_updates' as keyof NotificationPreferences,
          label: 'Project Updates',
          description: 'New submissions, status changes, and milestones',
          availableFor: ['admin', 'pm', 'validator']
        },
        {
          key: 'validation_requests' as keyof NotificationPreferences,
          label: 'Validation Requests',
          description: 'New evidence requiring validation',
          availableFor: ['admin', 'validator']
        },
        {
          key: 'deadline_reminders' as keyof NotificationPreferences,
          label: 'Deadline Reminders',
          description: 'Upcoming project deadlines and due dates',
          availableFor: ['admin', 'pm']
        },
        {
          key: 'quality_alerts' as keyof NotificationPreferences,
          label: 'Quality Alerts',
          description: 'Quality issues and validation failures',
          availableFor: ['admin', 'validator']
        }
      ]
    },
    {
      id: 'company',
      title: 'Company Management',
      description: 'Administrative and company-wide notifications',
      settings: [
        {
          key: 'company_updates' as keyof NotificationPreferences,
          label: 'Company Updates',
          description: 'Company announcements and policy changes',
          availableFor: ['admin']
        },
        {
          key: 'user_management' as keyof NotificationPreferences,
          label: 'User Management',
          description: 'New users, role changes, and access requests',
          availableFor: ['admin']
        },
        {
          key: 'billing_alerts' as keyof NotificationPreferences,
          label: 'Billing & Subscription',
          description: 'Payment issues, plan changes, and usage alerts',
          availableFor: ['admin']
        }
      ]
    }
  ]

  useEffect(() => {
    fetchNotificationPreferences()
  }, [])

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      if (userProfile?.preferences?.notifications) {
        setPreferences(userProfile.preferences.notifications)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Get current preferences
      const { data: currentProfile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', session.user.id)
        .single()

      const updatedPreferences = {
        ...currentProfile?.preferences,
        notifications: preferences
      }

      const { error } = await supabase
        .from('users')
        .update({ preferences: updatedPreferences })
        .eq('id', session.user.id)

      if (error) throw error

      onSave(preferences)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const isSettingAvailable = (availableFor: string[]) => {
    return role && availableFor.includes(role)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Notification Settings
        </h3>
        <p className="text-sm text-gray-600">
          Choose how and when you want to receive notifications
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {notificationCategories.map((category) => (
          <div key={category.id} className="border-b border-gray-200 pb-6 last:border-b-0">
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900">{category.title}</h4>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>

            <div className="space-y-4">
              {category.settings.map((setting) => {
                const isAvailable = isSettingAvailable(setting.availableFor)
                
                return (
                  <div 
                    key={setting.key} 
                    className={`flex items-start space-x-3 ${!isAvailable ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        id={setting.key}
                        type="checkbox"
                        checked={preferences[setting.key]}
                        onChange={(e) => handlePreferenceChange(setting.key, e.target.checked)}
                        disabled={!isAvailable}
                        className="h-4 w-4 text-construction-600 focus:ring-construction-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </div>
                    <div className="flex-1">
                      <label 
                        htmlFor={setting.key}
                        className={`block text-sm font-medium ${isAvailable ? 'text-gray-900 cursor-pointer' : 'text-gray-500'}`}
                      >
                        {setting.label}
                        {!isAvailable && (
                          <span className="text-xs text-gray-400 ml-2">
                            (Not available for {role} role)
                          </span>
                        )}
                      </label>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Browser Permission Warning */}
      {preferences.browser && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Browser Permissions Required
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                To receive browser notifications, please allow notifications for this site when prompted by your browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </div>

      {/* Role-based Help */}
      {role && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-800 mb-2">
            Notifications for {role === 'pm' ? 'Project Managers' : role.charAt(0).toUpperCase() + role.slice(1)}s
          </h5>
          <div className="text-sm text-gray-600">
            {role === 'admin' && (
              <p>As an admin, you have access to all notification types including company management, billing, and user management alerts.</p>
            )}
            {role === 'pm' && (
              <p>As a project manager, you'll receive notifications about project updates, deadlines, and validation requests relevant to your projects.</p>
            )}
            {role === 'validator' && (
              <p>As a validator, you'll receive notifications about new evidence requiring validation and quality alerts.</p>
            )}
            {role === 'viewer' && (
              <p>As a viewer, you have access to general notifications and weekly summaries but not management-specific alerts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}