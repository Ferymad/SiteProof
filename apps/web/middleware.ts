import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

type UserRole = 'admin' | 'pm' | 'validator' | 'viewer'

interface RoutePermissions {
  [key: string]: UserRole[]
}

// Define role-based route permissions
const ROUTE_PERMISSIONS: RoutePermissions = {
  '/dashboard': ['admin', 'pm', 'validator', 'viewer'], // All roles can access dashboard
  '/profile': ['admin', 'pm', 'validator', 'viewer'], // All roles can manage profile
  '/submissions': ['admin', 'pm', 'validator'], // Viewers can't create submissions
  '/company': ['admin'], // Only admins can manage company settings
  '/company/users': ['admin'], // Only admins can manage users
  '/company/settings': ['admin'], // Only admins can manage company settings
  '/validation': ['admin', 'validator'], // Only admins and validators can access validation
  '/reports': ['admin', 'pm'], // Only admins and PMs can access reports
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  // Create Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Handle cookie setting for requests
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Handle cookie removal for requests
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.error('Auth error in middleware:', authError)
  }

  // Define route categories
  const protectedRoutes = Object.keys(ROUTE_PERMISSIONS)
  const authRoutes = ['/auth', '/register']
  
  const { pathname } = req.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For protected routes, verify user has company association and proper role
  if (user && isProtectedRoute) {
    try {
      // Only fetch profile for core protected routes to prevent excessive DB queries
      const coreProtectedPaths = ['/dashboard', '/profile', '/company', '/validation', '/reports']
      const needsRoleCheck = coreProtectedPaths.some(path => pathname.startsWith(path))
      
      if (needsRoleCheck) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('company_id, role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile in middleware:', profileError)
          // Only redirect to profile setup if we're not already there
          if (pathname !== '/auth/profile-setup' && pathname !== '/auth/login') {
            return NextResponse.redirect(new URL('/auth/profile-setup?error=profile_missing', req.url))
          }
        } else if (profile) {
          // Check company association
          if (!profile.company_id && pathname !== '/auth/profile-setup') {
            return NextResponse.redirect(new URL('/auth/profile-setup?error=company_missing', req.url))
          }

          // Check role-based permissions
          const userRole = profile.role as UserRole
          const matchingRoute = protectedRoutes.find(route => pathname.startsWith(route))
          
          if (matchingRoute && profile.company_id) {
            const allowedRoles = ROUTE_PERMISSIONS[matchingRoute]
            if (!allowedRoles.includes(userRole)) {
              const deniedUrl = new URL('/dashboard', req.url)
              deniedUrl.searchParams.set('error', 'insufficient_permissions')
              deniedUrl.searchParams.set('required_role', allowedRoles.join(','))
              return NextResponse.redirect(deniedUrl)
            }
          }

          // Add user context to request headers for API routes
          res.headers.set('x-user-id', user.id)
          res.headers.set('x-user-role', userRole)
          res.headers.set('x-company-id', profile.company_id)
        }
      } else {
        // For non-core protected routes, just add user ID
        res.headers.set('x-user-id', user.id)
      }

    } catch (error) {
      console.error('Error checking user profile:', error)
      // Avoid infinite loops - only redirect if not already on error pages
      if (!pathname.includes('/auth/')) {
        return NextResponse.redirect(new URL('/auth/profile-setup?error=middleware_error', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}