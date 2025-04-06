"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AtSign, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Remove any existing redirectTo param from URL
  useEffect(() => {
    // Clean up the URL if it has redirectTo param
    if (window.location.search.includes('redirectTo')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Simple direct login with fetch and credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Login attempt with:', formData.email);
      
      // Use fetch with explicit credentials
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log('Login successful');
        // Hard redirect to dashboard using location.replace - completely new page load
        window.location.replace('/');
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="Shigotoko Logo"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : 'Sign in'}
                </button>
              </div>
            </div>
          </form>
          
          {/* Test accounts info section */}
          <div className="mt-8 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Test Accounts:</p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Almanaei (Admin):</span>
                <span className="font-mono">almanaei@shigotoko.com / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Alex (Admin):</span>
                <span className="font-mono">alex@shigotoko.com / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Sarah (Manager):</span>
                <span className="font-mono">sarah@shigotoko.com / password123</span>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 