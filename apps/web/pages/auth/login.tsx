import { useEffect } from 'react'
import { useRouter } from 'next/router'
import AuthForm from '@/components/AuthForm'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const redirectTo = router.query.redirectTo as string

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const destination = redirectTo && redirectTo !== '/auth/login' ? redirectTo : '/dashboard'
      router.push(destination)
    }
  }, [user, loading, router, redirectTo])

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
    <AuthForm 
      onSuccess={handleAuthSuccess}
      onPasswordReset={handlePasswordReset}
    />
  )
}