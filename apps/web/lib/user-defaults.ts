import { UserRole, ROLE_HIERARCHY, getUserPermissions } from './permissions'

/**
 * Default role assignments for new users
 */
export const DEFAULT_ROLES = {
  COMPANY_CREATOR: 'admin' as UserRole, // User who creates a company becomes admin
  INVITED_USER: 'viewer' as UserRole,   // Invited users start as viewers
  SELF_REGISTERED: 'pm' as UserRole     // Self-registered users become PMs
}

/**
 * Default user preferences based on role
 */
export function getDefaultPreferences(role: UserRole): Record<string, any> {
  const basePreferences = {
    notifications: {
      email: true,
      browser: true,
      weekly_summary: true
    },
    ui: {
      theme: 'light',
      compact_mode: false,
      show_tutorials: true
    }
  }

  switch (role) {
    case 'admin':
      return {
        ...basePreferences,
        notifications: {
          ...basePreferences.notifications,
          company_updates: true,
          user_management: true,
          billing_alerts: true
        },
        dashboard: {
          show_company_stats: true,
          show_user_activity: true,
          show_billing_status: true
        }
      }

    case 'pm':
      return {
        ...basePreferences,
        notifications: {
          ...basePreferences.notifications,
          project_updates: true,
          validation_requests: true,
          deadline_reminders: true
        },
        dashboard: {
          show_project_overview: true,
          show_recent_submissions: true,
          show_validation_status: true
        }
      }

    case 'validator':
      return {
        ...basePreferences,
        notifications: {
          ...basePreferences.notifications,
          validation_requests: true,
          quality_alerts: true
        },
        dashboard: {
          show_validation_queue: true,
          show_quality_metrics: true,
          show_validation_history: true
        }
      }

    case 'viewer':
      return {
        ...basePreferences,
        notifications: {
          ...basePreferences.notifications,
          project_updates: false, // Viewers get minimal notifications
          validation_requests: false
        },
        dashboard: {
          show_recent_activity: true,
          show_project_status: true
        }
      }

    default:
      return basePreferences
  }
}

/**
 * Get role-specific onboarding tasks
 */
export function getOnboardingTasks(role: UserRole): Array<{
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}> {
  const baseTasks = [
    {
      id: 'complete-profile',
      title: 'Complete Your Profile',
      description: 'Add your name and contact information',
      completed: false,
      priority: 'high' as const
    },
    {
      id: 'explore-dashboard',
      title: 'Explore Dashboard',
      description: 'Take a tour of your dashboard and main features',
      completed: false,
      priority: 'medium' as const
    }
  ]

  const roleTasks: Record<UserRole, Array<any>> = {
    admin: [
      ...baseTasks,
      {
        id: 'setup-company',
        title: 'Setup Company Settings',
        description: 'Configure company information and preferences',
        completed: false,
        priority: 'high'
      },
      {
        id: 'invite-team',
        title: 'Invite Team Members',
        description: 'Add your team members and assign roles',
        completed: false,
        priority: 'high'
      },
      {
        id: 'configure-permissions',
        title: 'Review User Permissions',
        description: 'Understand role-based access controls',
        completed: false,
        priority: 'medium'
      }
    ],
    pm: [
      ...baseTasks,
      {
        id: 'create-first-project',
        title: 'Create Your First Project',
        description: 'Set up your first construction project',
        completed: false,
        priority: 'high'
      },
      {
        id: 'upload-evidence',
        title: 'Upload Evidence',
        description: 'Learn how to upload and organize evidence',
        completed: false,
        priority: 'medium'
      }
    ],
    validator: [
      ...baseTasks,
      {
        id: 'validation-training',
        title: 'Validation Training',
        description: 'Learn the validation process and quality standards',
        completed: false,
        priority: 'high'
      },
      {
        id: 'first-validation',
        title: 'Complete First Validation',
        description: 'Validate your first piece of evidence',
        completed: false,
        priority: 'medium'
      }
    ],
    viewer: [
      ...baseTasks,
      {
        id: 'explore-projects',
        title: 'Explore Projects',
        description: 'Browse available projects and evidence',
        completed: false,
        priority: 'medium'
      }
    ]
  }

  return roleTasks[role] || baseTasks
}

/**
 * Check if user can be promoted to a higher role
 */
export function canPromoteUser(currentRole: UserRole, targetRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    validator: 2,
    pm: 3,
    admin: 4
  }

  return roleHierarchy[targetRole] > roleHierarchy[currentRole]
}

/**
 * Check if user can be demoted to a lower role
 */
export function canDemoteUser(currentRole: UserRole, targetRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    validator: 2,
    pm: 3,
    admin: 4
  }

  return roleHierarchy[targetRole] < roleHierarchy[currentRole]
}

/**
 * Get role transition restrictions
 */
export function getRoleTransitionRules() {
  return {
    // Who can assign roles to others
    canAssignRoles: {
      admin: ['admin', 'pm', 'validator', 'viewer'],
      pm: [], // PMs cannot assign roles
      validator: [], // Validators cannot assign roles
      viewer: [] // Viewers cannot assign roles
    },
    
    // Role transition restrictions
    restrictions: [
      'Cannot demote the last admin in a company',
      'Cannot promote someone to admin without being an admin',
      'Cannot change your own role if you are the only admin'
    ]
  }
}

/**
 * Initialize user with role-based defaults
 */
export async function initializeUserDefaults(userId: string, role: UserRole): Promise<{
  preferences: Record<string, any>
  onboarding_tasks: Array<any>
  permissions: Array<string>
}> {
  return {
    preferences: getDefaultPreferences(role),
    onboarding_tasks: getOnboardingTasks(role),
    permissions: getUserPermissions(role)
  }
}