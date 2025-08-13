import { useState, useEffect } from 'react'
import { sanitizeForDisplay } from '@/lib/validation'

interface Project {
  id: string
  name: string
  location: string
  status: string
  metadata: {
    projectCode?: string
  }
}

interface ProjectSelectorProps {
  companyId: string
  selectedProjectId?: string
  onSelect: (project: Project | null) => void
  className?: string
}

export default function ProjectSelector({ companyId, selectedProjectId, onSelect, className = '' }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      if (!companyId) return

      try {
        const response = await fetch(`/api/projects?company_id=${companyId}&status=active`)
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

    loadProjects()
  }, [companyId])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    const project = projectId ? projects.find(p => p.id === projectId) : null
    onSelect(project || null)
  }

  if (loading) {
    return (
      <div className={className}>
        <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
          <option>Loading projects...</option>
        </select>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <select disabled className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50">
          <option>Error loading projects</option>
        </select>
      </div>
    )
  }

  return (
    <div className={className}>
      <select
        value={selectedProjectId || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
        <option value="">Select a project...</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.metadata.projectCode ? `[${sanitizeForDisplay(project.metadata.projectCode)}] ` : ''}{sanitizeForDisplay(project.name)} - {sanitizeForDisplay(project.location)}
          </option>
        ))}
      </select>
      {projects.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          No active projects found. Create a project first.
        </p>
      )}
    </div>
  )
}