import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  const res = NextResponse.next()
  
  // Get token from request headers or cookies
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                req.cookies.get('sb-access-token')?.value

  if (!token) {
    const { pathname } = req.nextUrl
    const protectedRoutes = Object.keys(ROUTE_PERMISSIONS)
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    if (isProtectedRoute) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return res
  }

  // Create Supabase client with user token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  let user = null
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error('Auth error in middleware:', error)
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
      const { data: profile } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        return NextResponse.redirect(new URL('/auth/setup-required', req.url))
      }

      // Check role-based permissions
      const userRole = profile.role as UserRole
      const matchingRoute = protectedRoutes.find(route => pathname.startsWith(route))
      
      if (matchingRoute) {
        const allowedRoles = ROUTE_PERMISSIONS[matchingRoute]
        if (!allowedRoles.includes(userRole)) {
          // Redirect to access denied or dashboard with error
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

    } catch (error) {
      console.error('Error checking user profile:', error)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}