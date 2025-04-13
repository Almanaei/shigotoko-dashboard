"use client";

import { Home, Users, Calendar, MessageSquare, FileText, Settings, LifeBuoy, LogOut, Building2, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { API } from '@/lib/api';
import { useDashboard } from '@/lib/DashboardProvider';
import GlobalAvatar from './GlobalAvatar';
import { safeJsonParse } from '@/lib/utils/safeJsonParse';

interface CountsData {
  employees: number;
  departments: number;
  projects: number;
  messages: number;
  documents: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
}

interface SidebarProps {
  collapsed?: boolean;
}

/**
 * Retry function with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns The result of the operation
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} retries:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
      
      // Wait before the next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error in retry logic');
}

export default function Sidebar({ collapsed }: SidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed || false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [counts, setCounts] = useState<CountsData>({
    employees: 0,
    departments: 0,
    projects: 0,
    messages: 0,
    documents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { state } = useDashboard();
  
  const fetchCounts = useCallback(async () => {
    try {
      // Fetch counts from API endpoints
      const [employeesResponse, departmentsResponse, projectsResponse, messageCount, documentCount] = await Promise.all([
        fetch('/api/employees/count', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }).then(res => res.json()),
        fetch('/api/departments/count', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }).then(res => res.json()),
        fetch('/api/projects/count', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }).then(res => res.json()).catch(() => ({ count: state.projects.length })),
        fetchMessageCount(),
        fetchDocumentCount()
      ]);

      setCounts({
        employees: employeesResponse?.count || 0,
        departments: departmentsResponse?.count || 0,
        projects: projectsResponse?.count || 0,
        messages: messageCount,
        documents: documentCount
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
      // Fallback to counts from state
      setCounts({
        employees: state.employees.length,
        departments: state.departments.length,
        projects: state.projects.length,
        messages: state.messages.length,
        documents: state.documents.length
      });
    } finally {
      setIsLoading(false);
    }
  }, [state.employees.length, state.departments.length, state.projects.length, state.messages.length, state.documents.length]);

  const fetchMessageCount = async (): Promise<number> => {
    try {
      const response = await retryWithBackoff<Response>(
        () => fetch('/api/messages/count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        3,
        500
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Handle authentication issues
          console.error('Authentication error fetching message count');
          return state.messages.length;
        }
        throw new Error(`Error fetching message count: ${response.status}`);
      }

      const data = await safeJsonParse<{ count: number }>(response, {
        fallbackValue: { count: 0 },
        endpoint: '/api/messages/count'
      });

      return data.count || 0;
    } catch (error) {
      console.error('Failed to fetch message count:', error);
      return state.messages.length;
    }
  };

  const fetchDocumentCount = async (): Promise<number> => {
    try {
      const response = await retryWithBackoff<Response>(
        () => fetch('/api/documents/count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        3,
        500
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Handle authentication issues
          console.error('Authentication error fetching document count');
          return state.documents.length;
        }
        throw new Error(`Error fetching document count: ${response.status}`);
      }

      const data = await safeJsonParse<{ count: number }>(response, {
        fallbackValue: { count: 0 },
        endpoint: '/api/documents/count'
      });

      return data.count || 0;
    } catch (error) {
      console.error('Failed to fetch document count:', error);
      return state.documents.length;
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Set up an interval to refresh counts every 30 seconds
    const intervalId = setInterval(fetchCounts, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchCounts]);
  
  // Update internal state when prop changes
  useEffect(() => {
    if (collapsed !== undefined) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed]);

  // Handle logout
  const handleLogout = async () => {
    // Show loading state
    setIsLoggingOut(true);
    
    try {
      // Use the API to properly logout - this will handle the server-side session deletion
      console.log('Logging out via API from sidebar...');
      await API.auth.logout();
      
      // Additionally clear cookies on the client side
      console.log('Clearing cookies...');
      // Handle both cookie formats (with hyphen and underscore)
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      console.log('Redirecting to login page...');
      // Force a complete page refresh when redirecting
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If API call fails, still attempt to clear cookies and redirect
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.replace('/login');
    }
  };
  
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Employees', href: '/employees', icon: Users, count: isLoading ? 0 : counts.employees },
    { name: 'Departments', href: '/departments', icon: Building2, count: isLoading ? 0 : counts.departments },
    { name: 'Projects', href: '/projects', icon: FolderKanban, count: isLoading ? 0 : counts.projects },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageSquare, count: isLoading ? 0 : counts.messages },
    { name: 'Documents', href: '/documents', icon: FileText, count: isLoading ? 0 : counts.documents },
  ];
  
  const secondaryNavigation: NavItem[] = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: LifeBuoy }
  ];

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col h-full`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center">
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white ml-2">Shigotoko</span>
          )}
          {isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white">ST</span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                ${item.href === pathname ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-300'}
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
              `}
            >
              <item.icon
                className={`
                  ${item.href === pathname ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'}
                  ${isCollapsed ? 'mx-auto' : 'mr-3'}
                  h-5 w-5 flex-shrink-0
                `}
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {!isCollapsed && item.count !== undefined && (
                <span className={`
                  bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 
                  px-2 py-0.5 ml-3 text-xs font-medium rounded-full
                  ${isLoading ? 'animate-pulse' : ''}
                `}>
                  {isLoading ? '0' : item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
        
        <div className="mt-8">
          <h3 className={`${isCollapsed ? 'sr-only' : 'px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'}`}>
            Settings
          </h3>
          <nav className="mt-2 px-2 space-y-1">
            {secondaryNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-300 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <item.icon
                  className={`
                    text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400
                    ${isCollapsed ? 'mx-auto' : 'mr-3'}
                    h-5 w-5 flex-shrink-0
                  `}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="mt-auto border-t border-gray-200 dark:border-dark-border p-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <GlobalAvatar size="sm" />
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {state.currentUser?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {state.currentUser?.role || 'User'}
                </div>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <GlobalAvatar size="sm" />
          )}
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 