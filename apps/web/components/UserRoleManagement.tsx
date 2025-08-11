import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'pm' | 'validator' | 'viewer'
  created_at: string
}

const ROLE_DEFINITIONS = {
  admin: {
    label: 'Admin',
    description: 'Full company management, user management, billing',
    color: 'bg-red-100 text-red-800'
  },
  pm: {
    label: 'Project Manager',
    description: 'Project management, evidence creation, team collaboration',
    color: 'bg-blue-100 text-blue-800'
  },
  validator: {
    label: 'Validator',
    description: 'Human validation tasks, quality assurance',
    color: 'bg-green-100 text-green-800'
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to company data',
    color: 'bg-gray-100 text-gray-800'
  }
}

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/company/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const { users } = await response.json()
      setUsers(users)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/company/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      const { user } = await response.json()
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? user : u))
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUpdating('')
    }
  }

  const removeUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this user from the company?')) {
      return
    }

    setUpdating(userId)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/company/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove user')
      }

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUpdating('')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
        <p className="text-sm text-gray-600">
          Manage roles and permissions for your team members
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div>
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_DEFINITIONS[user.role].color}`}>
                  {ROLE_DEFINITIONS[user.role].label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ROLE_DEFINITIONS[user.role].description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={user.role}
                onChange={(e) => updateUserRole(user.id, e.target.value)}
                disabled={updating === user.id}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-construction-500 disabled:opacity-50"
              >
                {Object.entries(ROLE_DEFINITIONS).map(([role, def]) => (
                  <option key={role} value={role}>
                    {def.label}
                  </option>
                ))}
              </select>

              {user.role !== 'admin' && (
                <button
                  onClick={() => removeUser(user.id)}
                  disabled={updating === user.id}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded disabled:opacity-50"
                  title="Remove from company"
                >
                  Remove
                </button>
              )}

              {updating === user.id && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-construction-600"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No team members found
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Role Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {Object.entries(ROLE_DEFINITIONS).map(([role, def]) => (
            <div key={role} className="flex items-start space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${def.color} flex-shrink-0`}>
                {def.label}
              </span>
              <span className="text-gray-600">{def.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}