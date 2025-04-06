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
  
  // Debug logging
  useEffect(() => {
    console.log('Current user in Navbar:', currentUser);
  }, [currentUser]);
  
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
  }, []);
  
  // Make sure we have a theme value
  const effectiveTheme = mounted ? theme : 'light';
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Direct logout function with guaranteed redirect
  const handleLogout = () => {
    try {
      console.log('Starting logout process...');
      setIsLoggingOut(true);
      
      // Clear user state in context
      if (dispatch) {
        dispatch({
          type: ACTIONS.SET_CURRENT_USER,
          payload: null
        });
      }
      
      // Clear all cookies
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(c => {
          document.cookie = c.trim().split("=")[0] + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        });
      }
      
      console.log('Session cleared, redirecting to login page...');
      
      // Force redirect to login page - guaranteed approach
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Error in logout process:', error);
      
      // Even if everything else fails, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
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
          onClick={() => {
            handleLogout();
            return false; // Prevent default
          }}
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
        
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="block">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm overflow-hidden">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {currentUser.name.charAt(0) + (currentUser.name.split(' ')[1]?.charAt(0) || '')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* User dropdown */}
        <div className="relative ml-3">
          <div>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span className="sr-only">Open user menu</span>
              {currentUser?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={currentUser.avatar}
                  alt={currentUser.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                  {currentUser?.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
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