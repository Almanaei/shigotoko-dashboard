"use client";

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { DashboardProvider } from '@/lib/DashboardProvider';
import Stats from './Stats';
import TaskBoard from './TaskBoard';
import Chat from './Chat';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex h-screen dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 h-full overflow-hidden flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1 p-4 overflow-auto">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Stats />
                <TaskBoard />
              </div>
              <div className="lg:col-span-1 space-y-4">
                <Chat />
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
} 