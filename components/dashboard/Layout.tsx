"use client";

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ThemeProvider } from '@/lib/ThemeProvider';

// Simple Navbar component to avoid import issues
const NavbarSimple = () => {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
      <div className="font-medium">Shigotoko Dashboard</div>
      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
        <span>A</span>
      </div>
    </header>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 h-full overflow-hidden flex flex-col min-h-screen">
          <NavbarSimple />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 