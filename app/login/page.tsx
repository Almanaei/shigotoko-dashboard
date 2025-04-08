"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const router = useRouter();

  // Check for recovery parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const recoveryEmail = params.get('email');
      const isRecoveryAttempt = params.get('recovery') === 'true';
      
      if (recoveryEmail) {
        setEmail(recoveryEmail);
      }
      
      if (isRecoveryAttempt) {
        setIsRecovery(true);
        setError('Your login session had an issue. Please try logging in again.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Login attempt with:', email);
    
    try {
      // Clear any existing session cookies first
      if (typeof document !== 'undefined') {
        document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session-token-sync=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        console.log('Cleared existing session cookies before login attempt');
      }
      
      // Try both authentication methods (User and Employee)
      let user = null;
      let authType = '';
      
      // First try regular User login
      try {
        console.log('Attempting User authentication...');
        user = await API.auth.login({ email, password });
        if (user) {
          console.log('User authentication successful');
          authType = 'user';
        }
      } catch (userAuthError) {
        console.log('User authentication failed:', userAuthError);
      }
      
      // If User login failed, try Employee login
      if (!user) {
        try {
          console.log('Attempting Employee authentication...');
          user = await API.auth.employeeLogin({ email, password });
          if (user) {
            console.log('Employee authentication successful');
            authType = 'employee';
          }
        } catch (employeeAuthError) {
          console.log('Employee authentication failed:', employeeAuthError);
        }
      }
      
      if (user) {
        console.log(`Login successful via ${authType} authentication, user data:`, user);
        
        // Give the server a moment to fully process the session creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if the cookie was set by the server
        const hasHyphenCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('session-token='));
        
        const hasUnderscoreCookie = document.cookie.split(';').some(c => 
          c.trim().startsWith('session_token='));
          
        console.log('After login - session-token cookie present:', hasHyphenCookie);
        console.log('After login - session_token cookie present:', hasUnderscoreCookie);
        
        // Force set the cookie client-side for immediate synchronization
        if (typeof document !== 'undefined') {
          // Set a temporary non-httpOnly cookie to ensure we have a session marker
          const expiresDate = new Date();
          expiresDate.setDate(expiresDate.getDate() + 30);
          document.cookie = `session-token-sync=true; expires=${expiresDate.toUTCString()}; path=/;`;
          console.log('Set session-token-sync cookie for client-side verification');
          
          // If hyphen cookie is missing but we got a valid user response, try to also set it client-side
          // This helps in case the HttpOnly cookie wasn't properly set by the server
          if (!hasHyphenCookie && !hasUnderscoreCookie) {
            console.log('Warning: No session cookie detected after login. Setting a fallback cookie.');
            // This is a fallback and less secure than the HttpOnly cookie set by the server
            // But it at least allows immediate usage until the user can properly log in again
            const fallbackExpires = new Date();
            fallbackExpires.setMinutes(fallbackExpires.getMinutes() + 30); // Short expiry for security
            document.cookie = `session_token=temp-${Date.now()}; expires=${fallbackExpires.toUTCString()}; path=/;`;
          }
        }
        
        // Add a small delay to ensure cookies are properly set
        setTimeout(() => {
          localStorage.setItem('justLoggedIn', 'true');
          localStorage.setItem('userEmail', email); // Store for possible retry purposes
          localStorage.setItem('authType', authType); // Store auth type for possible future use
          console.log('Redirecting to dashboard...');
          window.location.href = '/';
        }, 500);
      } else {
        throw new Error('Login failed - incorrect email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shigotoko</h1>
          <h2 className="mt-2 text-lg font-medium text-gray-600 dark:text-gray-300">Sign in to your account</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="text-sm text-center">
            <span className="text-gray-500 dark:text-gray-400">Test accounts:</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="font-medium">Admin User</div>
                <div>email: admin@shigotoko.com</div>
                <div>password: password123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 