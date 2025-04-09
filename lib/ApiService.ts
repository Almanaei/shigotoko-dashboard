// ApiService.ts - Centralized API service for all data fetching
"use client";

import { User, Department, Employee, Project, Message, Document, Task } from '@/lib/DashboardProvider';
import { API } from '@/lib/api';

// ServiceResponse is a wrapper for all API responses with proper error handling
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Base class for API services with common functionality
class BaseApiService {
  protected async handleApiCall<T>(
    apiCall: () => Promise<T | null>,
    errorMessage: string = 'An error occurred'
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await apiCall();
      return {
        data,
        error: null,
        loading: false
      };
    } catch (error) {
      console.error(`API Error: ${errorMessage}`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : errorMessage,
        loading: false
      };
    }
  }
}

// Authentication service
export class AuthService extends BaseApiService {
  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.login({ email, password }),
      'Login failed'
    );
  }

  async employeeLogin(email: string, password: string): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      async () => {
        const response = await fetch('/api/auth/employee/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          throw new Error(`Employee login failed: ${response.status}`);
        }
        
        return response.json();
      },
      'Employee login failed'
    );
  }

  async logout(): Promise<ServiceResponse<boolean>> {
    return this.handleApiCall<boolean>(
      async () => {
        await API.auth.logout();
        return true;
      },
      'Logout failed'
    );
  }

  async getCurrentUser(): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.getCurrentUser(),
      'Failed to get current user'
    );
  }

  async updateAvatar(userId: string, avatarData: string): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.updateProfile({ avatar: avatarData }),
      'Failed to update avatar'
    );
  }
}

// User service for managing user data
export class UserService extends BaseApiService {
  async getProfile(): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.getProfile(),
      'Failed to get user profile'
    );
  }

  async updateProfile(profileData: Partial<User>): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.updateProfile(profileData),
      'Failed to update user profile'
    );
  }

  async updateRole(userId: string, role: string): Promise<ServiceResponse<User>> {
    return this.handleApiCall<User>(
      () => API.auth.updateUser(userId, role),
      'Failed to update user role'
    );
  }
}

// Employee service for managing employee data
export class EmployeeService extends BaseApiService {
  async getAll(): Promise<ServiceResponse<Employee[]>> {
    return this.handleApiCall<Employee[]>(
      () => API.employees.getAll() as Promise<Employee[]>,
      'Failed to get employees'
    );
  }

  async getById(id: string): Promise<ServiceResponse<Employee>> {
    return this.handleApiCall<Employee>(
      () => API.employees.getById(id) as Promise<Employee>,
      `Failed to get employee with ID ${id}`
    );
  }

  async create(employee: Partial<Employee>): Promise<ServiceResponse<Employee>> {
    return this.handleApiCall<Employee>(
      () => API.employees.create(employee) as Promise<Employee>,
      'Failed to create employee'
    );
  }

  async update(id: string, employee: Partial<Employee>): Promise<ServiceResponse<Employee>> {
    return this.handleApiCall<Employee>(
      () => API.employees.update(id, employee) as Promise<Employee>,
      `Failed to update employee with ID ${id}`
    );
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.handleApiCall<boolean>(
      async () => {
        await API.employees.delete(id);
        return true;
      },
      `Failed to delete employee with ID ${id}`
    );
  }
}

// Department service for managing department data
export class DepartmentService extends BaseApiService {
  async getAll(): Promise<ServiceResponse<Department[]>> {
    return this.handleApiCall<Department[]>(
      () => API.departments.getAll() as Promise<Department[]>,
      'Failed to get departments'
    );
  }

  async getById(id: string): Promise<ServiceResponse<Department>> {
    return this.handleApiCall<Department>(
      () => API.departments.getById(id) as Promise<Department>,
      `Failed to get department with ID ${id}`
    );
  }

  async create(department: Partial<Department>): Promise<ServiceResponse<Department>> {
    return this.handleApiCall<Department>(
      () => API.departments.create(department) as Promise<Department>,
      'Failed to create department'
    );
  }

  async update(id: string, department: Partial<Department>): Promise<ServiceResponse<Department>> {
    return this.handleApiCall<Department>(
      () => API.departments.update(id, department) as Promise<Department>,
      `Failed to update department with ID ${id}`
    );
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.handleApiCall<boolean>(
      async () => {
        await API.departments.delete(id);
        return true;
      },
      `Failed to delete department with ID ${id}`
    );
  }
}

// Project service for managing project data
export class ProjectService extends BaseApiService {
  async getAll(): Promise<ServiceResponse<Project[]>> {
    return this.handleApiCall<Project[]>(
      () => API.projects.getAll() as Promise<Project[]>,
      'Failed to get projects'
    );
  }

  async getById(id: string): Promise<ServiceResponse<Project>> {
    return this.handleApiCall<Project>(
      () => API.projects.getById(id) as Promise<Project>,
      `Failed to get project with ID ${id}`
    );
  }

  async create(project: Partial<Project>): Promise<ServiceResponse<Project>> {
    return this.handleApiCall<Project>(
      () => API.projects.create(project) as Promise<Project>,
      'Failed to create project'
    );
  }

  async update(id: string, project: Partial<Project>): Promise<ServiceResponse<Project>> {
    return this.handleApiCall<Project>(
      () => API.projects.update(id, project) as Promise<Project>,
      `Failed to update project with ID ${id}`
    );
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.handleApiCall<boolean>(
      async () => {
        await API.projects.delete(id);
        return true;
      },
      `Failed to delete project with ID ${id}`
    );
  }
}

// Message service for managing message data
export class MessageService extends BaseApiService {
  async getAll(limit: number = 50): Promise<ServiceResponse<Message[]>> {
    return this.handleApiCall<Message[]>(
      () => API.messages.getAll(limit) as Promise<Message[]>,
      'Failed to get messages'
    );
  }

  async sendMessage(content: string): Promise<ServiceResponse<Message>> {
    return this.handleApiCall<Message>(
      () => API.messages.send(content) as Promise<Message>,
      'Failed to send message'
    );
  }

  async deleteMessage(id: string): Promise<ServiceResponse<boolean>> {
    return this.handleApiCall<boolean>(
      async () => {
        await API.messages.delete(id);
        return true;
      },
      `Failed to delete message with ID ${id}`
    );
  }
}

// Create and export service instances for direct use
export const authService = new AuthService();
export const userService = new UserService();
export const employeeService = new EmployeeService();
export const departmentService = new DepartmentService();
export const projectService = new ProjectService();
export const messageService = new MessageService(); 