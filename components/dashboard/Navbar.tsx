"use client";

import { Bell, Search, Calendar, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDashboard, ACTIONS } from '@/lib/DashboardProvider';
import { useTheme } from '@/lib/ThemeProvider';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';

export default function Navbar() {
  const { state, dispatch } = useDashboard();
  const { currentUser, notifications } = state;
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Add state to track avatar refresh attempts
  const [avatarRefreshAttempt, setAvatarRefreshAttempt] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('Current user in Navbar:', currentUser);
    if (currentUser?.avatar) {
      console.log('Avatar type:', 
        currentUser.avatar.startsWith('data:') ? 'data:URL' : 
        currentUser.avatar.startsWith('http') ? 'HTTP URL' : 'Other',
        'Length:', currentUser.avatar.length
      );
    } else {
      console.log('No avatar found in currentUser');
    }
  }, [currentUser]);
  
  // Add effect to fetch the latest user profile data including avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Only fetch if we have a currentUser but need to refresh their data
        if (currentUser && currentUser.id) {
          console.log('Fetching latest user profile data for Navbar avatar refresh');
          
          // Get auth type from localStorage
          const authType = localStorage.getItem('authType') || 'user';
          
          let profile;
          if (authType === 'employee') {
            // For employee type users
            console.log('Navbar: Fetching employee profile data');
            try {
              const response = await fetch(`/api/employees/${currentUser.id}`, {
                credentials: 'include',
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache',
                },
              });
              
              if (response.ok) {
                profile = await response.json();
                console.log('Navbar: Got employee data from API:', profile ? {
                  name: profile.name,
                  id: profile.id,
                  hasAvatar: !!profile.avatar,
                  avatarType: profile.avatar ? (
                    profile.avatar.startsWith('data:') ? 'data:URL' : 
                    profile.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
                  ) : 'None',
                  avatarPreview: profile.avatar ? profile.avatar.substring(0, 50) + '...' : 'None'
                } : 'No profile data');
              } else {
                console.log('Navbar: Failed to fetch employee data, status:', response.status);
                setAvatarError(`Employee fetch failed: ${response.status}`);
              }
            } catch (error) {
              console.error('Navbar: Error fetching employee profile:', error);
              setAvatarError('Employee API error');
            }
          } else {
            // For regular user type
            console.log('Navbar: Fetching user profile data');
            try {
              profile = await API.auth.getProfile();
              console.log('Navbar: Got user data from API:', profile ? {
                name: profile.name,
                id: profile.id,
                hasAvatar: !!profile.avatar,
                avatarType: profile.avatar ? (
                  profile.avatar.startsWith('data:') ? 'data:URL' : 
                  profile.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
                ) : 'None',
                avatarPreview: profile.avatar ? profile.avatar.substring(0, 50) + '...' : 'None'
              } : 'No profile data');
            } catch (error) {
              console.error('Navbar: Error fetching user profile:', error);
              setAvatarError('User API error');
            }
          }
          
          // If we got updated profile data, update the current user in the dashboard state
          if (profile) {
            // Try to restore avatar from localStorage if missing in the API response
            if (!profile.avatar) {
              const storedAvatar = localStorage.getItem('userAvatar');
              if (storedAvatar) {
                console.log('Navbar: Restoring avatar from localStorage');
                profile.avatar = storedAvatar;
              }
            }
            
            // Validate avatar before updating state
            if (profile.avatar) {
              // Check if it's a valid image format
              const isValidAvatar = 
                profile.avatar.startsWith('data:image/') || 
                profile.avatar.startsWith('http') ||
                profile.avatar.startsWith('/');
                
              if (!isValidAvatar) {
                console.log('Navbar: Received invalid avatar format, removing it:', 
                  profile.avatar.substring(0, 20) + '...');
                profile.avatar = '';
              }
            }
            
            dispatch({
              type: ACTIONS.SET_CURRENT_USER,
              payload: profile
            });
            
            // Clear any previous avatar error
            setAvatarError(null);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile for avatar:', error);
        setAvatarError('Profile fetch error');
      }
    };
    
    fetchUserProfile();
    
    // Add listener for avatar updates from other components
    const handleAvatarUpdate = () => {
      console.log('Navbar: Detected avatar update event, refreshing profile');
      setAvatarRefreshAttempt(prev => prev + 1);
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [currentUser?.id, dispatch, avatarRefreshAttempt]);
  
  // Safely try to use ThemeProvider
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    // Fallback to local state if ThemeProvider is not available
    themeContext = {
      theme: isDarkMode ? 'dark' : 'light',
      toggleTheme: () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(newMode ? 'dark' : 'light');
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
        }
      }
    };
  }
  
  const { theme, toggleTheme } = themeContext;
  
  // Handle mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Initialize dark mode from localStorage if ThemeProvider failed
    if (typeof window !== 'undefined' && !themeContext) {
      const savedTheme = localStorage.getItem('theme');
      const initialDarkMode = savedTheme === 'dark';
      setIsDarkMode(initialDarkMode);
    }
    
    // Check if we previously had an avatar loading failure
    if (typeof localStorage !== 'undefined') {
      const avatarFailed = localStorage.getItem('avatarFailedToLoad');
      if (avatarFailed === 'true') {
        console.log('Navbar: Previously failed to load avatar, scheduling a refresh');
        // Clear the flag
        localStorage.removeItem('avatarFailedToLoad');
        // Schedule a refresh after a short delay
        setTimeout(() => {
          setAvatarRefreshAttempt(prev => prev + 1);
        }, 2000);
      }
    }
    
    // Check for auth_type cookie on component mount
    // This helps with determining which authentication method was used
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const authTypeCookie = cookies.find(c => c.trim().startsWith('auth_type='));
      
      if (authTypeCookie) {
        const authType = authTypeCookie.split('=')[1];
        console.log('Navbar: Detected auth_type cookie:', authType);
        localStorage.setItem('authType', authType);
      } else {
        // Try to detect by session cookie presence
        const hasEmployeeSession = cookies.some(c => c.trim().startsWith('employee-session='));
        const hasUserSession = cookies.some(c => c.trim().startsWith('session-token=') || c.trim().startsWith('session_token='));
        
        if (hasEmployeeSession) {
          console.log('Navbar: Detected employee session, setting authType');
          localStorage.setItem('authType', 'employee');
        } else if (hasUserSession) {
          console.log('Navbar: Detected user session, setting authType');
          localStorage.setItem('authType', 'user');
        }
      }
    }
  }, []);
  
  // Make sure we have a theme value
  const effectiveTheme = mounted ? theme : 'light';
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Simple direct logout function
  const handleLogout = async () => {
    // Show loading state
    setIsLoggingOut(true);
    
    try {
      // Use the API to properly logout - this will handle the server-side session deletion
      console.log('Logging out via API...');
      
      // Try both User and Employee logout endpoints
      try {
        await API.auth.logout();
        console.log('User logout successful');
      } catch (userLogoutError) {
        console.log('User logout failed:', userLogoutError);
      }
      
      // Try Employee logout endpoint
      try {
        const response = await fetch('/api/auth/employee', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('Employee logout successful');
        } else {
          console.log('Employee logout failed with status:', response.status);
        }
      } catch (employeeLogoutError) {
        console.log('Employee logout failed:', employeeLogoutError);
      }
      
      // Additionally clear cookies on the client side
      console.log('Clearing cookies...');
      // Handle both cookie formats (with hyphen and underscore)
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Clear any local storage items
      localStorage.removeItem('justLoggedIn');
      
      console.log('Redirecting to login page...');
      // Force a complete page refresh when redirecting
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If API call fails, still attempt to clear cookies and redirect
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.replace('/login');
    }
  };

  // User avatar renderer function
  const renderUserAvatar = () => {
    if (!currentUser) return null;

    // Create fallback avatar with initials
    const renderInitials = () => (
      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
        {currentUser.name
          .split(' ')
          .map(part => part.charAt(0))
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </div>
    );
    
    // Check if avatar is valid before trying to render it
    const isValidAvatar = currentUser.avatar && 
      (currentUser.avatar.startsWith('data:image/') || 
       currentUser.avatar.startsWith('http') ||
       currentUser.avatar.startsWith('/'));
    
    // If we don't have a valid avatar, just render the initials
    if (!isValidAvatar) {
      return renderInitials();
    }
    
    // If we have a valid avatar, render it with a fallback
    return (
      <div className="relative h-8 w-8">
        <img
          className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          src={currentUser.avatar}
          alt={currentUser.name}
          onError={(e) => {
            // If image fails to load, show initials instead and log debug info
            console.error('Avatar image failed to load:', {
              src: currentUser.avatar ? currentUser.avatar.substring(0, 50) + '...' : 'undefined',
              type: currentUser.avatar ? (
                currentUser.avatar.startsWith('data:') ? 'data:URL' : 
                currentUser.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
              ) : 'undefined',
              length: currentUser.avatar ? currentUser.avatar.length : 0
            });
            
            // Set a flag that the avatar failed to load
            localStorage.setItem('avatarFailedToLoad', 'true');
            
            // Hide the broken image
            e.currentTarget.style.display = 'none';
            
            // Show the fallback avatar (initials)
            const fallback = document.getElementById('avatar-fallback');
            if (fallback) fallback.classList.remove('hidden');
            
            // Try refreshing the profile after a short delay (only once)
            if (avatarRefreshAttempt === 0) {
              setTimeout(() => {
                setAvatarRefreshAttempt(1);
              }, 2000);
            }
          }}
        />
        <div 
          id="avatar-fallback"
          className="hidden absolute inset-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
        >
          {currentUser.name
            .split(' ')
            .map(part => part.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        
        {/* Display avatar error if any, shown only in development */}
        {process.env.NODE_ENV === 'development' && avatarError && (
          <div className="absolute top-full mt-1 right-0 text-xs bg-red-100 text-red-600 p-1 rounded whitespace-nowrap">
            Avatar error: {avatarError}
          </div>
        )}
      </div>
    );
  };

  // Inside the user menu dropdown, add a role update option if current user has Admin capability
  const userMenuItems = currentUser ? (
    <div className="py-1">
      <a
        href="/profile"
        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Your Profile
      </a>
      <a
        href="/settings"
        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Settings
      </a>
      
      {/* Add admin options if user is Admin */}
      {currentUser.role === 'Admin' && (
        <>
          <hr className="my-1 border-gray-200 dark:border-gray-600" />
          <div className="block px-4 py-1 text-xs text-gray-500 dark:text-gray-400">
            Admin Actions
          </div>
          
          <button
            onClick={async () => {
              try {
                // Find the user "Almanaei" in employees
                const almanaeiUser = await API.auth.getCurrentUser();
                
                // Only update if we found the user and they're not already Admin
                if (almanaeiUser && almanaeiUser.role !== 'Admin') {
                  console.log('Updating Almanaei role to Admin');
                  const updatedUser = await API.auth.updateUser(almanaeiUser.id, 'Admin');
                  
                  if (updatedUser) {
                    // Update the current user in the dashboard state
                    dispatch({
                      type: ACTIONS.SET_CURRENT_USER,
                      payload: updatedUser
                    });
                    
                    // Show success notification
                    alert('Role updated to Admin successfully!');
                  }
                } else {
                  alert(almanaeiUser?.role === 'Admin' 
                    ? 'User already has Admin role!' 
                    : 'User not found!');
                }
              } catch (error) {
                console.error('Error updating role:', error);
                alert('Failed to update role. See console for details.');
              }
            }}
            className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Make Admin
          </button>
        </>
      )}
      
      <hr className="my-1 border-gray-200 dark:border-gray-600" />
      <button
        onClick={handleLogout}
        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Sign out
      </button>
    </div>
  ) : null;

  // Add a useEffect hook to fix missing avatars after initial page load
  useEffect(() => {
    // This hook handles recovering avatars in case they're not loaded properly
    if (currentUser && !currentUser.avatar) {
      // Check if we have a stored avatar in localStorage that we can use
      const storedAvatar = localStorage.getItem('userAvatar');
      const hasStoredAvatarFlag = localStorage.getItem('hasUserAvatar');
      
      if (storedAvatar || hasStoredAvatarFlag) {
        console.log('Navbar: Found avatar in localStorage but missing in currentUser, applying it');
        
        // If we have the actual avatar data, use it
        if (storedAvatar) {
          dispatch({
            type: ACTIONS.SET_CURRENT_USER,
            payload: {
              ...currentUser,
              avatar: storedAvatar
            }
          });
        } else {
          // Otherwise, trigger a refresh to fetch it from the API
          console.log('Navbar: Has avatar flag is true but no actual avatar data, refreshing profile');
          setAvatarRefreshAttempt(prev => prev + 1);
        }
      }
    }
  }, [currentUser, dispatch]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="hidden md:block font-bold text-lg text-gray-800 dark:text-white mr-4">
          Shigotoko
        </div>
        <div className="relative flex-1 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Display username prominently */}
        {currentUser && (
          <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {currentUser.name}
            </span>
          </div>
        )}
        
        {mounted && (
          <button 
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        )}
        
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          aria-label="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
        
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
        
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`relative p-2 transition-colors duration-200 rounded-md ${
            isLoggingOut 
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' 
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
          }`}
          aria-label="Logout"
          title="Logout"
          data-testid="logout-button"
        >
          {isLoggingOut ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300"></div>
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </button>
        
        {/* Mobile user info - shows only on small screens */}
        {currentUser && (
          <div className="md:hidden flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</div>
          </div>
        )}
        
        {/* User dropdown */}
        <div className="relative ml-3 flex items-center">
          {/* Display role next to avatar */}
          {currentUser && (
            <div className="hidden md:block mr-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</div>
            </div>
          )}
          <div>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span className="sr-only">Open user menu</span>
              {renderUserAvatar()}
            </button>
          </div>

          <div
            className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${
              isUserMenuOpen ? 'block' : 'hidden'
            }`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            tabIndex={-1}
          >
            {userMenuItems}
          </div>
        </div>
      </div>
    </header>
  );
} 