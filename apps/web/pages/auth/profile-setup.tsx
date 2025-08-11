import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get user directly from Supabase to avoid AuthContext loops
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Error getting user:', err)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    const errorType = router.query.error as string
    switch (errorType) {
      case 'profile_missing':
        setError('Your user profile could not be found. This may be due to an incomplete registration process.')
        break
      case 'company_missing':
        setError('Your company association is missing. Please contact support.')
        break
      case 'middleware_error':
        setError('A technical error occurred while verifying your account.')
        break
      default:
        setError('There was an issue with your account setup.')
    }
  }, [router.query.error])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleRetryLogin = () => {
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Profile Setup Required</h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an issue with your account setup
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium">Setup Issue</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>

          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Current User</h3>
              <p className="text-sm text-gray-600 mt-1">Email: {user.email}</p>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleRetryLogin}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-construction-600 hover:bg-construction-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-construction-500"
            >
              Try Login Again
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-construction-500"
            >
              Sign Out & Start Over
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              If this issue persists, please contact support with your user ID above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}