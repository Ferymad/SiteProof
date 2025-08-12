import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/router'
import ProjectList from '@/components/ProjectList'
import WhatsAppForm from '@/components/WhatsAppForm'

interface User {
  id: string
  email?: string
  [key: string]: unknown
}

interface UserProfile {
  id: string
  company_id: string
  role: string
}

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'whatsapp'>('list')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get user profile with company info
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, company_id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.company_id) {
        router.push('/auth/profile-setup')
        return
      }

      setUserProfile(profile)
      setLoading(false)
    }

    getUser()
  }, [supabase.auth, router])

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project)
    setActiveTab('whatsapp')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-1">Organize construction communications by project</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects ({userProfile?.company_id ? '...' : '0'})
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'whatsapp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!selectedProject}
            >
              WhatsApp Input {selectedProject && `(${selectedProject.name})`}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'list' && (
            <>
              {selectedProject && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">Selected Project</h3>
                      <p className="text-blue-700">{selectedProject.name} - {selectedProject.location}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('whatsapp')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Add WhatsApp Data →
                    </button>
                  </div>
                </div>
              )}
              
              <ProjectList
                companyId={userProfile.company_id}
                onProjectSelect={handleProjectSelect}
                selectedProjectId={selectedProject?.id}
              />
            </>
          )}

          {activeTab === 'whatsapp' && selectedProject && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">WhatsApp Input</h2>
                    <p className="text-gray-600">Project: {selectedProject.name}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Projects
                  </button>
                </div>
              </div>
              
              <WhatsAppForm 
                user={user} 
                companyId={userProfile.company_id}
              />
            </div>
          )}

          {activeTab === 'whatsapp' && !selectedProject && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h3 className="text-yellow-800 font-medium mb-2">No Project Selected</h3>
              <p className="text-yellow-700 mb-4">Please select a project from the Projects tab first.</p>
              <button
                onClick={() => setActiveTab('list')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Go to Projects
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}