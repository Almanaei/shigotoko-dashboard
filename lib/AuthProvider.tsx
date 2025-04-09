"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { API } from '@/lib/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

// Auth context state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authType: 'user' | 'employee' | null;
}

// Initial state
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authType: null
};

// Auth action types
export const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  LOGOUT: 'LOGOUT',
  UPDATE_AVATAR: 'UPDATE_AVATAR',
} as const;

type AuthAction =
  | { type: typeof AUTH_ACTIONS.AUTH_START }
  | { type: typeof AUTH_ACTIONS.AUTH_SUCCESS; payload: { user: User; authType: 'user' | 'employee' } }
  | { type: typeof AUTH_ACTIONS.AUTH_FAILURE; payload: string }
  | { type: typeof AUTH_ACTIONS.UPDATE_USER; payload: User }
  | { type: typeof AUTH_ACTIONS.LOGOUT }
  | { type: typeof AUTH_ACTIONS.UPDATE_AVATAR; payload: string };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authType: action.payload.authType,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };
    case AUTH_ACTIONS.UPDATE_AVATAR:
      return {
        ...state,
        user: state.user ? { ...state.user, avatar: action.payload } : null
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAvatar: (avatar: string) => void;
}>({
  state: initialAuthState,
  dispatch: () => null,
  login: async () => false,
  logout: async () => {},
  updateAvatar: () => {}
});

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      // Try user login first
      try {
        const user = await API.auth.login({ email, password });
        if (user) {
          // Store auth type in localStorage
          localStorage.setItem('authType', 'user');
          
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: { user, authType: 'user' }
          });
          return true;
        }
      } catch (userError) {
        console.log('User login failed, trying employee login:', userError);
      }
      
      // Try employee login if user login fails
      try {
        const response = await fetch('/api/auth/employee/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (response.ok) {
          const employee = await response.json();
          
          // Store auth type in localStorage
          localStorage.setItem('authType', 'employee');
          
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: { user: employee, authType: 'employee' }
          });
          return true;
        }
      } catch (employeeError) {
        console.log('Employee login failed:', employeeError);
      }
      
      // If we get here, both login methods failed
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: 'Invalid email or password'
      });
      return false;
      
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: 'An error occurred during login'
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const authType = localStorage.getItem('authType') as 'user' | 'employee' | null;
      
      if (authType === 'user') {
        await API.auth.logout();
      } else if (authType === 'employee') {
        await fetch('/api/auth/employee', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Clear cookies
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "employee-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Clear localStorage
      localStorage.removeItem('authType');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('lastAvatarUpdate');
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still reset state even if API call fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update avatar function
  const updateAvatar = (avatar: string): void => {
    // Store in localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userAvatar', avatar);
      localStorage.setItem('lastAvatarUpdate', Date.now().toString());
    }
    
    // Update auth state
    dispatch({
      type: AUTH_ACTIONS.UPDATE_AVATAR,
      payload: avatar
    });
    
    // Trigger event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('avatarUpdated'));
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.AUTH_START });
        
        // Check for auth type in localStorage
        let authType = localStorage.getItem('authType') as 'user' | 'employee' | null;
        
        // If no auth type in localStorage, check cookies
        if (!authType && typeof document !== 'undefined') {
          const hasEmployeeSession = document.cookie.includes('employee-session');
          if (hasEmployeeSession) {
            authType = 'employee';
            localStorage.setItem('authType', 'employee');
          } else if (document.cookie.includes('session-token') || document.cookie.includes('session_token')) {
            authType = 'user';
            localStorage.setItem('authType', 'user');
          }
        }
        
        let userData = null;
        
        // Try the auth/check endpoint first
        const checkResponse = await fetch('/api/auth/check', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          
          if (checkData.status === 'authenticated' && checkData.user) {
            userData = checkData.user;
            authType = userData.type || authType;
            
            if (authType) {
              localStorage.setItem('authType', authType);
            }
          }
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
            
            if (response.ok) {
              userData = await response.json();
            }
          } catch (error) {
            console.error('Employee auth check error:', error);
          }
        }
        
        // Default to standard user auth if employee auth failed or not specified
        if (!userData && (!authType || authType === 'user')) {
          try {
            userData = await API.auth.getCurrentUser();
            if (userData) {
              authType = 'user';
            }
          } catch (error) {
            console.error('User auth check error:', error);
          }
        }
        
        // Check if we have user data from either method
        if (userData) {
          // Check for localStorage avatar backup
          if (!userData.avatar && typeof localStorage !== 'undefined') {
            const storedAvatar = localStorage.getItem('userAvatar');
            if (storedAvatar) {
              userData.avatar = storedAvatar;
            }
          }
          
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: { 
              user: userData, 
              authType: authType as 'user' | 'employee' || 'user'
            }
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.AUTH_FAILURE,
            payload: 'Not authenticated'
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({
          type: AUTH_ACTIONS.AUTH_FAILURE,
          payload: 'Failed to check authentication'
        });
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 