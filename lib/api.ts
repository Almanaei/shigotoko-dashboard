// API service for making requests to our backend endpoints
import { User } from '@/lib/DashboardProvider';

// Base URL for API requests
const API_BASE_URL = '/api';

// Utility function for making API requests
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Always include credentials for cookie authentication
  });
  
  // Parse response, handling JSON parsing errors
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    data = { error: 'Failed to parse response' };
  }
  
  if (!response.ok) {
    // Special handling for authentication endpoints
    if (endpoint === '/auth' && response.status === 401) {
      console.log('API: Auth check failed, user not authenticated');
      return null as any; // Return null for getCurrentUser without throwing
    }
    
    // Special handling for authentication errors on other endpoints
    if (response.status === 401) {
      console.log('API: Authentication required for', endpoint);
      
      // Clear only the standard session token cookie on auth errors
      if (typeof document !== 'undefined') {
        document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        console.log('API: Cleared session cookie due to authentication error');
      }
    }
    
    throw new Error(data.error || 'An error occurred while fetching the data');
  }
  
  return data as T;
}

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (credentials: { email: string; password: string }): Promise<User> => {
    return fetchAPI<User>('/auth', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  // Employee login
  employeeLogin: async (credentials: { email: string; password: string }): Promise<User> => {
    return fetchAPI<User>('/auth/employee', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  // Register a new user
  register: async (userData: { name: string; email: string; password: string; role?: string }): Promise<User> => {
    return fetchAPI<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // Logout user
  logout: async (): Promise<{ success: boolean }> => {
    // Try both standard and employee logout endpoints
    try {
      // First try standard logout
      const result = await fetchAPI<{ success: boolean }>('/auth', {
        method: 'DELETE',
      });
      console.log('Standard logout successful');
      return result;
    } catch (error) {
      console.log('Standard logout failed, trying employee logout:', error);
      try {
        // Then try employee logout if standard fails
        const result = await fetchAPI<{ success: boolean }>('/auth/employee', {
          method: 'DELETE',
        });
        console.log('Employee logout successful');
        return result;
      } catch (employeeError) {
        console.log('Employee logout also failed:', employeeError);
        // Return success even if both failed, as we'll still clear cookies client-side
        return { success: true };
      }
    }
  },
  
  // Get current user (from either standard or employee auth)
  getCurrentUser: async (retryCount = 0): Promise<User | null> => {
    try {
      console.log(`API: Fetching current user... ${retryCount > 0 ? `(Retry ${retryCount})` : ''}`);
      
      // Check if we have a session cookie on the client before making the API call
      if (typeof document !== 'undefined') {
        const hasSessionCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('session-token='));
        
        console.log('API: session-token cookie exists:', hasSessionCookie);
        
        // If no cookie found, don't even try the API call
        if (!hasSessionCookie && retryCount === 0) {
          console.log('API: No session cookie found, skipping auth check');
          return null;
        }
      }
      
      // Add timestamp to avoid caching issues with the auth endpoint
      const timestamp = Date.now();
      const user = await fetchAPI<User>(`/auth?_t=${timestamp}`);
      console.log('API: Current user fetched successfully:', user);
      return user;
    } catch (error) {
      console.log('API: Error getting current user:', error);
      
      // Check again after the error to see if cookie was cleared
      if (typeof document !== 'undefined') {
        const hasSessionCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('session-token='));
        
        console.log('API: After auth error, session-token cookie exists:', hasSessionCookie);
        
        // If we still have the cookie but the request failed, we can try again once
        if (hasSessionCookie && retryCount < 1) {
          console.log('API: Session cookie exists but auth failed, retrying once...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return authAPI.getCurrentUser(retryCount + 1);
        }
      }
      
      return null;
    }
  },
  
  // Update user role
  updateUser: async (userId: string, role: string): Promise<User> => {
    return fetchAPI<User>('/auth', {
      method: 'PATCH',
      body: JSON.stringify({ userId, role }),
    });
  },

  // Update user profile
  updateProfile: async (profileData: { name?: string; email?: string; avatar?: string }): Promise<User> => {
    return fetchAPI<User>('/user', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  // Get user profile
  getProfile: async (): Promise<User | null> => {
    try {
      return await fetchAPI<User>('/user');
    } catch (error) {
      console.log('Error getting user profile:', error);
      return null;
    }
  },
  
  // Check auth with detailed diagnostics
  checkAuthStatus: async (): Promise<any> => {
    try {
      console.log('API: Performing detailed auth status check...');
      
      interface AuthCheckResult {
        status: string;
        diagnostics?: any;
        error?: string;
        message?: string;
      }
      
      const result = await fetchAPI<AuthCheckResult>('/auth/check');
      console.log('API: Auth check completed:', result.status);
      
      // Show useful diagnostic info
      if (result.status !== 'authenticated') {
        console.log('API: Auth diagnostics:', JSON.stringify(result.diagnostics, null, 2));
      }
      
      return result;
    } catch (error) {
      console.error('API: Error checking auth status:', error);
      return {
        status: 'error',
        error: (error as Error).message
      };
    }
  },
};

// Employee API functions
export const employeeAPI = {
  // Get all employees
  getAll: async (departmentId?: string) => {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    return fetchAPI(`/employees${query}`);
  },
  
  // Get a single employee by ID
  getById: async (id: string) => {
    return fetchAPI(`/employees/${id}`);
  },
  
  // Create a new employee
  create: async (employee: any) => {
    return fetchAPI('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },
  
  // Update an employee
  update: async (id: string, employee: any) => {
    return fetchAPI(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  },
  
  // Delete an employee
  delete: async (id: string) => {
    return fetchAPI(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

// Department API functions
export const departmentAPI = {
  // Get all departments
  getAll: async () => {
    return fetchAPI('/departments');
  },
  
  // Get a single department by ID
  getById: async (id: string) => {
    return fetchAPI(`/departments/${id}`);
  },
  
  // Create a new department
  create: async (department: any) => {
    return fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  },
  
  // Update a department
  update: async (id: string, department: any) => {
    return fetchAPI(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(department),
    });
  },
  
  // Delete a department
  delete: async (id: string) => {
    return fetchAPI(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Project API functions
export const projectAPI = {
  // Get all projects
  getAll: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchAPI(`/projects${query}`);
  },
  
  // Get a single project by ID
  getById: async (id: string) => {
    return fetchAPI(`/projects/${id}`);
  },
  
  // Create a new project
  create: async (project: any) => {
    return fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },
  
  // Update a project
  update: async (id: string, project: any) => {
    return fetchAPI(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },
  
  // Delete a project
  delete: async (id: string) => {
    return fetchAPI(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Document API functions
export const documentAPI = {
  // Get all documents
  getAll: async (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return fetchAPI(`/documents${query}`);
  },
  
  // Get a single document by ID
  getById: async (id: string) => {
    return fetchAPI(`/documents/${id}`);
  },
  
  // Upload a new document
  upload: async (documentData: { 
    name: string; 
    file: File | string; // File object or data URL
    projectId?: string;
    description?: string;
    tags?: string[];
    sharedWith?: string[];
  }) => {
    // For file uploads, we need to use FormData
    if (documentData.file instanceof File) {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('name', documentData.name);
      
      if (documentData.projectId) {
        formData.append('projectId', documentData.projectId);
      }
      
      if (documentData.description) {
        formData.append('description', documentData.description);
      }
      
      if (documentData.tags) {
        formData.append('tags', JSON.stringify(documentData.tags));
      }
      
      if (documentData.sharedWith) {
        formData.append('sharedWith', JSON.stringify(documentData.sharedWith));
      }
      
      return fetchAPI('/documents', {
        method: 'POST',
        body: formData,
        headers: {
          // Remove Content-Type to let the browser set it with the boundary parameter
        },
      });
    } else {
      // For data URLs or other string representations
      return fetchAPI('/documents', {
        method: 'POST',
        body: JSON.stringify(documentData),
      });
    }
  },
  
  // Update document metadata
  updateMetadata: async (id: string, metadata: {
    name?: string;
    description?: string;
    tags?: string[];
    sharedWith?: string[];
    projectId?: string;
  }) => {
    return fetchAPI(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  },
  
  // Share document with users
  shareWith: async (id: string, userIds: string[]) => {
    return fetchAPI(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },
  
  // Delete a document
  delete: async (id: string) => {
    return fetchAPI(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Export all API services
export const API = {
  auth: authAPI,
  employees: employeeAPI,
  departments: departmentAPI,
  projects: projectAPI,
  documents: documentAPI,
}; 