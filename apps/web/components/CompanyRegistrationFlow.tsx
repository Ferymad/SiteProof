import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CompanyRegistrationProps {
  onSuccess: () => void
}

interface RegistrationData {
  // Company details
  companyName: string
  companyType: 'subcontractor' | 'main_contractor' | 'validator'
  
  // Admin user details
  adminName: string
  adminEmail: string
  adminPassword: string
  
  // Legal agreements
  termsAccepted: boolean
  privacyAccepted: boolean
}

const COMPANY_TYPES = [
  {
    value: 'subcontractor' as const,
    label: 'Subcontractor',
    description: 'Standard construction subcontractor'
  },
  {
    value: 'main_contractor' as const,
    label: 'Main Contractor', 
    description: 'Main contractor with additional validation features'
  },
  {
    value: 'validator' as const,
    label: 'Validator',
    description: 'Third-party validation services'
  }
]

export default function CompanyRegistrationFlow({ onSuccess }: CompanyRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<RegistrationData>({
    companyName: '',
    companyType: 'subcontractor',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    termsAccepted: false,
    privacyAccepted: false
  })

  const updateFormData = (updates: Partial<RegistrationData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.companyName.trim().length >= 2
      case 2:
        return formData.adminName.trim().length >= 2 && 
               formData.adminEmail.includes('@') && 
               formData.adminPassword.length >= 8
      case 3:
        return formData.termsAccepted && formData.privacyAccepted
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
      setError('')
    } else {
      setError('Please complete all required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Create company record via API
      const companyResponse = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: formData.companyName,
          company_type: formData.companyType,
          admin_name: formData.adminName,
          admin_email: formData.adminEmail,
          admin_password: formData.adminPassword
        })
      })

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json()
        throw new Error(errorData.error || 'Company registration failed')
      }

      const { company, user } = await companyResponse.json()

      // Step 2: Sign up user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        options: {
          data: {
            name: formData.adminName,
            company_id: company.id,
            role: 'admin'
          }
        }
      })

      if (signUpError) throw signUpError

      // Success
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => updateFormData({ companyName: e.target.value })}
                    className="input-field"
                    placeholder="Your Construction Company Ltd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Company Type *
                  </label>
                  <div className="space-y-3">
                    {COMPANY_TYPES.map((type) => (
                      <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="companyType"
                          value={type.value}
                          checked={formData.companyType === type.value}
                          onChange={(e) => updateFormData({ companyType: e.target.value as any })}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Admin Account Setup
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    id="adminName"
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => updateFormData({ adminName: e.target.value })}
                    className="input-field"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => updateFormData({ adminEmail: e.target.value })}
                    className="input-field"
                    placeholder="john@yourcompany.com"
                  />
                </div>

                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={(e) => updateFormData({ adminPassword: e.target.value })}
                    className="input-field"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Terms & Privacy
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Company: {formData.companyName}</h4>
                  <p className="text-sm text-gray-600 mb-1">Type: {COMPANY_TYPES.find(t => t.value === formData.companyType)?.label}</p>
                  <p className="text-sm text-gray-600 mb-1">Admin: {formData.adminName}</p>
                  <p className="text-sm text-gray-600">Email: {formData.adminEmail}</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I accept the <a href="/terms" className="text-construction-600 hover:text-construction-700">Terms of Service</a>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacyAccepted}
                      onChange={(e) => updateFormData({ privacyAccepted: e.target.checked })}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I accept the <a href="/privacy" className="text-construction-600 hover:text-construction-700">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
                  step <= currentStep
                    ? 'bg-construction-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Company Info</span>
            <span>Admin Account</span>
            <span>Terms & Review</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            BMAD Construction
          </h2>
          <p className="mt-2 text-gray-600">
            Create your company account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              {currentStep > 1 ? 'Previous' : ''}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !validateStep(3)}
                className="px-6 py-2 bg-construction-600 text-white rounded-md hover:bg-construction-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Company'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}