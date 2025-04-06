"use client";

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { generateAvatarUrl } from '@/lib/helpers';

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
  });
  
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
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const userData = await API.auth.getCurrentUser();
        if (userData) {
          console.log('Settings page: Retrieved user data from API:', userData);
          dispatch({
            type: ACTIONS.SET_CURRENT_USER,
            payload: userData
          });
          
          // Update form with fresh user data
          setProfileForm({
            name: userData.name,
            email: userData.email,
            role: userData.role,
          });
        } else {
          console.log('Settings page: No user data returned from API');
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
  }, [dispatch]);
  
  // Update form if currentUser changes
  useEffect(() => {
    if (currentUser && !isLoading) {
      console.log('Settings page: Updating form with current user data:', currentUser);
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      });
    }
  }, [currentUser, isLoading]);
  
  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (currentUser) {
      try {
        // Show loading state
        setIsLoading(true);
        
        // Make a copy of the profile form to send to API
        const profileUpdate = {
          name: profileForm.name,
          email: profileForm.email,
        };
        
        console.log('Settings page: Submitting profile update:', profileUpdate);
        
        // Call the API to update the profile
        const updatedUser = await API.auth.updateProfile(profileUpdate);
        
        // Update the current user in state
        dispatch({
          type: ACTIONS.SET_CURRENT_USER,
          payload: updatedUser
        });
        
        console.log('Settings page: Profile updated successfully:', updatedUser);
        
        // Show success message
        showSuccessNotification('Profile updated successfully');
      } catch (error: any) {
        console.error('Settings page: Error updating profile:', error);
        setError(error.message || 'Failed to update profile. Please try again.');
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
        
        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400">
            <X className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              className="ml-auto text-red-600 dark:text-red-400"
              onClick={() => setError('')}
            >
              <X className="h-4 w-4" />
            </button>
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
                      <div className="w-16 h-16 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white text-xl font-medium">
                        {profileForm.name
                          ? profileForm.name
                              .split(' ')
                              .map(part => part.charAt(0))
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Profile Picture</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Your avatar is automatically generated based on your name.
                        </p>
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