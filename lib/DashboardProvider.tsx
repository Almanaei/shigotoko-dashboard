"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useRef } from 'react';
import { API } from '@/lib/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  color: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'inactive';
  joinDate: string;
  performance: number;
}

export type TaskStatus = 'todo' | 'progress' | 'review' | 'complete';

export interface Task {
  id: string;
  title: string;
  priority: 'Important' | 'Medium' | 'Low';
  type: 'Stagging' | 'Production';
  status: TaskStatus;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  timestamp: string;
  senderAvatar?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'message' | 'alert' | 'update';
  read: boolean;
}

export interface Stats {
  totalEmployees: number;
  totalRevenue: string;
  turnoverRate: string;
  attendanceRate: string;
  teamKPI: string;
}

export type ProjectStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';

export interface ProjectLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Document {
  id: string;
  name: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedById: string;
  uploadDate: string;
  url: string;
  sharedWith: string[]; // Array of user IDs
  projectId?: string; // Optional connection to a project
  description?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  teamMembers: string[]; // Array of employee IDs
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  progress: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  budget?: number;
  logs: ProjectLog[];
}

export interface DashboardState {
  currentUser: User | null;
  employees: Employee[];
  departments: Department[];
  projects: Project[];
  projectLogs: ProjectLog[];
  documents: Document[];
  tasks: Task[];
  stats: Stats | null;
  notifications: Notification[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Action types
export const ACTIONS = {
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SET_DEPARTMENTS: 'SET_DEPARTMENTS',
  ADD_DEPARTMENT: 'ADD_DEPARTMENT',
  UPDATE_DEPARTMENT: 'UPDATE_DEPARTMENT',
  DELETE_DEPARTMENT: 'DELETE_DEPARTMENT',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  ADD_PROJECT_LOG: 'ADD_PROJECT_LOG',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SET_STATS: 'SET_STATS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED',
} as const;

// Define action types with literal types for better type checking
type ActionType = typeof ACTIONS[keyof typeof ACTIONS];

// Action types with specific discriminated union
type Action =
  | { type: typeof ACTIONS.SET_CURRENT_USER; payload: User | null }
  | { type: typeof ACTIONS.SET_EMPLOYEES; payload: Employee[] }
  | { type: typeof ACTIONS.ADD_EMPLOYEE; payload: Employee }
  | { type: typeof ACTIONS.UPDATE_EMPLOYEE; payload: { id: string, employee: Partial<Employee> } }
  | { type: typeof ACTIONS.DELETE_EMPLOYEE; payload: string }
  | { type: typeof ACTIONS.SET_DEPARTMENTS; payload: Department[] }
  | { type: typeof ACTIONS.ADD_DEPARTMENT; payload: Department }
  | { type: typeof ACTIONS.UPDATE_DEPARTMENT; payload: { id: string, department: Partial<Department> } }
  | { type: typeof ACTIONS.DELETE_DEPARTMENT; payload: string }
  | { type: typeof ACTIONS.SET_PROJECTS; payload: Project[] }
  | { type: typeof ACTIONS.ADD_PROJECT; payload: Project }
  | { type: typeof ACTIONS.UPDATE_PROJECT; payload: { id: string, project: Partial<Project> } }
  | { type: typeof ACTIONS.DELETE_PROJECT; payload: string }
  | { type: typeof ACTIONS.ADD_PROJECT_LOG; payload: ProjectLog }
  | { type: typeof ACTIONS.SET_DOCUMENTS; payload: Document[] }
  | { type: typeof ACTIONS.ADD_DOCUMENT; payload: Document }
  | { type: typeof ACTIONS.UPDATE_DOCUMENT; payload: { id: string, document: Partial<Document> } }
  | { type: typeof ACTIONS.DELETE_DOCUMENT; payload: string }
  | { type: typeof ACTIONS.SET_TASKS; payload: Task[] }
  | { type: typeof ACTIONS.ADD_TASK; payload: Task }
  | { type: typeof ACTIONS.UPDATE_TASK; payload: { id: string, task: Partial<Task> } }
  | { type: typeof ACTIONS.DELETE_TASK; payload: string }
  | { type: typeof ACTIONS.SET_STATS; payload: Stats }
  | { type: typeof ACTIONS.SET_NOTIFICATIONS; payload: Notification[] }
  | { type: typeof ACTIONS.SET_MESSAGES; payload: Message[] }
  | { type: typeof ACTIONS.ADD_MESSAGE; payload: Message }
  | { type: typeof ACTIONS.UPDATE_MESSAGE; payload: { oldId: string; message: Message } }
  | { type: typeof ACTIONS.REMOVE_MESSAGE; payload: string }
  | { type: typeof ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof ACTIONS.SET_INITIALIZED; payload: boolean };

type DashboardDispatch = (action: Action) => void;

// Initial state
const initialState: DashboardState = {
  currentUser: null,
  employees: [],
  departments: [],
  projects: [],
  projectLogs: [],
  documents: [],
  tasks: [],
  stats: {
    totalEmployees: 0,
    totalRevenue: '$0',
    turnoverRate: '0%',
    attendanceRate: '0%',
    teamKPI: '0%'
  },
  notifications: [],
  messages: [],
  loading: true,
  error: null,
  initialized: false,
};

// Type-safe reducer that correctly handles each action type
const dashboardReducer = (state: DashboardState, action: Action): DashboardState => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
    case ACTIONS.SET_EMPLOYEES:
      return { ...state, employees: action.payload };
    case ACTIONS.ADD_EMPLOYEE:
      return { ...state, employees: [...state.employees, action.payload] };
    case ACTIONS.UPDATE_EMPLOYEE: {
      const { id, employee } = action.payload;
      return {
        ...state,
        employees: state.employees.map(emp =>
          emp.id === id ? { ...emp, ...employee } : emp
        ),
      };
    }
    case ACTIONS.DELETE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.filter(employee => employee.id !== action.payload),
      };
    case ACTIONS.SET_DEPARTMENTS:
      return { ...state, departments: action.payload };
    case ACTIONS.ADD_DEPARTMENT:
      return { ...state, departments: [...state.departments, action.payload] };
    case ACTIONS.UPDATE_DEPARTMENT: {
      const { id, department } = action.payload;
      return {
        ...state,
        departments: state.departments.map(dept =>
          dept.id === id ? { ...dept, ...department } : dept
        ),
      };
    }
    case ACTIONS.DELETE_DEPARTMENT:
      return {
        ...state,
        departments: state.departments.filter(department => department.id !== action.payload),
      };
    case ACTIONS.SET_PROJECTS:
      return { ...state, projects: action.payload };
    case ACTIONS.ADD_PROJECT:
      return { ...state, projects: [...state.projects, action.payload] };
    case ACTIONS.UPDATE_PROJECT: {
      const { id, project } = action.payload;
      return {
        ...state,
        projects: state.projects.map(proj =>
          proj.id === id ? { ...proj, ...project } : proj
        ),
      };
    }
    case ACTIONS.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };
    case ACTIONS.ADD_PROJECT_LOG: {
      const newLog = action.payload;
      return {
        ...state,
        projects: state.projects.map(project => 
          project.id === newLog.projectId
            ? { ...project, logs: [...project.logs, newLog] }
            : project
        ),
        projectLogs: [...state.projectLogs, newLog]
      };
    }
    case ACTIONS.SET_DOCUMENTS:
      return { ...state, documents: action.payload };
    case ACTIONS.ADD_DOCUMENT:
      return { ...state, documents: [...state.documents, action.payload] };
    case ACTIONS.UPDATE_DOCUMENT: {
      const { id, document } = action.payload;
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === id ? { ...doc, ...document } : doc
        ),
      };
    }
    case ACTIONS.DELETE_DOCUMENT:
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
      };
    case ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload };
    case ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case ACTIONS.UPDATE_TASK: {
      const { id, task } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, ...task } : t
        ),
      };
    }
    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    case ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    case ACTIONS.SET_MESSAGES:
      return { ...state, messages: action.payload };
    case ACTIONS.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    case ACTIONS.UPDATE_MESSAGE: {
      const { oldId, message } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === oldId ? message : msg
        )
      };
    }
    case ACTIONS.REMOVE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_INITIALIZED:
      return { ...state, initialized: action.payload };
    default:
      return state;
  }
};

// Create the context
const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Create separate context for user/profile data
export interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialUserState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

// Create separate action types for user context
export const USER_ACTIONS = {
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_USER_LOADING: 'SET_USER_LOADING',
  SET_USER_ERROR: 'SET_USER_ERROR',
  UPDATE_AVATAR: 'UPDATE_AVATAR',
} as const;

type UserAction =
  | { type: typeof USER_ACTIONS.SET_CURRENT_USER; payload: User | null }
  | { type: typeof USER_ACTIONS.SET_USER_LOADING; payload: boolean }
  | { type: typeof USER_ACTIONS.SET_USER_ERROR; payload: string | null }
  | { type: typeof USER_ACTIONS.UPDATE_AVATAR; payload: string };

// User context reducer
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case USER_ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
    case USER_ACTIONS.SET_USER_LOADING:
      return { ...state, loading: action.payload };
    case USER_ACTIONS.SET_USER_ERROR:
      return { ...state, error: action.payload };
    case USER_ACTIONS.UPDATE_AVATAR:
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, avatar: action.payload }
          : null,
      };
    default:
      return state;
  }
};

// Create user context
const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
}>({
  state: initialUserState,
  dispatch: () => null,
});

// UserProvider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialUserState);
  
  // Reference for tracking avatar updates to prevent loops
  const lastAvatarUpdateRef = useRef<string | null>(null);
  
  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Set loading state
        dispatch({ type: USER_ACTIONS.SET_USER_LOADING, payload: true });
        
        console.log('UserProvider: Loading user data...');
        
        // Check for any cached auth type
        let authType = '';
        if (typeof localStorage !== 'undefined') {
          authType = localStorage.getItem('authType') || '';
        }
        if (typeof document !== 'undefined' && document.cookie.includes('employee-session')) {
          authType = 'employee';
        }
        
        console.log('UserProvider: Using auth type:', authType || 'Default');
        
        let userData = null;
        let authAttemptMade = false;
        
        // Try the auth/check endpoint first
        try {
          console.log('UserProvider: Trying auth/check endpoint first...');
          const checkResponse = await fetch('/api/auth/check', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            }
          });
          
          authAttemptMade = true;
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            
            if (checkData.status === 'authenticated' && checkData.user) {
              userData = checkData.user;
              console.log('UserProvider: Authenticated via auth/check as:', 
                userData.type, userData.name);
              
              // Update auth type for consistency
              authType = userData.type;
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('authType', userData.type);
              }
            }
          }
        } catch (checkError) {
          console.error('UserProvider: Error with auth/check endpoint:', checkError);
        }
        
        // If auth/check failed and we have an employee auth type, try the employee endpoint
        if (!userData && authType === 'employee') {
          try {
            const response = await fetch('/api/auth/employee', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            });
            
            authAttemptMade = true;
            
            if (response.ok) {
              userData = await response.json();
              console.log('UserProvider: Authenticated as Employee:', userData.name);
            }
          } catch (employeeError) {
            console.error('UserProvider: Error checking employee authentication:', employeeError);
          }
        }
        
        // Default to standard user auth if employee auth failed or not specified
        if (!userData && (!authType || authType === 'user')) {
          try {
            userData = await API.auth.getCurrentUser();
            authAttemptMade = true;
            
            if (userData) {
              console.log('UserProvider: Authenticated as User:', userData.name);
            }
          } catch (userError) {
            console.error('UserProvider: Error checking user authentication:', userError);
          }
        }
        
        // Check if we have user data from either method
        if (userData) {
          // Check for localStorage avatar backup
          if (!userData.avatar && typeof localStorage !== 'undefined') {
            const storedAvatar = localStorage.getItem('userAvatar') || 
                              localStorage.getItem('tempAvatarPreview');
            if (storedAvatar) {
              console.log('UserProvider: Found stored avatar in localStorage');
              userData.avatar = storedAvatar;
            }
          }
          
          // Update the current user
          dispatch({
            type: USER_ACTIONS.SET_CURRENT_USER,
            payload: userData
          });
        } else {
          // No authenticated user found
          console.log('UserProvider: No authenticated user found');
          
          // Only dispatch if we actually tried to authenticate
          if (authAttemptMade) {
            dispatch({
              type: USER_ACTIONS.SET_CURRENT_USER,
              payload: null
            });
          }
        }
        
        // Clear loading state
        dispatch({ type: USER_ACTIONS.SET_USER_LOADING, payload: false });
        
      } catch (error) {
        console.error('UserProvider: Error loading user data:', error);
        dispatch({ type: USER_ACTIONS.SET_USER_ERROR, payload: 'Failed to load user data' });
        dispatch({ type: USER_ACTIONS.SET_USER_LOADING, payload: false });
      }
    };
    
    loadUserData();
  }, []);

  // Separate effect for handling avatar updates
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      try {
        // Skip if no user is logged in
        if (!state.currentUser) return;
        
        // Get the latest update time from localStorage
        const updateTime = localStorage.getItem('lastAvatarUpdate');
        
        // Extract avatar data from CustomEvent if available
        let avatarData: string | null = null;
        
        if (event instanceof CustomEvent && event.detail && event.detail.avatar) {
          console.log('UserProvider: Received avatar data from CustomEvent');
          avatarData = event.detail.avatar;
        }
        
        // If avatar data wasn't in the event, try to get it from localStorage
        if (!avatarData) {
          avatarData = localStorage.getItem('userAvatar') || 
                     localStorage.getItem('tempAvatarPreview');
        }
        
        // Only process if this is actually a new update and we have avatar data
        if (updateTime && updateTime !== lastAvatarUpdateRef.current && avatarData) {
          console.log('UserProvider: Detected new avatar update');
          
          if (avatarData && avatarData !== state.currentUser.avatar) {
            console.log('UserProvider: Updating avatar from event');
            
            // Update the ref first to prevent re-processing
            lastAvatarUpdateRef.current = updateTime;
            
            // Use the dedicated avatar update action
            dispatch({
              type: USER_ACTIONS.UPDATE_AVATAR,
              payload: avatarData
            });
            
            // Also update the currentUser object in localStorage to maintain consistency
            if (typeof localStorage !== 'undefined' && state.currentUser) {
              try {
                const currentUserString = localStorage.getItem('currentUser');
                if (currentUserString) {
                  const currentUser = JSON.parse(currentUserString);
                  currentUser.avatar = avatarData;
                  localStorage.setItem('currentUser', JSON.stringify(currentUser));
                  console.log('UserProvider: Updated currentUser in localStorage with new avatar');
                }
              } catch (e) {
                console.error('UserProvider: Error updating localStorage currentUser:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('UserProvider: Error handling avatar update:', error);
      }
    };
    
    // Listen for avatar update events
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
    };
  }, [state.currentUser]); // Only re-attach when current user changes

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Function to update avatar safely
export function updateUserAvatar(avatar: string) {
  console.log('updateUserAvatar: Updating avatar in all locations');
  
  // Store in localStorage as the single source of truth
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('userAvatar', avatar);
    localStorage.setItem('lastAvatarUpdate', Date.now().toString());
  }
  
  // Trigger the event to update all components
  if (typeof window !== 'undefined') {
    // Dispatch a custom event with the avatar data to ensure all components receive it
    const avatarEvent = new CustomEvent('avatarUpdated', {
      detail: { avatar }
    });
    window.dispatchEvent(avatarEvent);
    
    // Also dispatch the regular event for backward compatibility
    window.dispatchEvent(new Event('avatarUpdated'));
  }
  
  // Also try to persist the avatar to the server if possible
  try {
    // Use a non-blocking approach to avoid slowing down the UI update
    setTimeout(async () => {
      try {
        // Determine if we should use the employee or user API
        const authType = localStorage.getItem('authType');
        
        if (authType === 'employee') {
          // For employees, you'd use the employee API
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          if (currentUser && currentUser.id) {
            await fetch(`/api/employees/${currentUser.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ avatar }),
              credentials: 'include'
            });
            console.log('updateUserAvatar: Updated employee avatar on server');
          }
        } else {
          // Use the standard user API
          await API.auth.updateProfile({ avatar });
          console.log('updateUserAvatar: Updated user avatar on server');
        }
      } catch (error) {
        console.error('updateUserAvatar: Error saving avatar to server:', error);
        // The local storage update will still work even if server sync fails
      }
    }, 0);
  } catch (e) {
    console.error('updateUserAvatar: Error initiating server update:', e);
  }
}

// Modify the DashboardProvider to use the UserProvider for user state
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [initialized, setInitialized] = useState(false);
  
  // Load dashboard data when UserProvider has authenticated
  const { state: userState } = useUser();
  
  useEffect(() => {
    // Only load dashboard data after user authentication is complete
    if (userState.currentUser && !initialized) {
      console.log('DashboardProvider: Loading dashboard data for user:', userState.currentUser.name);
      
      // Initialize with default stats first to avoid null references
      dispatch({ 
        type: ACTIONS.SET_STATS, 
        payload: {
          totalEmployees: 0,
          totalRevenue: '$0',
          turnoverRate: '0%',
          attendanceRate: '0%',
          teamKPI: '0%'
        } 
      });
      
      // Set current user from UserProvider
      dispatch({
        type: ACTIONS.SET_CURRENT_USER,
        payload: userState.currentUser
      });
      
      // Load dashboard data
      fetchDashboardData(dispatch, userState.currentUser.role === 'employee');
      
      // Set initialized
      setInitialized(true);
      dispatch({ type: ACTIONS.SET_INITIALIZED, payload: true });
    }
  }, [userState.currentUser, initialized]);
  
  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      try {
        if (!state.currentUser) return;
        
        // Try to get avatar from event first
        let avatarData: string | null = null;
        if (event instanceof CustomEvent && event.detail && event.detail.avatar) {
          avatarData = event.detail.avatar;
        }
        
        // If not in event, check localStorage
        if (!avatarData) {
          avatarData = localStorage.getItem('userAvatar') || 
                    localStorage.getItem('tempAvatarPreview');
        }
        
        if (avatarData && state.currentUser && state.currentUser.avatar !== avatarData) {
          console.log('DashboardProvider: Updating currentUser with new avatar');
          
          // Create a new user object with the updated avatar
          const updatedUser = {
            ...state.currentUser,
            avatar: avatarData
          };
          
          // Update state with the new user object
          dispatch({
            type: ACTIONS.SET_CURRENT_USER,
            payload: updatedUser
          });
        }
      } catch (error) {
        console.error('DashboardProvider: Error handling avatar update:', error);
      }
    };
    
    // Listen for avatar update events
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
    };
  }, [state.currentUser]);
  
  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Initialize data from API
async function initializeData(dispatch: DashboardDispatch) {
  try {
    // Fetch employees
    const employees = await API.employees.getAll();
    dispatch({ 
      type: ACTIONS.SET_EMPLOYEES, 
      payload: employees as Employee[] 
    });
    
    // Fetch departments
    const departments = await API.departments.getAll();
    dispatch({ 
      type: ACTIONS.SET_DEPARTMENTS, 
      payload: departments as Department[] 
    });
    
    // Fetch projects
    const projects = await API.projects.getAll();
    dispatch({ 
      type: ACTIONS.SET_PROJECTS, 
      payload: projects as Project[] 
    });
    
    // Calculate stats
    const stats: Stats = {
      totalEmployees: (employees as Employee[]).length,
      totalRevenue: '$' + (Math.floor(Math.random() * 100000) + 50000),
      turnoverRate: Math.floor(Math.random() * 10) + '%',
      attendanceRate: (90 + Math.floor(Math.random() * 10)) + '%',
      teamKPI: (75 + Math.floor(Math.random() * 20)) + '%'
    };
    
    dispatch({ type: ACTIONS.SET_STATS, payload: stats });
    
    // Fetch real messages from API instead of using mock data
    try {
      const response = await fetch('/api/messages?limit=50');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
          // Format messages for our state
          const formattedMessages = data.messages
            .map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender,
              senderName: msg.senderName || 'Unknown',
              timestamp: msg.timestamp
            }))
            .sort((a: any, b: any) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          
          dispatch({ 
            type: ACTIONS.SET_MESSAGES, 
            payload: formattedMessages 
          });
        }
      } else {
        console.error('Error fetching messages:', response.status);
        // Fall back to empty messages array
        dispatch({ 
          type: ACTIONS.SET_MESSAGES, 
          payload: [] 
        });
      }
    } catch (messagesError) {
      console.error('Error fetching messages:', messagesError);
      // Fall back to empty messages array
      dispatch({ 
        type: ACTIONS.SET_MESSAGES, 
        payload: [] 
      });
    }
    
    // For now, keep using mock data for notifications
    // TODO: Implement real API endpoints for these
    
    // Mock notifications
    const mockNotifications = generateMockNotifications();
    dispatch({ 
      type: ACTIONS.SET_NOTIFICATIONS, 
      payload: mockNotifications 
    });
    
  } catch (error) {
    console.error('Error initializing data:', error);
    dispatch({ 
      type: ACTIONS.SET_ERROR, 
      payload: 'Failed to load dashboard data. Please refresh the page.' 
    });
    
    // Fallback to mock data
    initializeMockData(dispatch);
  }
}

// Generate mock notifications
function generateMockNotifications(): Notification[] {
  return [
    {
      id: 'notif-1',
      title: 'New Task Assigned',
      description: 'You have been assigned a new task: Dashboard redesign',
      type: 'alert',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'notif-2',
      title: 'Project Update',
      description: 'Website project is now 60% complete',
      type: 'update',
      read: true,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'notif-3',
      title: 'Meeting Reminder',
      description: 'Team meeting in 30 minutes',
      type: 'message',
      read: false,
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'notif-4',
      title: 'System Update',
      description: 'System maintenance scheduled for tonight',
      type: 'update',
      read: false,
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ];
}

// Mock data initialization
export function initializeMockData(dispatch: DashboardDispatch) {
  // Define the mock user for reference in this function
  const mockUser: User = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@shigotoko.com',
    avatar: '/avatars/admin.jpg',
    role: 'Admin'
  };

  // Mock departments
  const mockDepartments: Department[] = [
    {
      id: 'dept-1',
      name: 'Engineering',
      description: 'Software development and engineering',
      employeeCount: 12,
      color: '#3b82f6' // blue-500
    },
    {
      id: 'dept-2',
      name: 'Design',
      description: 'UI/UX and graphic design',
      employeeCount: 8,
      color: '#8b5cf6' // violet-500
    },
    {
      id: 'dept-3',
      name: 'Marketing',
      description: 'Digital marketing and brand management',
      employeeCount: 6,
      color: '#10b981' // emerald-500
    },
    {
      id: 'dept-4',
      name: 'HR',
      description: 'Human resources and talent acquisition',
      employeeCount: 4,
      color: '#f59e0b' // amber-500
    },
    {
      id: 'dept-5',
      name: 'Finance',
      description: 'Financial planning and accounting',
      employeeCount: 5,
      color: '#ef4444' // red-500
    }
  ];

  // Mock employees
  const mockEmployees: Employee[] = [
    {
      id: 'emp-1',
      name: 'Sarah Chen',
      position: 'Senior Developer',
      department: 'Engineering',
      email: 'sarah@shigotoko.com',
      phone: '+1 (555) 123-4567',
      avatar: '/avatars/sarah.jpg',
      status: 'active',
      joinDate: '2022-03-15',
      performance: 92
    },
    {
      id: 'emp-2',
      name: 'John Smith',
      position: 'UI Designer',
      department: 'Design',
      email: 'john@shigotoko.com',
      phone: '+1 (555) 234-5678',
      avatar: '/avatars/john.jpg',
      status: 'active',
      joinDate: '2022-05-20',
      performance: 85
    },
    {
      id: '1',
      name: "Ann Bergson",
      position: "Lead Designer",
      department: "Design",
      email: "ann.bergson@example.com",
      phone: "+1-202-555-0101",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2020-05-01",
      performance: 85
    },
    {
      id: '2',
      name: "Kierra Rosser",
      position: "UI Designer",
      department: "Design",
      email: "kierra.rosser@example.com",
      phone: "+1-202-555-0102",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2021-03-15",
      performance: 90
    },
    {
      id: '3',
      name: "Terry Philips",
      position: "UI Designer",
      department: "Design",
      email: "terry.philips@example.com",
      phone: "+1-202-555-0103",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2022-01-01",
      performance: 88
    },
    {
      id: '4',
      name: "Jennifer Wilson",
      position: "Frontend Developer",
      department: "Engineering",
      email: "jennifer.wilson@example.com",
      phone: "+1-202-555-0104",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2020-08-15",
      performance: 92
    },
    {
      id: '5',
      name: "Michael Chen",
      position: "Backend Developer",
      department: "Engineering",
      email: "michael.chen@example.com",
      phone: "+1-202-555-0105",
      avatar: "/avatar-placeholder.png",
      status: "on-leave",
      joinDate: "2019-11-05",
      performance: 78
    },
    {
      id: '6',
      name: "Sara Johnson",
      position: "DevOps Engineer",
      department: "Engineering",
      email: "sara.johnson@example.com",
      phone: "+1-202-555-0106",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2021-06-22",
      performance: 81
    },
    {
      id: '7',
      name: "David Kim",
      position: "Marketing Specialist",
      department: "Marketing",
      email: "david.kim@example.com",
      phone: "+1-202-555-0107",
      avatar: "/avatar-placeholder.png",
      status: "inactive",
      joinDate: "2020-03-10",
      performance: 65
    },
    {
      id: '8',
      name: "Melissa Garcia",
      position: "HR Manager",
      department: "HR",
      email: "melissa.garcia@example.com",
      phone: "+1-202-555-0108",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2018-07-19",
      performance: 94
    }
  ];

  // Mock tasks
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review employee appraisals',
      priority: 'Important',
      type: 'Stagging',
      status: 'todo'
    },
    {
      id: 'task-2',
      title: 'Onboard new employees',
      priority: 'Medium',
      type: 'Production',
      status: 'progress'
    },
    {
      id: 'task-3',
      title: 'Approve leave requests',
      priority: 'Important',
      type: 'Stagging',
      status: 'review'
    },
    {
      id: 'task-4',
      title: 'Review department budget',
      priority: 'Important',
      type: 'Stagging',
      status: 'complete'
    }
  ];

  // Mock messages
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      content: "Hi team, does anyone have the latest version of the project report?",
      sender: 'user-1', // Current user
      senderName: 'You',
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 'msg-2',
      content: 'Thanks! I need some help with the onboarding process.',
      sender: 'user-1', // Current user
      senderName: 'You',
      timestamp: new Date(Date.now() - 3000000).toISOString() // 50 minutes ago
    },
    {
      id: 'msg-3',
      content: 'Sure, I can help with that. What specific part of the onboarding process do you need assistance with?',
      sender: 'user-1', // Current user
      senderName: 'You',
      timestamp: new Date(Date.now() - 2700000).toISOString() // 45 minutes ago
    },
    {
      id: 'msg-4',
      content: 'I just added some new design mockups to the shared folder. Can everyone take a look when you get a chance?',
      sender: 'user-1', // Current user
      senderName: 'You',
      timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
    }
  ];

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'New Message',
      description: 'You have a new message from HR department',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'message',
      read: false
    },
    {
      id: 'notif-2',
      title: 'Task Update',
      description: 'Your task "Review employee appraisals" is due tomorrow',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'alert',
      read: false
    },
    {
      id: 'notif-3',
      title: 'System Update',
      description: 'The system will undergo maintenance tonight at 10 PM',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'update',
      read: true
    }
  ];

  // Mock stats
  const mockStats: Stats = {
    totalEmployees: 323,
    totalRevenue: '$8,903.44',
    turnoverRate: '8%',
    attendanceRate: '94%',
    teamKPI: '82.10%'
  };

  // Mock projects
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Redesign the company website with a modern UI and improved UX',
      departmentId: 'dept-2', // Design department
      teamMembers: ['emp-2', '3'],
      startDate: '2023-11-01',
      dueDate: '2024-03-15',
      status: 'in-progress',
      progress: 45,
      priority: 'High',
      budget: 25000,
      logs: [
        {
          id: 'log-1',
          projectId: 'proj-1',
          userId: 'user-1',
          userName: 'Admin User',
          action: 'Created project',
          timestamp: '2023-11-01T10:30:00Z',
        },
        {
          id: 'log-2',
          projectId: 'proj-1',
          userId: 'emp-2',
          userName: 'John Smith',
          action: 'Updated progress to 45%',
          timestamp: '2024-01-15T14:22:00Z',
        }
      ]
    },
    {
      id: 'proj-2',
      name: 'Mobile App Development',
      description: 'Develop a native mobile app for both iOS and Android platforms',
      departmentId: 'dept-1', // Engineering department
      teamMembers: ['emp-1', '4', '6'],
      startDate: '2023-12-01',
      dueDate: '2024-06-30',
      status: 'in-progress',
      progress: 30,
      priority: 'Urgent',
      budget: 75000,
      logs: [
        {
          id: 'log-3',
          projectId: 'proj-2',
          userId: 'user-1',
          userName: 'Admin User',
          action: 'Created project',
          timestamp: '2023-12-01T09:15:00Z',
        },
        {
          id: 'log-4',
          projectId: 'proj-2',
          userId: 'emp-1',
          userName: 'Sarah Chen',
          action: 'Added team members',
          timestamp: '2023-12-05T11:30:00Z',
          details: 'Added Jennifer Wilson and Sara Johnson to the project team'
        }
      ]
    },
    {
      id: 'proj-3',
      name: 'Q1 Marketing Campaign',
      description: 'Plan and execute marketing campaign for Q1 2024',
      departmentId: 'dept-3', // Marketing department
      teamMembers: ['7'],
      startDate: '2024-01-01',
      dueDate: '2024-03-31',
      status: 'planning',
      progress: 15,
      priority: 'Medium',
      budget: 15000,
      logs: [
        {
          id: 'log-5',
          projectId: 'proj-3',
          userId: 'user-1',
          userName: 'Admin User',
          action: 'Created project',
          timestamp: '2023-12-20T13:45:00Z',
        }
      ]
    }
  ];

  // Set mock data in state, but don't overwrite current user if it exists
  dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: mockDepartments });
  dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: mockEmployees });
  dispatch({ type: ACTIONS.SET_PROJECTS, payload: mockProjects });
  dispatch({ type: ACTIONS.SET_TASKS, payload: mockTasks });
  dispatch({ type: ACTIONS.SET_STATS, payload: mockStats });
  dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: mockNotifications });
  dispatch({ type: ACTIONS.SET_MESSAGES, payload: mockMessages });
}

// Add the fetchDashboardData function to load dashboard data
const fetchDashboardData = (dispatch: DashboardDispatch, isEmployee: boolean = false) => {
  console.log('DashboardProvider: Loading dashboard data');
  
  // Initialize with default stats first to prevent null reference errors
  dispatch({ 
    type: ACTIONS.SET_STATS, 
    payload: {
      totalEmployees: 0,
      totalRevenue: '$0',
      turnoverRate: '0%',
      attendanceRate: '0%',
      teamKPI: '0%'
    }
  });
  
  // Mock notifications
  const mockNotifications = generateMockNotifications();
  dispatch({ 
    type: ACTIONS.SET_NOTIFICATIONS, 
    payload: mockNotifications 
  });
  
  // Mock stats with actual values
  const mockStats: Stats = {
    totalEmployees: 323,
    totalRevenue: '$8,903.44',
    turnoverRate: '8%',
    attendanceRate: '94%',
    teamKPI: '82.10%'
  };
  
  // Set mock data in state
  dispatch({ type: ACTIONS.SET_STATS, payload: mockStats });
  
  // Mock departments
  const mockDepartments: Department[] = [
    {
      id: 'dept-1',
      name: 'Engineering',
      description: 'Software development and engineering',
      employeeCount: 12,
      color: '#3b82f6' // blue-500
    },
    {
      id: 'dept-2',
      name: 'Design',
      description: 'UI/UX and graphic design',
      employeeCount: 8,
      color: '#8b5cf6' // violet-500
    },
    {
      id: 'dept-3',
      name: 'Marketing',
      description: 'Digital marketing and brand management',
      employeeCount: 6,
      color: '#10b981' // emerald-500
    },
    {
      id: 'dept-4',
      name: 'HR',
      description: 'Human resources and talent acquisition',
      employeeCount: 4,
      color: '#f59e0b' // amber-500
    },
    {
      id: 'dept-5',
      name: 'Finance',
      description: 'Financial planning and accounting',
      employeeCount: 5,
      color: '#ef4444' // red-500
    }
  ];
  
  // Set mock data in state
  dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: mockDepartments });
  
  // Load other mock data through the existing function
  initializeMockData(dispatch);
  
  // Set loading to false
  dispatch({ type: ACTIONS.SET_LOADING, payload: false });
};