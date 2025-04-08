import { NextRequest, NextResponse } from 'next/server';

/**
 * This is a diagnostic endpoint to help with setting and examining cookies.
 * It can be used to troubleshoot authentication issues.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll();
    console.log('Current cookies:', allCookies.map(c => c.name));
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const authType = searchParams.get('type') || 'user';
    const sessionId = searchParams.get('sid') || 'test-session-123';
    const action = searchParams.get('action') || 'set';
    
    // Create response
    const response = NextResponse.json({
      message: `${action === 'clear' ? 'Cleared' : 'Set'} test cookies for ${authType} authentication`,
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