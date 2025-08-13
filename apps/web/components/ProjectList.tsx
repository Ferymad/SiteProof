import { useState, useEffect } from 'react'
import ProjectCreateForm from './ProjectCreateForm'
import { sanitizeForDisplay } from '@/lib/validation'

interface Project {
  id: string
  name: string
  location: string
  start_date: string
  end_date?: string
  status: string
  metadata: {
    contractValue?: number
    mainContractor?: string
    projectCode?: string
  }
  created_at: string
}

interface ProjectListProps {
  companyId: string
  onProjectSelect: (project: Project) => void
  selectedProjectId?: string
}

export default function ProjectList({ companyId, onProjectSelect, selectedProjectId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      const response = await fetch(`/api/projects?company_id=${companyId}&status=${statusFilter}`)
      if (!response.ok) throw new Error('Failed to load projects')
      
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) {
      loadProjects()
    }
  }, [companyId, statusFilter])

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects])
    setShowCreateForm(false)
    onProjectSelect(newProject)
  }

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    setEditingProject(null)
    onProjectSelect(updatedProject)
  }

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(project)
  }

  const handleDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to archive "${sanitizeForDisplay(project.name)}"? This action cannot be undone.`)) {
      return
    }

    setActionLoading(project.id)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive project')
      }

      // Remove from list or update status
      const updatedProject = { ...project, status: 'archived' }
      setProjects(projects.map(p => p.id === project.id ? updatedProject : p))
      
      // If current filter doesn't show archived, reload the list
      if (statusFilter !== 'archived' && statusFilter !== '') {
        await loadProjects()
      }
    } catch (error) {
      console.error('Error archiving project:', error)
      setError(error instanceof Error ? error.message : 'Failed to archive project')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredProjects = projects.filter(project =>
    sanitizeForDisplay(project.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanitizeForDisplay(project.location).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sanitizeForDisplay(project.metadata.projectCode).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <ProjectCreateForm
        companyId={companyId}
        onSuccess={handleProjectCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  if (editingProject) {
    return (
      <ProjectCreateForm
        companyId={companyId}
        project={editingProject}
        onSuccess={handleProjectUpdated}
        onCancel={() => setEditingProject(null)}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Project
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="">All Status</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No projects match your search.' : 'No projects found. Create your first project to get started.'}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedProjectId === project.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{sanitizeForDisplay(project.name)}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">📍 {sanitizeForDisplay(project.location)}</p>
                  
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                    {project.end_date && (
                      <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {(project.metadata.contractValue || project.metadata.mainContractor || project.metadata.projectCode) && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-500">
                      {project.metadata.projectCode && (
                        <span className="bg-gray-100 px-2 py-1 rounded">{sanitizeForDisplay(project.metadata.projectCode)}</span>
                      )}
                      {project.metadata.contractValue && (
                        <span>€{project.metadata.contractValue.toLocaleString()}</span>
                      )}
                      {project.metadata.mainContractor && (
                        <span>{sanitizeForDisplay(project.metadata.mainContractor)}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleEditProject(project, e)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit project"
                    disabled={actionLoading === project.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project, e)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Archive project"
                    disabled={actionLoading === project.id}
                  >
                    {actionLoading === project.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                  <div className="ml-2 text-xs text-gray-500 text-right">
                    <div>Created</div>
                    <div>{new Date(project.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}