import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import RoleBasedAccess, { useRole } from '@/components/RoleBasedAccess'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalSubmissions: number
  pendingValidations: number
  companyUsers: number
  recentActivity: Array<{
    id: string
    type: 'submission' | 'validation' | 'user_added'
    message: string
    timestamp: string
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const { user, profile, company, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useRole()
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingValidations: 0,
    companyUsers: 0,
    recentActivity: []
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch dashboard statistics
  useEffect(() => {
    async function fetchDashboardStats() {
      if (!user || !company) return

      try {
        // Get total submissions for the company
        const { count: submissionsCount } = await supabase
          .from('whatsapp_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)

        // Get pending validations (if user can validate)
        let pendingCount = 0
        if (role === 'validator' || role === 'admin') {
          const { count } = await supabase
            .from('whatsapp_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .is('human_validated', null)
          
          pendingCount = count || 0
        }

        // Get total company users (if admin/pm)
        let usersCount = 0
        if (role === 'admin' || role === 'pm') {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
          
          usersCount = count || 0
        }

        // Get recent activity (latest 5 submissions)
        const { data: recentSubmissions } = await supabase
          .from('whatsapp_submissions')
          .select('id, transcription, created_at')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(5)

        const recentActivity = (recentSubmissions || []).map(submission => ({
          id: submission.id,
          type: 'submission' as const,
          message: `New submission: ${submission.transcription?.slice(0, 50)}...`,
          timestamp: new Date(submission.created_at).toLocaleString()
        }))

        setStats({
          totalSubmissions: submissionsCount || 0,
          pendingValidations: pendingCount,
          companyUsers: usersCount,
          recentActivity
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (!roleLoading && user && company) {
      fetchDashboardStats()
    }
  }, [user, company, role, roleLoading])

  // Show loading while checking authentication
  if (authLoading || roleLoading || !user || !profile || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {profile.name}
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  {company.name}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    role === 'admin' ? 'bg-red-100 text-red-800' :
                    role === 'pm' ? 'bg-blue-100 text-blue-800' :
                    role === 'validator' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {role === 'pm' ? 'Project Manager' : role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Total Submissions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsLoading ? '...' : stats.totalSubmissions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Validations - Only for validators and admins */}
          <RoleBasedAccess allowedRoles={['validator', 'admin']}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Validations
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? '...' : stats.pendingValidations}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </RoleBasedAccess>

          {/* Company Users - Only for admins and PMs */}
          <RoleBasedAccess allowedRoles={['admin', 'pm']}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Team Members
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? '...' : stats.companyUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </RoleBasedAccess>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            {statsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-construction-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading activity...</p>
              </div>
            ) : stats.recentActivity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {stats.recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== stats.recentActivity.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-construction-500 flex items-center justify-center ring-8 ring-white">
                              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.message}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0122 34c3.506 0 6.639 1.799 8.287 4.286" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading your first WhatsApp submission.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-construction-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900">Upload Evidence</h3>
                  <p className="text-sm text-gray-500">Submit new WhatsApp evidence</p>
                  <a
                    href="/upload"
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-construction-600 hover:bg-construction-700"
                  >
                    Upload Now
                  </a>
                </div>
              </div>
            </div>
          </div>

          <RoleBasedAccess allowedRoles={['validator', 'admin']}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Validate Evidence</h3>
                    <p className="text-sm text-gray-500">Review pending submissions</p>
                    <a
                      href="/validation"
                      className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Start Validation
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </RoleBasedAccess>

          <RoleBasedAccess allowedRoles={['admin', 'pm']}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Manage Team</h3>
                    <p className="text-sm text-gray-500">Add users and assign roles</p>
                    <a
                      href="/company/users"
                      className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage Users
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </RoleBasedAccess>
        </div>
      </main>
    </div>
  )
}