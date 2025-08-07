# Frontend Architecture

## Component Architecture

### Component Organization
```
apps/web/src/
├── components/
│   ├── atoms/           # Basic UI elements
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   └── Spinner/
│   ├── molecules/       # Composite components
│   │   ├── ConfidenceBadge/
│   │   ├── FileDropZone/
│   │   ├── ProgressIndicator/
│   │   └── AudioPlayer/
│   ├── organisms/       # Complex components
│   │   ├── MessageInput/
│   │   ├── ProcessingView/
│   │   ├── ReviewPanel/
│   │   ├── ValidationQueue/  # GAP: New component needed
│   │   └── ProjectDashboard/ # GAP: New component needed
│   └── templates/       # Page layouts
│       ├── AuthLayout/
│       ├── DashboardLayout/
│       └── ProcessingLayout/
```

### Component Template
```typescript
// Example: ConfidenceBadge component
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

export const ConfidenceBadge: FC<ConfidenceBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  onClick
}) => {
  const level = score > 90 ? 'high' : score > 70 ? 'medium' : 'low';
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        {
          'bg-green-100 text-green-800': level === 'high',
          'bg-yellow-100 text-yellow-800': level === 'medium',
          'bg-red-100 text-red-800': level === 'low',
          'cursor-pointer hover:opacity-80': onClick
        }
      )}
      onClick={onClick}
    >
      <span className="font-semibold">{score}%</span>
      {showLabel && <span>{level} confidence</span>}
    </div>
  );
};
```

## State Management Architecture

### State Structure
```typescript
// stores/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  // Auth
  user: User | null;
  company: Company | null;
  
  // Projects
  activeProject: Project | null;
  projects: Project[];
  
  // Processing
  processingStatus: ProcessingStatus | null;
  processedContent: ProcessedContent[];
  
  // UI State
  sidebarOpen: boolean;
  validationQueueOpen: boolean; // GAP: New state needed
  
  // Actions
  setUser: (user: User | null) => void;
  setActiveProject: (project: Project) => void;
  updateProcessingStatus: (status: ProcessingStatus) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        company: null,
        activeProject: null,
        projects: [],
        processingStatus: null,
        processedContent: [],
        sidebarOpen: false,
        validationQueueOpen: false,
        
        // Actions
        setUser: (user) => set({ user }),
        setActiveProject: (project) => set({ activeProject: project }),
        updateProcessingStatus: (status) => set({ processingStatus: status })
      }),
      {
        name: 'cem-storage',
        partialize: (state) => ({ user: state.user, activeProject: state.activeProject })
      }
    )
  )
);
```

### State Management Patterns
- Use Zustand for global app state (user, projects, settings)
- Use React Query for server state (API data caching)
- Use React Hook Form for form state management
- Use URL state for navigation and deep linking
- Persist critical state to localStorage for recovery

## Routing Architecture

### Route Organization
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── projects/
│   │   ├── page.tsx           # Project list
│   │   └── [id]/
│   │       ├── page.tsx       # Project dashboard
│   │       ├── process/
│   │       │   └── page.tsx   # Message processing
│   │       ├── evidence/
│   │       │   └── page.tsx   # Evidence packages
│   │       └── settings/
│   │           └── page.tsx   # Project settings
│   ├── validation/            # GAP: New route needed
│   │   └── page.tsx
│   ├── analytics/             # GAP: New route needed
│   │   └── page.tsx
│   └── layout.tsx
├── api/
│   ├── webhooks/
│   │   └── whatsapp/
│   │       └── route.ts
│   └── health/
│       └── route.ts
└── layout.tsx
```

### Protected Route Pattern
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/(dashboard)')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (req.nextUrl.pathname.startsWith('/(auth)')) {
    if (session) {
      return NextResponse.redirect(new URL('/projects', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/(dashboard)/:path*', '/(auth)/:path*']
};
```

## Frontend Services Layer

### API Client Setup
```typescript
// lib/api-client.ts
import axios from 'axios';
import { getSession } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Service Example with Input Recovery
```typescript
// services/projects.service.ts
import { apiClient } from '@/lib/api-client';
import { Project, ProjectCreate } from '@/types';
import { InputRecoveryService } from '@/services/input-recovery.service';

export class ProjectsService {
  static async getProjects(): Promise<Project[]> {
    const { data } = await apiClient.get('/projects');
    return data.results;
  }

  static async createProject(project: ProjectCreate): Promise<Project> {
    const { data } = await apiClient.post('/projects', project);
    return data;
  }

  static async getProjectStats(projectId: string) {
    const { data } = await apiClient.get(`/projects/${projectId}/stats`);
    return data;
  }

  static async processMessages(
    projectId: string,
    content: string,
    files: File[]
  ) {
    // Backup input data before processing
    InputRecoveryService.backupFormData('whatsapp-input', {
      projectId,
      content,
      fileCount: files.length,
      timestamp: Date.now()
    });

    const formData = new FormData();
    formData.append('text_content', content);
    files.forEach(file => {
      if (file.type.includes('audio')) {
        formData.append('voice_files', file);
      } else {
        formData.append('images', file);
      }
    });

    try {
      const { data } = await apiClient.post(
        `/projects/${projectId}/messages`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      // Clear backup on success
      InputRecoveryService.clearBackup('whatsapp-input');
      return data;
      
    } catch (error) {
      // Keep backup for recovery on error
      throw error;
    }
  }
}

// services/input-recovery.service.ts
export class InputRecoveryService {
  private static readonly STORAGE_PREFIX = 'cem-backup-';

  static backupFormData(formId: string, data: any): void {
    const backupKey = `${this.STORAGE_PREFIX}${formId}`;
    const backupData = {
      ...data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(backupKey, JSON.stringify(backupData));
  }

  static recoverFormData(formId: string): any | null {
    const backupKey = `${this.STORAGE_PREFIX}${formId}`;
    const stored = localStorage.getItem(backupKey);
    
    if (!stored) return null;
    
    try {
      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;
      
      // Only recover data less than 24 hours old
      if (age > 24 * 60 * 60 * 1000) {
        this.clearBackup(formId);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to recover form data:', error);
      return null;
    }
  }

  static clearBackup(formId: string): void {
    const backupKey = `${this.STORAGE_PREFIX}${formId}`;
    localStorage.removeItem(backupKey);
  }

  static checkForRecoverableSessions(): any[] {
    const recoverable = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        const data = this.recoverFormData(key.replace(this.STORAGE_PREFIX, ''));
        if (data) {
          recoverable.push({
            formId: key.replace(this.STORAGE_PREFIX, ''),
            data,
            age: Date.now() - data.timestamp
          });
        }
      }
    }
    
    return recoverable;
  }
}
```
