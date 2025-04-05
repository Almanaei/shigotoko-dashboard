"use client";

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen dark:bg-background-dark">
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 