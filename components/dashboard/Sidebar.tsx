"use client";

import { Home, Users, Calendar, MessageSquare, FileText, Settings, LifeBuoy, LogOut, Building2, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Employees', href: '/employees', icon: Users, count: 12 },
    { name: 'Departments', href: '/departments', icon: Building2, count: 5 },
    { name: 'Projects', href: '/projects', icon: FolderKanban, count: 3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageSquare, count: 5 },
    { name: 'Documents', href: '/documents', icon: FileText },
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
              {!isCollapsed && item.count && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 ml-3 text-xs font-medium rounded-full">
                  {item.count}
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
      
      <div className="p-4 border-t border-gray-100 dark:border-dark-border">
        <button className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
          <LogOut
            className={`
              text-red-500 dark:text-red-400
              ${isCollapsed ? 'mx-auto' : 'mr-3'}
              h-5 w-5 flex-shrink-0
            `}
            aria-hidden="true"
          />
          {!isCollapsed && (
            <span className="flex-1">Log out</span>
          )}
        </button>
      </div>
    </div>
  );
} 