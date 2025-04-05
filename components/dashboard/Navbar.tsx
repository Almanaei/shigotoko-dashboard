"use client";

import { Bell, Search, Calendar, MessageCircle, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { useTheme } from '@/lib/ThemeProvider';

export default function Navbar() {
  const { state } = useDashboard();
  const { currentUser, notifications } = state;
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card py-3 px-6 flex items-center justify-between shadow-sm dark:shadow-card-dark">
      <div className="flex items-center">
        <div className="relative lg:min-w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {mounted && (
          <button 
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        )}
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <Calendar className="h-5 w-5" />
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <MessageCircle className="h-5 w-5" />
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
        
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              {currentUser.name.charAt(0) + currentUser.name.split(' ')[1]?.charAt(0) || ''}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 