"use client";

import { useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import Stats from '@/components/dashboard/Stats';
import TaskBoard from '@/components/dashboard/TaskBoard';
import Chat from '@/components/dashboard/Chat';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  
  // Check login state on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we just logged in
        const justLoggedIn = localStorage.getItem('justLoggedIn');
        
        if (justLoggedIn === 'true') {
          // Clear the flag
          localStorage.removeItem('justLoggedIn');
          console.log('Just logged in, already on dashboard');
          return; // Already on dashboard, no need to check auth
        }
        
        // Normal session check
        const user = await API.auth.getCurrentUser();
        if (!user) {
          console.log('No user session found, redirecting to login');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login';
      }
    };
    
    checkAuth();
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Stats />
            <TaskBoard />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Chat />
          </div>
        </div>
      </div>
    </Layout>
  );
}
