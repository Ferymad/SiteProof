import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { useRole, PERMISSIONS, hasPermission } from './RoleBasedAccess'

interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  permission?: keyof typeof PERMISSIONS
  badge?: string
}

interface User {
  name: string
  email: string
  role: string
}

export default function Navigation() {
  const router = useRouter()
  const { role, loading } = useRole()
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: profile } = await supabase
          .from('users')
          .select('name, email, role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
    },
    {
      name: 'Submissions',
      href: '/submissions',
      permission: 'VIEW_SUBMISSIONS'
    },
    {
      name: 'Validation',
      href: '/validation',
      permission: 'VALIDATE_EVIDENCE',
      badge: role === 'validator' ? 'New' : undefined
    },
    {
      name: 'Reports',
      href: '/reports',
      permission: 'VIEW_REPORTS'
    },
    {
      name: 'Company Settings',
      href: '/company',
      permission: 'MANAGE_COMPANY'
    },
  ]

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(role, item.permission)
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse">
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <span className="text-xl font-bold text-construction-600 cursor-pointer">
                  BMAD Construction
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {filteredItems.map((item) => {
                const isActive = router.pathname.startsWith(item.href)
                return (
                  <Link key={item.name} href={item.href}>
                    <span className={`inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer border-b-2 transition-colors ${
                      isActive
                        ? 'border-construction-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}>
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 px-2 py-1 text-xs bg-construction-100 text-construction-800 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Role indicator */}
            {role && (
              <div className="mr-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  role === 'admin' ? 'bg-red-100 text-red-800' :
                  role === 'pm' ? 'bg-blue-100 text-blue-800' :
                  role === 'validator' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {role === 'pm' ? 'Project Manager' : role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
            )}

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-construction-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-construction-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </button>

              {/* Dropdown menu */}
              {mobileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    <Link href="/profile">
                      <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        Profile Settings
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {filteredItems.map((item) => {
              const isActive = router.pathname.startsWith(item.href)
              return (
                <Link key={item.name} href={item.href}>
                  <span className={`block pl-3 pr-4 py-2 text-base font-medium cursor-pointer ${
                    isActive
                      ? 'bg-construction-50 border-r-4 border-construction-500 text-construction-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs bg-construction-100 text-construction-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-construction-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                {role && (
                  <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    role === 'admin' ? 'bg-red-100 text-red-800' :
                    role === 'pm' ? 'bg-blue-100 text-blue-800' :
                    role === 'validator' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {role === 'pm' ? 'Project Manager' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link href="/profile">
                <span className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
                  Profile Settings
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}