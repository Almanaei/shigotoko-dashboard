// API service for making requests to our backend endpoints
import { User } from '@/lib/DashboardProvider';

// Base URL for API requests
const API_BASE_URL = '/api';

// Message interface
interface Message {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: string;
  senderAvatar?: string | null;
}

// Utility function for making API requests
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Initialize headers based on request body type
  let defaultHeaders = {};
  
  // Don't set Content-Type header if FormData is being sent
  // Let the browser set it automatically with the boundary parameter
  if (!(options.body instanceof FormData)) {
    defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }
  
  // Add cache-busting timestamp to prevent cached responses
  const timestampedUrl = url.includes('?') 
    ? `${url}&_t=${Date.now()}` 
    : `${url}?_t=${Date.now()}`;
  
  // Check if we need to refresh the session before making a critical request
  if (endpoint === '/user' || endpoint.startsWith('/employees/')) {
    try {
      console.log('API: Pre-emptively refreshing session before critical request to:', endpoint);
      await refreshSession();
    } catch (refreshError) {
      console.warn('API: Failed to refresh session before critical request:', refreshError);
    }
  }
  
  console.log(`API: Fetching ${options.method || 'GET'} ${timestampedUrl}`);
  
  const response = await fetch(timestampedUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
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
    console.warn(`API: Error response from ${endpoint}:`, response.status, data);
    
    // Special handling for authentication endpoints
    if (endpoint === '/auth' && response.status === 401) {
      console.log('API: Auth check failed, user not authenticated');
      return null as any; // Return null for getCurrentUser without throwing
    }
    
    // Special handling for authentication errors on other endpoints
    if (response.status === 401) {
      console.log('API: Authentication required for', endpoint);
      
      // Try to refresh the session
      try {
        console.log('API: Attempting to refresh session after 401 error');
        const refreshed = await refreshSession();
        
        if (refreshed) {
          console.log('API: Session refreshed successfully, retrying original request');
          // Session refreshed, retry original request
          return fetchAPI<T>(endpoint, options);
        }
      } catch (refreshError) {
        console.warn('API: Failed to refresh session after 401:', refreshError);
      }
      
      // Only clear cookies if refresh attempt failed or wasn't successful
      if (typeof document !== 'undefined') {
        // Clear session cookies on auth errors
        document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "employee-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "auth_type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        console.log('API: Cleared all session cookies due to authentication error');
      }
    }
    
    // Check if this is a session expired error
    if (data.error && (
      data.error.includes('expired') || 
      data.error.includes('Session not found') ||
      data.error.includes('Not authenticated')
    )) {
      throw new Error('Session expired');
    }
    
    throw new Error(data.error || 'An error occurred while fetching the data');
  }
  
  console.log(`API: Successful response from ${endpoint}`);
  return data as T;
}

// Helper function to refresh the session
async function refreshSession(): Promise<boolean> {
  try {
    // Determine which auth type to refresh
    let authType = 'user';
    if (typeof localStorage !== 'undefined') {
      authType = localStorage.getItem('authType') || 'user';
    } else if (typeof document !== 'undefined') {
      // Check cookies if localStorage is not available
      authType = document.cookie.includes('employee-session') ? 'employee' : 'user';
    }
    
    console.log('API: Refreshing session for auth type:', authType);
    
    // Add cache busting
    const timestamp = Date.now();
    
    if (authType === 'employee') {
      // Special handling for employee session that may be expired
      try {
        // First try just a normal refresh
        const response = await fetch(`/api/auth/employee?_t=${timestamp}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        if (response.ok) {
          console.log('API: Employee session refreshed successfully');
          return true;
        }
        
        // If that fails, we may need to recreate the session
        console.log('API: Normal employee session refresh failed, attempting session recovery');
        
        // Try session recovery by visiting the specific auth recovery endpoint
        const recoveryResponse = await fetch(`/api/auth/set-cookies?type=employee&action=recover&_t=${timestamp}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        if (recoveryResponse.ok) {
          console.log('API: Employee session recovery successful');
          // Try once more to refresh after recovery
          const secondAttempt = await fetch(`/api/auth/employee?_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            }
          });
          
          if (secondAttempt.ok) {
            console.log('API: Employee session fully restored');
            return true;
          }
        }
      } catch (employeeError) {
        console.warn('API: Error during employee session refresh/recovery:', employeeError);
      }
      
      // As an absolute last resort, try to create a completely new session via login
      // We would need stored credentials for this, which we probably don't have,
      // but the page can handle this gracefully with a redirect
      console.warn('API: Employee session could not be refreshed - session is fully expired');
      return false;
    } else {
      // Standard user auth refresh
      try {
        const response = await fetch(`/api/auth?_t=${timestamp}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        if (response.ok) {
          console.log('API: User session refreshed successfully');
          return true;
        }
        
        // If normal refresh fails, try recovery
        console.log('API: Normal user session refresh failed, attempting session recovery');
        
        // Try session recovery via the set-cookies endpoint
        const recoveryResponse = await fetch(`/api/auth/set-cookies?type=user&action=recover&_t=${timestamp}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        if (recoveryResponse.ok) {
          // Try one more API call after recovery
          const secondAttempt = await fetch(`/api/auth?_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            }
          });
          
          if (secondAttempt.ok) {
            console.log('API: User session fully restored after recovery');
            return true;
          }
        }
        
        console.warn('API: User session could not be refreshed - session is fully expired');
        return false;
      } catch (userError) {
        console.error('API: Error during user session refresh/recovery:', userError);
        return false;
      }
    }
    
    // If we reach here, all refresh attempts failed
    return false;
  } catch (error) {
    console.error('API: Error refreshing session:', error);
    return false;
  }
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
      
      // Determine auth type
      let authType = 'user';
      if (typeof localStorage !== 'undefined') {
        authType = localStorage.getItem('authType') || 'user';
      }
      if (typeof document !== 'undefined') {
        const hasEmployeeCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('employee-session='));
        
        if (hasEmployeeCookie) {
          authType = 'employee';
          // Update localStorage for consistency
          localStorage.setItem('authType', 'employee');
        }
      }
      
      console.log('API: Detected auth type:', authType);
      
      // Try the appropriate endpoint based on auth type
      if (authType === 'employee') {
        try {
          const response = await fetch('/api/auth/employee', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            }
          });
          
          if (response.ok) {
            const employee = await response.json();
            console.log('API: Current employee fetched successfully:', employee.name);
            return employee;
          } else {
            console.log('API: Employee auth failed, status:', response.status);
            // If employee auth fails, try standard user auth as fallback
          }
        } catch (employeeError) {
          console.error('API: Error fetching employee:', employeeError);
          // Continue to standard user auth as fallback
        }
      }
      
      // Standard user auth (or fallback)
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
      
      if (user) {
        console.log('API: Current user fetched successfully:', user.name);
        return user;
      } else {
        console.log('API: Auth endpoint returned null user');
        return null;
      }
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
      // Determine if this is an employee or standard user
      let isEmployee = false;
      if (typeof localStorage !== 'undefined') {
        isEmployee = localStorage.getItem('authType') === 'employee';
      }
      if (typeof document !== 'undefined') {
        const hasEmployeeCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('employee-session='));
        isEmployee = hasEmployeeCookie;
      }
      
      console.log('API: Getting profile for type:', isEmployee ? 'employee' : 'user');
      
      // Call appropriate endpoint
      if (isEmployee) {
        // Need to know employee ID for API call
        const currentUser = await authAPI.getCurrentUser();
        if (!currentUser || !currentUser.id) {
          console.error('API: Cannot get employee profile without an ID');
          return null;
        }
        
        const timestamp = Date.now();
        const response = await fetch(`/api/employees/${currentUser.id}?_t=${timestamp}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });
        
        if (response.ok) {
          const employee = await response.json();
          console.log('API: Got employee profile:', employee.name);
          return employee;
        } else {
          console.error('API: Failed to get employee profile, status:', response.status);
          return null;
        }
      } else {
        // Standard user profile
        const timestamp = Date.now();
        const user = await fetchAPI<User>(`/user?_t=${timestamp}`);
        console.log('API: Got user profile:', user.name);
        return user;
      }
    } catch (error) {
      console.error('API: Error getting user profile:', error);
      return null;
    }
  },
  
  // Check auth with detailed diagnostics
  checkAuthStatus: async (): Promise<any> => {
    try {
      console.log('API: Performing detailed auth status check...');
      
      interface AuthCheckResult {
        status: string;
        user?: {
          id: string;
          name: string;
          email: string;
          role?: string;
          type: 'user' | 'employee';
        };
        diagnostics?: Record<string, unknown>;
        error?: string;
        message?: string;
      }
      
      // Add timestamp and cache-busting
      const timestamp = Date.now();
      
      // Direct fetch to handle any network errors specifically
      const response = await fetch(`/api/auth/check?_t=${timestamp}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      
      // Parse result or handle error
      let result: AuthCheckResult;
      
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('API: Error parsing auth check response:', parseError);
        return {
          status: 'error',
          error: 'Failed to parse auth check response',
          statusCode: response.status
        };
      }
      
      console.log('API: Auth check completed:', result.status);
      
      // Show useful diagnostic info
      if (result.status !== 'authenticated') {
        console.log('API: Auth diagnostics:', JSON.stringify(result.diagnostics, null, 2));
      }
      
      // If we have a valid user, store auth type
      if (result.status === 'authenticated' && result.user && typeof localStorage !== 'undefined') {
        localStorage.setItem('authType', result.user.type);
        console.log('API: Stored auth type in localStorage:', result.user.type);
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
      
      if (documentData.tags && documentData.tags.length > 0) {
        formData.append('tags', documentData.tags.join(','));
      }
      
      if (documentData.sharedWith && documentData.sharedWith.length > 0) {
        formData.append('sharedWith', documentData.sharedWith.join(','));
      }
      
      return fetchAPI('/documents', {
        method: 'POST',
        body: formData,
        // Do not set any Content-Type header, let browser set it automatically
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

// Messages API functions
export const messagesAPI = {
  // Get all messages with optional pagination
  async getAll(limit: number = 50, page: number = 1): Promise<Message[]> {
    try {
      const response = await fetchAPI<{messages: Message[]}>(`/messages?limit=${limit}&page=${page}`);
      return response.messages || [];
    } catch (error) {
      console.error('API: Error fetching messages');
      // Return empty array to prevent breaking the UI
      return [];
    }
  },
  
  // Get messages after a specific timestamp
  async getAfter(timestamp: string): Promise<Message[]> {
    try {
      const response = await fetchAPI<{messages: Message[]}>(`/messages?after=${encodeURIComponent(timestamp)}`);
      return response.messages || [];
    } catch (error) {
      console.error('API: Error fetching messages after timestamp');
      // Return empty array to prevent breaking the UI
      return [];
    }
  },
  
  // Send a new message
  async send(content: string): Promise<Message> {
    try {
      const result = await fetchAPI<Message>('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      return result;
    } catch (error) {
      console.error('API: Error sending message');
      throw error; // Re-throw to allow the component to handle the error
    }
  },
  
  // Delete a message (admin or owner only)
  async delete(messageId: string): Promise<boolean> {
    try {
      await fetchAPI(`/messages/${messageId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('API: Error deleting message');
      return false;
    }
  }
};

// Notifications API functions
export const notificationsAPI = {
  // Get all notifications with optional filtering
  async getAll(options: { limit?: number; page?: number; unreadOnly?: boolean } = {}): Promise<any> {
    try {
      const { limit = 50, page = 1, unreadOnly = false } = options;
      let url = `/notifications?limit=${limit}&page=${page}`;
      
      if (unreadOnly) {
        url += '&unreadOnly=true';
      }
      
      const response = await fetchAPI(url);
      return response;
    } catch (error) {
      console.error('API: Error fetching notifications');
      // Return empty data to prevent breaking the UI
      return { notifications: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
    }
  },
  
  // Mark a notification as read
  async markAsRead(id: string): Promise<any> {
    try {
      return await fetchAPI(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
    } catch (error) {
      console.error('API: Error marking notification as read');
      throw error;
    }
  },
  
  // Mark all notifications as read
  async markAllAsRead(): Promise<any> {
    try {
      return await fetchAPI('/notifications/mark-all-read', {
        method: 'POST',
      });
    } catch (error) {
      console.error('API: Error marking all notifications as read');
      throw error;
    }
  },
  
  // Delete a notification
  async delete(id: string): Promise<boolean> {
    try {
      await fetchAPI(`/notifications/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('API: Error deleting notification');
      return false;
    }
  },
};

// Export all API services
export const API = {
  auth: authAPI,
  employees: employeeAPI,
  departments: departmentAPI,
  projects: projectAPI,
  documents: documentAPI,
  messages: messagesAPI,
  notifications: notificationsAPI,
};

export default API; 