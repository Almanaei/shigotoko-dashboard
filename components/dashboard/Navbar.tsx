"use client";

import { Bell, Search, Calendar, MessageCircle, Moon, Sun, LogOut, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { ACTIONS } from '@/lib/DashboardProvider';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import MemoizedAvatar from './MemoizedAvatar';
import { useSearch } from '@/lib/SearchContext';
import Link from 'next/link';
import { API } from '@/lib/api';

// Add TypeScript interface for the extended Window object at the top of the file (after imports)
declare global {
  interface Window {
    __handleAvatarError?: () => void;
  }
}

export default function Navbar() {
  const { state, dispatch } = useDashboard();
  const { notifications } = state;
  const { state: authState, logout } = useAuth();
  const { user } = authState;
  const { openSearch } = useSearch();
  
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
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

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle marking a notification as read
  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await API.notifications.markAsRead(id);
      
      // Update notification in state
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadNotifications === 0) return;
    
    setIsMarkingAllAsRead(true);
    
    try {
      await API.notifications.markAllAsRead();
      
      // Update all notifications in state
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: notifications.map(notif => ({ ...notif, read: true }))
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };
  
  // Format date for notifications
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

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

  // Render notification icon with dropdown
  const renderNotificationIcon = () => (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadNotifications}
          </span>
        )}
      </button>
      
      {isNotificationMenuOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
            
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead || unreadNotifications === 0}
              className={`text-xs font-medium px-2 py-1 rounded ${
                unreadNotifications === 0
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              {isMarkingAllAsRead ? (
                <span className="flex items-center">
                  <span className="h-3 w-3 mr-1 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  Marking...
                </span>
              ) : (
                'Mark all as read'
              )}
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 relative ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.read 
                          ? 'bg-gray-300 dark:bg-gray-600' 
                          : notification.type === 'alert' 
                            ? 'bg-red-500' 
                            : notification.type === 'message' 
                              ? 'bg-blue-500' 
                              : 'bg-green-500'
                      }`} />
                      
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatNotificationDate(notification.timestamp)}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <Link href="/notifications" passHref>
              <div className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-center block">
                View all notifications
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-dark-header shadow-sm dark:shadow-header-dark transition-colors">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left section */}
        <div className="flex items-center">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-500">
            Shigotoko
            <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs">Dashboard</span>
          </div>
        </div>

        {/* Search bar */}
        <div 
          className="w-full max-w-md mx-4 flex-grow cursor-pointer"
          onClick={openSearch}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <div className="block w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-800 focus:outline-none rounded-lg text-gray-400 dark:text-gray-500 text-sm">
              Search... (Press / to focus)
            </div>
          </div>
        </div>

        {/* Right section */}
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
          
          <Link href="/schedule" passHref>
            <div className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer">
              <Calendar className="h-5 w-5" />
            </div>
          </Link>
          
          <Link href="/messages" passHref>
            <div className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer">
              <MessageCircle className="h-5 w-5" />
            </div>
          </Link>
          
          {renderNotificationIcon()}
          
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
      </div>
    </header>
  );
} 