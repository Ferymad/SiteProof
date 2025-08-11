import { useState } from 'react'
import { authService } from '@/lib/supabase'

interface AuthFormProps {
  onSuccess: () => void
  onPasswordReset?: () => void
}

export default function AuthForm({ onSuccess, onPasswordReset }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (isLogin) {
        const { data, error } = await authService.signIn(email, password)
        if (error) throw error
        
        // Verify user has company association
        const { user, profile, company } = await authService.getCurrentUser()
        if (!profile || !company) {
          throw new Error('User account is not associated with a company. Please contact support.')
        }
        
        onSuccess()
      } else {
        const { data, error } = await authService.signUp(email, password)
        if (error) throw error
        
        // Show success message for registration
        setSuccessMessage('Registration successful! Please check your email to confirm your account before logging in.')
        
        // Reset form
        setEmail('')
        setPassword('')
        
        // Don't call onSuccess() for registration - user needs to confirm email first
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            BMAD Construction
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter password"
              minLength={8}
            />
            {isLogin && onPasswordReset && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={onPasswordReset}
                  className="text-sm text-construction-600 hover:text-construction-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setSuccessMessage('')
              }}
              className="text-construction-600 hover:text-construction-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            
            {isLogin && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  New company?
                </p>
                <a
                  href="/register/company"
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Create Company Account
                </a>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}