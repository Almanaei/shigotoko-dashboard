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
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'An error occurred while fetching the data');
  }
  
  return response.json() as Promise<T>;
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
  
  // Register a new user
  register: async (userData: { name: string; email: string; password: string; role?: string }): Promise<User> => {
    return fetchAPI<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // Logout user
  logout: async (): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>('/auth', {
      method: 'DELETE',
    });
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      return await fetchAPI<User>('/auth');
    } catch (error) {
      console.log('Error getting current user:', error);
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

// Export all API services
export const API = {
  auth: authAPI,
  employees: employeeAPI,
  departments: departmentAPI,
  projects: projectAPI,
}; 