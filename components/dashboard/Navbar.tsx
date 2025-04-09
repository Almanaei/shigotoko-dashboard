"use client";

import { Bell, Search, Calendar, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import MemoizedAvatar from './MemoizedAvatar';

// Add TypeScript interface for the extended Window object at the top of the file (after imports)
declare global {
  interface Window {
    __handleAvatarError?: () => void;
  }
}

export default function Navbar() {
  const { state } = useDashboard();
  const { notifications } = state;
  const { state: authState, logout } = useAuth();
  const { user } = authState;
  
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  
  // Debug logging
  useEffect(() => {
    console.log('Current user in Navbar:', user);
    if (user?.avatar) {
      console.log('Avatar type:', 
        user.avatar.startsWith('data:') ? 'data:URL' : 
        user.avatar.startsWith('http') ? 'HTTP URL' : 'Other',
        'Length:', user.avatar.length
      );
    } else {
      console.log('No avatar found in user');
    }
  }, [user]);
  
  // Use local theme state instead of ThemeProvider
  // This avoids errors with context availability
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      // Get theme from localStorage or system preference
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Use dark if explicitly set in localStorage or system prefers it and no localStorage preference
      const initialTheme = savedTheme === 'dark' || (!savedTheme && systemPrefersDark) ? 'dark' : 'light';
      
      setLocalTheme(initialTheme);
      setIsDarkMode(initialTheme === 'dark');
      
      // Apply theme to document
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(initialTheme);
    }
  }, []);
  
  // Toggle theme function
  const toggleLocalTheme = () => {
    const newTheme = localTheme === 'light' ? 'dark' : 'light';
    setLocalTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
    
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Simple direct logout function
  const handleLogout = async () => {
    // Show loading state
    setIsLoggingOut(true);
    
    try {
      // Use the AuthProvider logout function
      await logout();
      
      // Redirect to login page
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If API call fails, still attempt to redirect
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Inside the user menu dropdown, add a role update option if current user has Admin capability
  const userMenuItems = user ? (
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
      {user.role === 'Admin' && (
        <>
          <hr className="my-1 border-gray-200 dark:border-gray-600" />
          <div className="block px-4 py-1 text-xs text-gray-500 dark:text-gray-400">
            Admin Actions
          </div>
          
          <button
            onClick={() => {
              // Admin actions would use the new API service
              alert('Admin actions now use the new API service');
            }}
            className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Admin Actions
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

  // Use local theme for UI
  const effectiveTheme = mounted ? localTheme : 'light';

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
        {user && (
          <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {user.name}
            </span>
          </div>
        )}
        
        {mounted && (
          <button 
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={toggleLocalTheme}
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
        {user && (
          <div className="md:hidden flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</div>
          </div>
        )}
        
        {/* User dropdown */}
        <div className="relative ml-3 flex items-center">
          {/* Display role next to avatar */}
          {user && (
            <div className="hidden md:block mr-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
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
              <MemoizedAvatar user={user} size="sm" />
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