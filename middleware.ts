import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware function to run on every request
export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /about, /api/auth)
  const path = request.nextUrl.pathname;
  
  console.log('Middleware: Processing request for path:', path);
  
  // Check authentication status
  const sessionToken = 
    request.cookies.get('session-token')?.value || 
    request.cookies.get('session_token')?.value;
  
  const employeeSessionToken = request.cookies.get('employee-session')?.value;
  const isAuthenticated = !!sessionToken || !!employeeSessionToken;
  
  // Debug info
  console.log('Middleware: isAuthenticated:', isAuthenticated);
  console.log('Middleware: sessionToken exists:', !!sessionToken);
  console.log('Middleware: employeeSessionToken exists:', !!employeeSessionToken);
  
  const allCookies = request.cookies.getAll().map(c => c.name);
  console.log('Middleware: All cookies:', allCookies);
  
  if (sessionToken) {
    console.log('Middleware: sessionToken first 8 chars:', sessionToken.substring(0, 8) + '...');
  }
  
  if (employeeSessionToken) {
    console.log('Middleware: employeeSessionToken first 8 chars:', employeeSessionToken.substring(0, 8) + '...');
  }
  
  // Skip middleware for API routes
  if (path.startsWith('/api/')) {
    console.log('Middleware: API route, skipping auth check');
    return NextResponse.next();
  }
  
  // VERY SPECIFIC REDIRECTION RULES
  
  // Rule 1: Non-authenticated users can only access login and register
  if (!isAuthenticated) {
    // Allow access to public paths
    if (path === '/login' || path === '/register') {
      console.log('Middleware: Non-authenticated user accessing public path, allowed');
      return NextResponse.next();
    }
    
    // Redirect to login for any other path
    console.log('Middleware: Non-authenticated user accessing protected path, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Rule 2: Authenticated users trying to access login/register should go to dashboard
  if (isAuthenticated && (path === '/login' || path === '/register')) {
    console.log('Middleware: Authenticated user accessing login/register, redirecting to dashboard');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Rule 3: For settings page specifically, allow access if authenticated
  if (path === '/settings' && isAuthenticated) {
    console.log('Middleware: Authenticated user accessing settings page, explicitly allowed');
    // Continue with the request
    const response = NextResponse.next();
    preserveAuthCookies(response, sessionToken, employeeSessionToken);
    return response;
  }
  
  // Rule 4: For all other paths, allow if authenticated
  if (isAuthenticated) {
    console.log('Middleware: Authenticated user accessing path:', path, '- allowed');
    const response = NextResponse.next();
    preserveAuthCookies(response, sessionToken, employeeSessionToken);
    return response;
  }
  
  // Should not reach here, but just in case
  console.log('Middleware: Unexpected path through middleware logic for:', path);
  return NextResponse.next();
}

// Helper function to preserve authentication cookies
function preserveAuthCookies(response: NextResponse, sessionToken?: string, employeeSessionToken?: string) {
  if (sessionToken) {
    response.cookies.set({
      name: 'session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    });
    
    // Set auth_type cookie to 'user' for client detection
    response.cookies.set({
      name: 'auth_type',
      value: 'user',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Clear any employee session cookies to avoid conflicts
    response.cookies.delete('employee-session');
  }
  
  if (employeeSessionToken) {
    response.cookies.set({
      name: 'employee-session',
      value: employeeSessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Also ensure the auth_type cookie is set for client-side detection
    response.cookies.set({
      name: 'auth_type',
      value: 'employee',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Also clear any possible user session cookies to avoid conflicts
    response.cookies.delete('session-token');
    response.cookies.delete('session_token');
  }
}

// Configure the middleware to run on specific paths
export const config = {
  // Match all request paths except for static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 