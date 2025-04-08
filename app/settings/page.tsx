"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { ACTIONS } from '@/lib/DashboardProvider';
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
  const { state, dispatch } = useDashboard();
  const { currentUser } = state;
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: '',
    avatar: '',
  });
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Appearance settings state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    mentionAlerts: true,
    taskReminders: true
  });
  
  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Error state
  const [error, setError] = useState('');
  
  // Fetch current user data when component loads
  useEffect(() => {
    // Skip if we're in an iframe to prevent double loading
    if (typeof window !== 'undefined' && window.top !== window.self) {
      console.log('Settings page: Skipping load in iframe/embedded context');
      return;
    }
    
    // Prevent multiple rapid calls
    const lastFetchTime = localStorage.getItem('settings_last_fetch');
    const now = Date.now();
    
    if (lastFetchTime && now - parseInt(lastFetchTime) < 2000) {
      console.log('Settings page: Skipping fetch - too soon since last attempt');
      // Use existing data if we have it
      if (currentUser) {
        setProfileForm({
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || 'employee',
          avatar: currentUser.avatar || '',
        });
        setIsLoading(false);
      }
      return;
    }
    
    // Update last fetch timestamp
    localStorage.setItem('settings_last_fetch', now.toString());
    
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      setError('');
      
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
        
        let userData = null;
        
        // If we already have currentUser data in the dashboard state, use that to avoid a reload loop
        if (currentUser && currentUser.id) {
          console.log('Settings page: Using existing currentUser data');
          userData = currentUser;
        } 
        // Otherwise try authentication methods
        else {
          // Try standard User authentication first (more likely to work based on your logs)
          if (hasUserCookie || effectiveAuthType === 'user') {
            console.log('Settings page: Trying standard user auth first...');
            try {
              userData = await API.auth.getCurrentUser();
              
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
            console.log('Settings page: Trying employee auth...');
            
            try {
              const employeeResponse = await fetch('/api/auth/employee', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
              });
              
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
        
        if (userData) {
          console.log('Settings page: Retrieved user/employee data:', userData);
          
          // Only update Redux state if the user data has actually changed
          if (!currentUser || currentUser.id !== userData.id) {
            dispatch({
              type: ACTIONS.SET_CURRENT_USER,
              payload: userData
            });
          }
          
          // Update form with user data
          setProfileForm({
            name: userData.name,
            email: userData.email,
            role: userData.role || 'employee', // Default to 'employee' if no role provided
            avatar: userData.avatar || '',
          });
        } else {
          console.log('Settings page: No user/employee data returned from API');
          setError('Could not retrieve user data. Please try again.');
        }
      } catch (error) {
        console.error('Settings page: Error fetching user data:', error);
        setError('Error loading profile. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, [dispatch]); // Remove currentUser from dependencies
  
  // Update form if currentUser changes
  useEffect(() => {
    if (currentUser && !isLoading) {
      // Only update form if necessary to prevent infinite updates
      if (
        profileForm.name !== currentUser.name ||
        profileForm.email !== currentUser.email ||
        profileForm.role !== currentUser.role
      ) {
        console.log('Settings page: Updating form with current user data:', currentUser);
        setProfileForm({
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || 'employee',
          avatar: currentUser.avatar || '',
        });
      }
    }
  }, [currentUser, isLoading, profileForm.name, profileForm.email, profileForm.role]);
  
  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (currentUser) {
      try {
        // Show loading state
        setIsLoading(true);
        
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
        
        if (authType === 'employee') {
          console.log('Settings page: Using Employee API for profile update');
          
          // Use Employee API endpoint directly
          const response = await fetch('/api/employees/' + currentUser.id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: profileUpdate.name,
              email: profileUpdate.email,
              avatar: profileUpdate.avatar,
              // Keep other fields unchanged
              position: (currentUser as ExtendedUser).position,
              department: (currentUser as ExtendedUser).departmentId || (currentUser as ExtendedUser).department?.id,
              address: (currentUser as ExtendedUser).address,
              phoneNumber: (currentUser as ExtendedUser).phoneNumber,
              hireDate: (currentUser as ExtendedUser).hireDate,
              birthday: (currentUser as ExtendedUser).birthday,
              salary: (currentUser as ExtendedUser).salary,
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update employee profile');
          }
          
          updatedUser = await response.json();
        } else {
          // Default to standard User API
          console.log('Settings page: Using standard User API for profile update');
          updatedUser = await API.auth.updateProfile(profileUpdate);
        }
        
        // Update the current user in state
        dispatch({
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
      } catch (error: any) {
        console.error('Settings page: Error updating profile:', error);
        
        // Provide more detailed error message
        let errorMessage = 'Failed to update profile. Please try again.';
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        // Check for specific error types
        if (error.name === 'SyntaxError') {
          errorMessage = 'Invalid response from server. The avatar may be too large.';
        } else if (error.message?.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. The avatar may be too large.';
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle appearance settings change
  const handleAppearanceChange = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (typeof window !== 'undefined') {
      if (newDarkMode) {
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
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    showSuccessNotification('Notification preferences updated');
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Helper to show success notification
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    
    const timer = setTimeout(() => {
      setShowSuccess(false);
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
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
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
        
        // Update profile form with resized image
        setProfileForm(prev => ({
          ...prev,
          avatar: dataUrl
        }));
        
        console.log('Image resized and compressed:', {
          originalSize: file.size,
          resizedSize: dataUrl.length * 0.75, // Approximate size in bytes
          dimensions: `${width}x${height}`
        });
      };
      
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
        
        {/* Success notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg animate-slide-in-right z-50">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
            <button 
              className="ml-4 text-green-700"
              onClick={() => setShowSuccess(false)}
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
                onClick={() => setError('')}
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