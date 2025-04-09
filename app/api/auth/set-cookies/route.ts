import { NextRequest, NextResponse } from 'next/server';

/**
 * This is a diagnostic endpoint to help with setting and examining cookies.
 * It can be used to troubleshoot authentication issues.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies for diagnostic purposes
    const allCookies = request.cookies.getAll();
    console.log('Current cookies:', allCookies.map(c => c.name));
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const authType = searchParams.get('type') || 'user';
    const sessionId = searchParams.get('sid') || 'test-session-123';
    const action = searchParams.get('action') || 'set';
    
    // Create response
    const response = NextResponse.json({
      message: `${action === 'clear' ? 'Cleared' : action === 'recover' ? 'Attempted recovery of' : 'Set'} cookies for ${authType} authentication`,
      cookiesBefore: allCookies.map(c => c.name),
      action: action
    });
    
    if (action === 'clear') {
      // Clear all auth cookies
      response.cookies.delete('session-token');
      response.cookies.delete('session_token');
      response.cookies.delete('employee-session');
      response.cookies.delete('auth_type');
      
      console.log('Cleared all auth cookies');
    } else if (action === 'recover') {
      // Special session recovery mode - this attempts to recover from a session expiration
      // by creating a new session without requiring full credentials
      
      // First check if we have any existing cookies we can use to help with recovery
      const existingUserCookie = request.cookies.get('session-token')?.value || 
                                request.cookies.get('session_token')?.value;
      
      const existingEmployeeCookie = request.cookies.get('employee-session')?.value;
      
      if (authType === 'employee' && existingEmployeeCookie) {
        console.log('Recovery: Attempting to recover employee session with existing cookie');
        
        // Extract the session ID parts if possible (usually contains user info)
        // This is a last-resort recovery approach
        try {
          // We can't actually create a new session without the employee credentials,
          // but we can set a new cookie with a slightly extended expiration to give
          // the user a chance to complete their current operation before redirecting
          // to the login page for a proper re-authentication
          
          response.cookies.set({
            name: 'employee-session',
            value: existingEmployeeCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60, // 5 minutes - just enough to finish the current operation
            path: '/',
          });
          
          // Set the auth_type cookie
          response.cookies.set({
            name: 'auth_type',
            value: 'employee',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60, // 5 minutes
            path: '/',
          });
          
          response.cookies.set({
            name: 'session_recovery',
            value: 'attempted',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60, // 1 minute
            path: '/',
          });
          
          console.log('Recovery: Created temporary employee session for recovery');
        } catch (error) {
          console.error('Recovery: Failed to recover employee session:', error);
        }
      } else if (authType === 'user' && existingUserCookie) {
        console.log('Recovery: Attempting to recover user session with existing cookie');
        
        try {
          // Similar approach for user sessions
          response.cookies.set({
            name: 'session-token',
            value: existingUserCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60, // 5 minutes - just enough to finish the current operation
            path: '/',
          });
          
          // Set the auth_type cookie
          response.cookies.set({
            name: 'auth_type',
            value: 'user',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60, // 5 minutes
            path: '/',
          });
          
          response.cookies.set({
            name: 'session_recovery',
            value: 'attempted',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60, // 1 minute
            path: '/',
          });
          
          console.log('Recovery: Created temporary user session for recovery');
        } catch (error) {
          console.error('Recovery: Failed to recover user session:', error);
        }
      } else {
        console.log('Recovery: No existing session cookie found for recovery');
      }
    } else {
      // Set cookies based on type
      if (authType === 'employee') {
        response.cookies.set({
          name: 'employee-session',
          value: sessionId,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        response.cookies.set({
          name: 'auth_type',
          value: 'employee',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        console.log('Set employee auth cookies');
      } else {
        // User auth
        response.cookies.set({
          name: 'session-token',
          value: sessionId,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        response.cookies.set({
          name: 'auth_type',
          value: 'user',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        console.log('Set user auth cookies');
      }
    }
    
    // Return final cookies in the response
    const finalResponse = {
      ...response,
      cookiesAfter: response.cookies.getAll().map(c => c.name)
    };
    
    return response;
  } catch (error) {
    console.error('Cookie diagnostic error:', error);
    return NextResponse.json(
      { error: 'Failed to process cookies', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 