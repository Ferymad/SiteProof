import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AuthForm from '@/components/AuthForm'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const redirectTo = router.query.redirectTo as string
  const message = router.query.message as string
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const destination = redirectTo && redirectTo !== '/auth/login' ? redirectTo : '/dashboard'
      router.push(destination)
    }
  }, [user, loading, router, redirectTo])

  // Show success message for registration
  useEffect(() => {
    if (message === 'registration_success') {
      setShowSuccessMessage(true)
      // Clean up URL by removing the message parameter
      const cleanUrl = router.asPath.split('?')[0]
      router.replace(cleanUrl, undefined, { shallow: true })
    }
  }, [message, router])

  const handleAuthSuccess = () => {
    // Redirect to original destination or dashboard after successful login
    const destination = redirectTo && redirectTo !== '/auth/login' ? redirectTo : '/dashboard'
    router.push(destination)
  }

  const handlePasswordReset = () => {
    // Redirect to password reset page
    router.push('/auth/reset-password')
  }

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div>
      {/* Registration Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium">Registration Successful!</h4>
                <p className="text-sm">Your company has been created. Please log in to get started.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <AuthForm 
        onSuccess={handleAuthSuccess}
        onPasswordReset={handlePasswordReset}
      />
    </div>
  )
}