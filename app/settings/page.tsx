"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard, ACTIONS } from '@/lib/DashboardProvider';
import { useUser } from '@/lib/DashboardProvider';
import { updateUserAvatar } from '@/lib/DashboardProvider';
import { API } from '@/lib/api';
import { 
  User, 
  Save, 
  Moon, 
  Sun, 
  Bell, 
  BellOff, 
  Lock, 
  Globe, 
  Mail, 
  Loader2,
  Check,
  X,
  Upload
} from 'lucide-react';
import { generateAvatarUrl } from '@/lib/helpers';

// Extended user interface to handle both User and Employee properties
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  // Employee specific fields
  position?: string;
  departmentId?: string;
  department?: { id: string; name: string };
  address?: string;
  phoneNumber?: string;
  hireDate?: string;
  birthday?: string;
  salary?: number;
}

export default function SettingsPage() {
  const { state, dispatch: dashboardDispatch } = useDashboard();
  const { currentUser } = state;
  
  // Create a local reducer to manage component state
  const [localState, localDispatch] = React.useReducer((state, action: {
    type: string;
    payload?: any;
  }) => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      case 'SET_PROFILE_FORM':
        return { ...state, profileForm: action.payload };
      case 'UPDATE_PROFILE_FORM':
        return { 
          ...state, 
          profileForm: { ...state.profileForm, ...action.payload } 
        };
      case 'SET_SUCCESS_MESSAGE':
        return { 
          ...state, 
          showSuccess: true, 
          successMessage: action.payload 
        };
      case 'HIDE_SUCCESS':
        return { ...state, showSuccess: false };
      case 'TOGGLE_DARK_MODE':
        return { ...state, darkMode: !state.darkMode };
      case 'TOGGLE_NOTIFICATION': {
        // Use type assertion to ensure type safety
        const setting = action.payload as keyof typeof state.notificationSettings;
        return { 
          ...state, 
          notificationSettings: {
            ...state.notificationSettings,
            [setting]: !state.notificationSettings[setting]
          }
        };
      }
      default:
        return state;
    }
  }, {
    isLoading: true,
    error: '',
    profileForm: {
      name: '',
      email: '',
      role: '',
      avatar: '',
    },
    darkMode: typeof window !== 'undefined' ? 
      document.documentElement.classList.contains('dark') : false,
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      mentionAlerts: true,
      taskReminders: true,
    },
    showSuccess: false,
    successMessage: '',
  });
  
  // Extract state variables for easier access
  const { 
    isLoading, 
    error, 
    profileForm, 
    darkMode, 
    notificationSettings,
    showSuccess,
    successMessage
  } = localState;
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref to track initialization
  const initialized = useRef(false);
  const profileFormSignature = useRef('');
  
  // Add a ref to track if we've already initialized the form
  const initializedRef = useRef(false);
  
  // Function to refresh authentication sessions
  const refreshAuthSession = async () => {
    try {
      // Determine auth type more comprehensively
      let authType = 'user';
      
      // Check localStorage first
      if (typeof localStorage !== 'undefined') {
        const storedAuthType = localStorage.getItem('authType');
        if (storedAuthType) {
          authType = storedAuthType;
        }
      }
      
      // Then check cookies as a fallback
      if (typeof document !== 'undefined') {
        const hasEmployeeSession = document.cookie.split(';').some(c => 
          c.trim().startsWith('employee-session='));
        
        const hasUserSession = document.cookie.split(';').some(c => 
          c.trim().startsWith('session-token=') || c.trim().startsWith('session_token='));
        
        // Cookie detection overrides localStorage if present
        if (hasEmployeeSession) {
          authType = 'employee';
          localStorage.setItem('authType', 'employee');
        } else if (hasUserSession) {
          authType = 'user';
          localStorage.setItem('authType', 'user');
        }
      }
      
      console.log('Settings page: Refreshing session for auth type:', authType);
      
      if (authType === 'employee') {
        // Refresh employee session with direct fetch to ensure cookies are updated
        const response = await fetch('/api/auth/employee', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });
        
        if (response.ok) {
          console.log('Settings page: Employee session refreshed successfully');
          
          // Also explicitly refresh cookies
          await fetch('/api/auth/set-cookies?type=employee', {
            credentials: 'include'
          });
          
          return true;
        } else {
          console.log('Settings page: Employee session refresh failed, trying recovery...');
          
          // Try recovery as a last resort
          const recoveryResponse = await fetch('/api/auth/set-cookies?type=employee&action=recover', {
            credentials: 'include'
          });
          
          if (recoveryResponse.ok) {
            console.log('Settings page: Employee session recovery attempted');
            
            // Try one more time to verify authentication
            const verifyResponse = await fetch('/api/auth/check', {
              credentials: 'include'
            });
            
            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              if (data.status === 'authenticated') {
                console.log('Settings page: Employee session successfully recovered');
                return true;
              }
            }
          }
          
          console.warn('Settings page: Employee session recovery failed');
          return false;
        }
      } else {
        // Standard user auth refresh
        try {
          // Try direct API call first
          const user = await API.auth.getCurrentUser();
          
          if (user) {
            console.log('Settings page: User session refreshed successfully via API');
            
            // Also explicitly refresh cookies
            await fetch('/api/auth/set-cookies?type=user', {
              credentials: 'include'
            });
            
            return true;
          }
          
          // If that fails, try recovery
          console.log('Settings page: User session refresh failed, trying recovery...');
          
          const recoveryResponse = await fetch('/api/auth/set-cookies?type=user&action=recover', {
            credentials: 'include'
          });
          
          if (recoveryResponse.ok) {
            // Try direct verification
            const verifyResponse = await fetch('/api/auth/check', {
              credentials: 'include'
            });
            
            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              if (data.status === 'authenticated') {
                console.log('Settings page: User session successfully recovered');
                return true;
              }
            }
          }
          
          console.warn('Settings page: User session recovery failed');
          return false;
        } catch (error) {
          console.error('Settings page: Error during user session refresh:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('Settings page: Error refreshing session:', error);
      return false;
    }
  };

  // Refresh session periodically to prevent expiration
  useEffect(() => {
    // Skip in iframe
    if (typeof window !== 'undefined' && window.top !== window.self) {
      return;
    }
    
    // Initial refresh
    refreshAuthSession();
    
    // Set up periodic refresh (every 3 minutes)
    const refreshInterval = setInterval(() => {
      console.log('Settings page: Performing periodic session refresh');
      refreshAuthSession();
    }, 3 * 60 * 1000); // 3 minutes
    
    return () => clearInterval(refreshInterval);
  }, []); // Empty dependency array since this should only run once on mount
  
  // Fetch current user data when component loads
  useEffect(() => {
    // Skip if we're in an iframe to prevent double loading
    if (typeof window !== 'undefined' && window.top !== window.self) {
      console.log('Settings page: Skipping load in iframe/embedded context');
      return;
    }
    
    // Use a flag to ensure we only fetch once per component mount
    const isMounted = { current: true };
    
    const fetchCurrentUser = async () => {
      // Don't proceed if component unmounted during async operation
      if (!isMounted.current) return;
      
      // If we already have user data and an ID, don't fetch again
      if (currentUser?.id && !isLoading) {
        console.log('Settings page: Using existing currentUser data:', currentUser.name);
        
        // Only update form if not already initialized to prevent infinite loops
        if (!initializedRef.current) {
          console.log('Settings page: Initializing form with currentUser data');
          localDispatch({
            type: 'SET_PROFILE_FORM',
            payload: {
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role || 'employee',
              avatar: currentUser.avatar || '',
            }
          });
          
          initializedRef.current = true;
        }
        
        localDispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      localDispatch({ type: 'SET_LOADING', payload: true });
      localDispatch({ type: 'SET_ERROR', payload: '' });
      
      try {
        // Check which authentication cookie exists
        const hasUserCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('session-token=') || c.trim().startsWith('session_token='));
        
        const hasEmployeeCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('employee-session='));
        
        // Also check for auth_type cookie
        const authTypeCookie = document.cookie.split(';').find(c => c.trim().startsWith('auth_type='));
        const authTypeFromCookie = authTypeCookie ? authTypeCookie.split('=')[1] : null;
        
        // Check localStorage too
        const authTypeFromStorage = localStorage.getItem('authType');
        
        // Determine auth type
        const effectiveAuthType = authTypeFromCookie || authTypeFromStorage || 
          (hasEmployeeCookie ? 'employee' : hasUserCookie ? 'user' : null);
        
        console.log('Settings page: Auth detection:', { 
          hasUserCookie, 
          hasEmployeeCookie,
          authTypeFromCookie,
          authTypeFromStorage, 
          effectiveAuthType,
          allCookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
        });
        
        // Bail if component unmounted during async operation
        if (!isMounted.current) return;
        
        let userData = null;
        
        // Try the more reliable auth/check endpoint first
        console.log('Settings page: Trying auth/check endpoint first...');
        try {
          const checkResponse = await fetch('/api/auth/check', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            }
          });
          
          // Bail if component unmounted during async operation
          if (!isMounted.current) return;
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            
            if (checkData.status === 'authenticated' && checkData.user) {
              userData = checkData.user;
              
              console.log('Settings page: Retrieved user data from auth/check:', 
                userData.type, userData.name);
              
              // Store auth type for future use
              localStorage.setItem('authType', userData.type);
            } else {
              console.log('Settings page: Auth check returned non-authenticated status:', 
                checkData.status);
            }
          } else {
            console.log('Settings page: Auth check failed with status:', checkResponse.status);
          }
        } catch (checkError) {
          console.error('Settings page: Error with auth/check endpoint:', checkError);
        }
        
        // If auth/check failed, fall back to specific auth method endpoints
        if (!userData) {
          // Try standard User authentication first (more likely to work based on your logs)
          if (hasUserCookie || effectiveAuthType === 'user') {
            console.log('Settings page: Trying standard user auth as fallback...');
            try {
              userData = await API.auth.getCurrentUser();
              
              // Bail if component unmounted during async operation
              if (!isMounted.current) return;
              
              if (userData) {
                console.log('Settings page: Retrieved user data from standard auth:', userData);
                localStorage.setItem('authType', 'user');
              }
            } catch (userAuthError) {
              console.error('Settings page: Error during user auth:', userAuthError);
            }
          }
          
          // If User login failed, try Employee login
          if (!userData && (hasEmployeeCookie || effectiveAuthType === 'employee')) {
            console.log('Settings page: Trying employee auth as fallback...');
            
            try {
              const employeeResponse = await fetch('/api/auth/employee', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });
              
              // Bail if component unmounted during async operation
              if (!isMounted.current) return;
              
              if (employeeResponse.ok) {
                userData = await employeeResponse.json();
                console.log('Settings page: Retrieved employee data:', userData);
                
                // Store auth type for future use
                localStorage.setItem('authType', 'employee');
              } else {
                console.log('Settings page: Employee auth failed with status:', employeeResponse.status);
              }
            } catch (employeeError) {
              console.error('Settings page: Error fetching employee data:', employeeError);
            }
          }
        }
        
        // If we still don't have user data, try refreshing the session and trying again
        if (!userData && isMounted.current) {
          console.log('Settings page: No user data found, trying session refresh...');
          await refreshAuthSession();
          
          // Only try one more time after refresh
          try {
            const refreshedCheckResponse = await fetch('/api/auth/check', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            });
            
            if (refreshedCheckResponse.ok && isMounted.current) {
              const checkData = await refreshedCheckResponse.json();
              
              if (checkData.status === 'authenticated' && checkData.user) {
                userData = checkData.user;
                console.log('Settings page: Retrieved user data after refresh:', userData);
                localStorage.setItem('authType', userData.type);
              }
            }
          } catch (finalCheckError) {
            console.error('Settings page: Final auth check failed:', finalCheckError);
          }
        }
        
        // Final check if component still mounted
        if (!isMounted.current) return;
        
        if (userData) {
          console.log('Settings page: Retrieved user/employee data:', userData);
          
          // Update Redux state
          dashboardDispatch({
            type: ACTIONS.SET_CURRENT_USER,
            payload: userData
          });
          
          // Update form with user data if not already initialized
          if (!initializedRef.current) {
            console.log('Settings page: Initializing form with API user data');
            localDispatch({
              type: 'SET_PROFILE_FORM',
              payload: {
                name: userData.name,
                email: userData.email,
                role: userData.role || 'employee',
                avatar: userData.avatar || '',
              }
            });
            initializedRef.current = true;
          }
        } else {
          console.log('Settings page: No user/employee data returned from API');
          localDispatch({ type: 'SET_ERROR', payload: 'Could not retrieve user data. Please try again.' });
        }
      } catch (error) {
        // Bail if component unmounted during async operation
        if (!isMounted.current) return;
        
        console.error('Settings page: Error fetching user data:', error);
        localDispatch({ type: 'SET_ERROR', payload: 'Error loading profile. Please check your connection and try again.' });
      } finally {
        // Only update loading state if component still mounted
        if (isMounted.current) {
          localDispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    
    // Kick off the fetch
    fetchCurrentUser();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array to ensure this only runs once on mount
  
  // Add cross-tab heartbeat mechanism to keep sessions alive across tabs
  useEffect(() => {
    if (typeof window === 'undefined' || window.top !== window.self) {
      return; // Skip in server-side rendering or iframes
    }
    
    // Store last heartbeat timestamp
    const lastHeartbeatRef = { current: Date.now().toString() };
    
    // Check last heartbeat time in localStorage
    const checkHeartbeat = () => {
      try {
        const lastHeartbeat = localStorage.getItem('session_last_heartbeat');
        const now = Date.now();
        
        if (!lastHeartbeat || now - parseInt(lastHeartbeat) > 60000) { // 1 minute
          // Time to refresh the session
          console.log('Settings page: Session heartbeat triggered');
          refreshAuthSession();
          localStorage.setItem('session_last_heartbeat', now.toString());
          lastHeartbeatRef.current = now.toString();
        }
      } catch (error) {
        console.error('Settings page: Error in heartbeat check:', error);
      }
    };
    
    // Set initial heartbeat only once
    if (!localStorage.getItem('session_last_heartbeat')) {
      localStorage.setItem('session_last_heartbeat', Date.now().toString());
    }
    
    // Check heartbeat every 30 seconds
    const heartbeatInterval = setInterval(checkHeartbeat, 30000);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session_last_heartbeat' && e.newValue !== lastHeartbeatRef.current) {
        console.log('Settings page: Detected heartbeat from another tab');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array
  
  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localDispatch({ type: 'SET_ERROR', payload: '' });
    
    if (currentUser) {
      try {
        // Show loading state
        localDispatch({ type: 'SET_LOADING', payload: true });
        
        console.log('Profile submit: Current avatar in form:', profileForm.avatar ? 
          (profileForm.avatar.substring(0, 30) + '... [' + Math.round(profileForm.avatar.length / 1024) + ' KB]') : 'None');
        
        // Double-check session validity before proceeding
        const sessionValid = await refreshAuthSession();
        if (!sessionValid) {
          console.warn('Settings page: Session validation failed before profile update');
          localDispatch({ type: 'SET_ERROR', payload: 'Your session may have expired. Attempting to restore it...' });
          
          // Try again more aggressively with a slight delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const secondAttempt = await refreshAuthSession();
          if (!secondAttempt) {
            throw new Error('Session expired and could not be restored');
          }
          
          console.log('Settings page: Session restored successfully');
        }
        
        // Create API-compatible object structure
        const profileUpdate: Record<string, string> = {
          name: profileForm.name,
          email: profileForm.email,
        };
        
        // Only add avatar if it exists and hasn't been cleared
        if (profileForm.avatar && 
            (profileForm.avatar.startsWith('data:') || 
             profileForm.avatar.startsWith('http'))) {
          profileUpdate.avatar = profileForm.avatar;
          console.log('Profile submit: Including avatar in update, type:', 
            profileForm.avatar.startsWith('data:') ? 'data:URL' : 'HTTP URL', 
            'length:', Math.round(profileForm.avatar.length / 1024), 'KB');
        } else {
          console.log('Profile submit: No avatar included in update');
        }
        
        // Log what we're sending
        console.log('Settings page: Submitting profile update:', {
          name: profileUpdate.name,
          email: profileUpdate.email,
          avatarExists: 'avatar' in profileUpdate,
          avatarType: profileUpdate.avatar ? (
            profileUpdate.avatar.startsWith('data:') ? 'data:URL' : 
            profileUpdate.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
          ) : 'None',
          avatarLength: profileUpdate.avatar ? profileUpdate.avatar.length : 0
        });
        
        // Check if avatar is data URL and potentially too large
        if (profileUpdate.avatar?.startsWith('data:image/') && profileUpdate.avatar.length > 500000) {
          console.log('Avatar data URL is large, compressing further...');
          
          // Further compress large data URLs
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = profileUpdate.avatar;
            });
            
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 200; // Even smaller for API compatibility
            let width = img.width;
            let height = img.height;
            
            // Maintain aspect ratio but with stricter size limit
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Use even lower quality for API transmission
            profileUpdate.avatar = canvas.toDataURL('image/jpeg', 0.6);
            
            console.log('Avatar compressed for API:', {
              originalLength: profileForm.avatar.length,
              compressedLength: profileUpdate.avatar.length,
              reduction: `${((1 - profileUpdate.avatar.length / profileForm.avatar.length) * 100).toFixed(1)}%`
            });
          } catch (err) {
            console.error('Error compressing avatar:', err);
            // Continue with original avatar if compression fails
          }
        }
        
        // Determine which authentication method to use based on the auth type
        let updatedUser;
        const authType = localStorage.getItem('authType');
        
        // Pre-emptively refresh the session before attempting the update
        await refreshAuthSession();
        
        if (authType === 'employee') {
          console.log('Settings page: Using Employee API for profile update');
          
          // Log the data being sent to employee API
          console.log('Employee API request:', {
            name: profileUpdate.name,
            email: profileUpdate.email,
            hasAvatar: !!profileUpdate.avatar,
            avatarPreview: profileUpdate.avatar ? profileUpdate.avatar.substring(0, 30) + '...' : 'None'
          });
          
          // Make sure to include the avatar in the request to avoid it being cleared
          const employeeData = {
            name: profileUpdate.name,
            email: profileUpdate.email,
            // Explicitly include avatar, even if undefined - API handles this properly now
            avatar: profileUpdate.avatar || currentUser.avatar,
            // Keep other fields unchanged
            position: (currentUser as ExtendedUser).position,
            department: (currentUser as ExtendedUser).departmentId || (currentUser as ExtendedUser).department?.id,
            address: (currentUser as ExtendedUser).address,
            phoneNumber: (currentUser as ExtendedUser).phoneNumber,
            hireDate: (currentUser as ExtendedUser).hireDate,
            birthday: (currentUser as ExtendedUser).birthday,
            salary: (currentUser as ExtendedUser).salary,
          };
          
          // Use Employee API endpoint directly
          const response = await fetch('/api/employees/' + currentUser.id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Employee API error:', errorData);
            throw new Error(errorData.error || 'Failed to update employee profile');
          }
          
          updatedUser = await response.json();
          console.log('Employee API response:', {
            id: updatedUser.id,
            name: updatedUser.name,
            hasAvatar: !!updatedUser.avatar,
            avatarPreview: updatedUser.avatar ? updatedUser.avatar.substring(0, 30) + '...' : 'None'
          });
        } else {
          // Default to standard User API
          console.log('Settings page: Using standard User API for profile update');
          console.log('User API request:', {
            name: profileUpdate.name,
            email: profileUpdate.email,
            hasAvatar: !!profileUpdate.avatar,
            avatarPreview: profileUpdate.avatar ? profileUpdate.avatar.substring(0, 30) + '...' : 'None'
          });
          
          // For user accounts, we need to make sure avatar is included (even if null)
          const userData = {
            ...profileUpdate,
            // Only explicitly set avatar to null if avatar has been removed
            avatar: 'avatar' in profileUpdate ? profileUpdate.avatar : currentUser.avatar
          };
          
          updatedUser = await API.auth.updateProfile(userData);
          console.log('User API response:', {
            id: updatedUser.id,
            name: updatedUser.name,
            hasAvatar: !!updatedUser.avatar,
            avatarPreview: updatedUser.avatar ? updatedUser.avatar.substring(0, 30) + '...' : 'None'
          });
        }
        
        // Refresh the session again after the update to ensure we maintain authentication
        await refreshAuthSession();
        
        // Store the avatar in localStorage as backup to ensure it persists
        if (updatedUser.avatar) {
          try {
            localStorage.setItem('userAvatar', updatedUser.avatar);
            console.log('Settings page: Stored avatar in localStorage for backup');
            
            // Also update last avatar timestamp to force UI refresh
            localStorage.setItem('lastAvatarUpdate', Date.now().toString());
          } catch (storageError) {
            console.error('Settings page: Failed to store avatar in localStorage (may be too large):', storageError);
            
            // If the avatar is too big for localStorage, store a flag indicating we have an avatar
            localStorage.setItem('hasUserAvatar', 'true');
          }
        } else {
          localStorage.removeItem('userAvatar');
          localStorage.removeItem('hasUserAvatar');
        }
        
        // Update the current user in state
        dashboardDispatch({
          type: ACTIONS.SET_CURRENT_USER,
          payload: updatedUser
        });
        
        console.log('Settings page: Profile updated successfully:', {
          name: updatedUser.name,
          avatarExists: !!updatedUser.avatar,
          avatarType: updatedUser.avatar ? (
            updatedUser.avatar.startsWith('data:') ? 'data:URL' : 
            updatedUser.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
          ) : 'None',
          avatarLength: updatedUser.avatar ? updatedUser.avatar.length : 0
        });
        
        // Show success message
        showSuccessNotification('Profile updated successfully');
        
        // Force a re-render of components that use the avatar
        window.dispatchEvent(new Event('avatarUpdated'));
        
        // Reset loading state
        localDispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error updating profile:', error);
        localDispatch({ type: 'SET_ERROR', payload: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error') });
        localDispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };
  
  // Handle appearance settings change
  const handleAppearanceChange = () => {
    localDispatch({ type: 'TOGGLE_DARK_MODE' });
    
    if (typeof window !== 'undefined') {
      if (!darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      
      showSuccessNotification('Appearance settings updated');
    }
  };
  
  // Handle notification settings change
  const handleNotificationSettingChange = (setting: keyof typeof notificationSettings) => {
    localDispatch({ type: 'TOGGLE_NOTIFICATION', payload: setting });
    
    showSuccessNotification('Notification preferences updated');
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    localDispatch({ 
      type: 'UPDATE_PROFILE_FORM', 
      payload: { [name]: value }
    });
  };
  
  // Helper to show success notification
  const showSuccessNotification = (message: string) => {
    localDispatch({ type: 'SET_SUCCESS_MESSAGE', payload: message });
    
    const timer = setTimeout(() => {
      localDispatch({ type: 'HIDE_SUCCESS' });
    }, 3000);
    
    return () => clearTimeout(timer);
  };

  // Handle avatar selection - now just a simple handler for file input click
  const handleAvatarUpload = () => {
    // Directly trigger file input click instead of showing a modal with options
    fileInputRef.current?.click();
  };
  
  // Handle file selection for avatar upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      localDispatch({ type: 'SET_ERROR', payload: 'Please select an image file (JPEG, PNG, etc.)' });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      localDispatch({ type: 'SET_ERROR', payload: 'Image size should be less than 5MB' });
      return;
    }
    
    console.log('Avatar upload: Processing file:', file.name, file.type, Math.round(file.size / 1024), 'KB');
    
    // First create a temporary preview for immediate feedback
    const tempPreview = URL.createObjectURL(file);
    // Show a temporary preview while processing
    localDispatch({
      type: 'UPDATE_PROFILE_FORM',
      payload: { avatar: tempPreview }
    });
    
    // Resize and compress the image
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions (max 256x256)
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;
        
        // Maintain aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        // Set canvas dimensions and draw the resized image
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL with reduced quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up the temporary preview
        URL.revokeObjectURL(tempPreview);
        
        // Process the image and update state
        try {
          console.log('Avatar upload: Image resized and compressed:', {
            originalSize: file.size,
            resizedSize: Math.round(dataUrl.length * 0.75 / 1024), // Approximate size in KB
            dimensions: `${Math.round(width)}x${Math.round(height)}`,
            dataUrlPreview: dataUrl.substring(0, 50) + '...' // Show beginning of data URL
          });
          
          // Update profile form with resized image
          localDispatch({
            type: 'UPDATE_PROFILE_FORM',
            payload: { avatar: dataUrl }
          });
          
          // Use the dedicated avatar update function that properly manages state
          updateUserAvatar(dataUrl);
          
          // Show success message
          showSuccessNotification('Profile picture updated successfully');
          
        } catch (e) {
          console.error('Avatar processing error', e);
          localDispatch({ type: 'SET_ERROR', payload: 'Failed to process avatar image. Please try again.' });
        }
      };
      
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset the file input so the same file can be selected again if needed
    e.target.value = '';
  };

  // In the SettingsPage component, add a useEffect to listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      try {
        // Extract avatar data from CustomEvent if available
        let avatarData: string | null = null;
        
        if (event instanceof CustomEvent && event.detail && event.detail.avatar) {
          console.log('Settings page: Received avatar data from CustomEvent');
          avatarData = event.detail.avatar;
        }
        
        // If avatar data wasn't in the event, try to get it from localStorage
        if (!avatarData) {
          avatarData = localStorage.getItem('userAvatar') || 
                    localStorage.getItem('tempAvatarPreview');
        }
        
        if (avatarData && avatarData !== profileForm.avatar) {
          console.log('Settings page: Updating avatar in profile form');
          
          // Update the profile form with the new avatar
          localDispatch({
            type: 'UPDATE_PROFILE_FORM',
            payload: { avatar: avatarData }
          });
        }
      } catch (error) {
        console.error('Settings page: Error handling avatar update:', error);
      }
    };
    
    // Listen for avatar update events
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
    };
  }, [profileForm.avatar]);

  // Add this useEffect to watch for changes in the currentUser's avatar
  // and update the profile form accordingly
  useEffect(() => {
    if (currentUser?.avatar && profileForm.avatar !== currentUser.avatar) {
      console.log('Settings page: Updating profile form with new avatar from currentUser');
      localDispatch({
        type: 'UPDATE_PROFILE_FORM',
        payload: { avatar: currentUser.avatar }
      });
    }
  }, [currentUser?.avatar, profileForm.avatar]);

  return (
    <Layout key="settings-page">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
        
        {/* Success notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg animate-slide-in-right z-50">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
            <button 
              className="ml-4 text-green-700"
              onClick={() => localDispatch({ type: 'HIDE_SUCCESS' })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Hidden file input for avatar upload */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        
        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400">
            <X className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="py-1 px-3 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-700/30 rounded text-xs"
              >
                Refresh Page
              </button>
              <button
                className="text-red-600 dark:text-red-400"
                onClick={() => localDispatch({ type: 'SET_ERROR', payload: '' })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your profile settings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar with nav */}
            <div className="col-span-1">
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark">
                <nav className="space-y-1 p-3">
                  <a href="#profile" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    <User className="mr-3 h-5 w-5" />
                    <span>Profile Settings</span>
                  </a>
                  <a href="#appearance" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-300">
                    <Moon className="mr-3 h-5 w-5" />
                    <span>Appearance</span>
                  </a>
                  <a href="#notifications" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-300">
                    <Bell className="mr-3 h-5 w-5" />
                    <span>Notifications</span>
                  </a>
                </nav>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              {/* Profile settings */}
              <section id="profile" className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark p-6 animate-slide-in">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Settings</h2>
                
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        {profileForm.avatar && (profileForm.avatar.startsWith('http') || profileForm.avatar.startsWith('data:')) ? (
                          <img 
                            src={profileForm.avatar} 
                            alt={profileForm.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          /* Display exactly two letters from name */
                          <div className="flex items-center justify-center h-full w-full bg-blue-500 text-white text-xl font-medium">
                            {(() => {
                              const nameParts = profileForm.name.split(' ');
                              let initials = '';
                              
                              if (nameParts.length >= 2) {
                                // First letter of first and last name
                                initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
                              } else if (profileForm.name.length >= 2) {
                                // First two letters of name
                                initials = profileForm.name.substring(0, 2);
                              } else if (profileForm.name.length === 1) {
                                // Single letter plus "U"
                                initials = profileForm.name.charAt(0) + 'U';
                              } else {
                                // Default
                                initials = 'US';
                              }
                              
                              return initials.toUpperCase();
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Profile Picture</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Your avatar shows your two-letter initials or a custom image.
                        </p>
                        <button
                          type="button"
                          onClick={handleAvatarUpload}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center w-fit"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Image
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profileForm.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          name="role"
                          value={profileForm.role}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </button>
                    </div>
                  </div>
                </form>
              </section>
              
              {/* Appearance Settings */}
              <section id="appearance" className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark p-6 animate-slide-in">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      ) : (
                        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {darkMode ? 'Dark Mode' : 'Light Mode'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {darkMode 
                            ? 'Switch to light mode for a brighter appearance' 
                            : 'Switch to dark mode to reduce eye strain in low-light environments'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAppearanceChange}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${darkMode ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              </section>
              
              {/* Notification Settings */}
              <section id="notifications" className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark p-6 animate-slide-in">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleNotificationSettingChange('emailNotifications')}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Push Notifications
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleNotificationSettingChange('pushNotifications')}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Weekly Digest
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleNotificationSettingChange('weeklyDigest')}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${notificationSettings.weeklyDigest ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${notificationSettings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mention Alerts
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleNotificationSettingChange('mentionAlerts')}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${notificationSettings.mentionAlerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${notificationSettings.mentionAlerts ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-3" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Task Reminders
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleNotificationSettingChange('taskReminders')}
                      className={`
                        relative inline-flex items-center h-6 rounded-full w-11 
                        ${notificationSettings.taskReminders ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        transition-colors ease-in-out duration-200
                      `}
                    >
                      <span
                        className={`
                          inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200
                          ${notificationSettings.taskReminders ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}