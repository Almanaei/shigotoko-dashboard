import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware function to run on every request
export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /about, /api/auth)
  const path = request.nextUrl.pathname;
  
  console.log('Middleware: Processing request for path:', path);
  
  // Define paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register';
  
  // Don't apply auth protection to API routes - API routes handle their own auth
  if (path.startsWith('/api/')) {
    console.log('Middleware: API route, skipping auth check');
    return NextResponse.next();
  }
  
  // Check if user is authenticated - look for both hyphen and underscore formats
  const sessionToken = 
    request.cookies.get('session-token')?.value || 
    request.cookies.get('session_token')?.value;
  
  console.log('Middleware: sessionToken exists:', !!sessionToken);
  if (sessionToken) {
    console.log('Middleware: sessionToken first 8 chars:', sessionToken.substring(0, 8) + '...');
    // Determine which format was found
    const format = request.cookies.get('session-token') ? 'hyphen' : 'underscore';
    console.log('Middleware: Using session token format:', format);
  } else {
    console.log('Middleware: No session token found in cookies');
    console.log('Middleware: All cookies:', request.cookies.getAll().map(c => c.name));
  }
  
  // If the request is for the login or register page and the user is authenticated,
  // redirect them to the dashboard
  if (isPublicPath && sessionToken) {
    console.log('Middleware: User has session token and is trying to access public path. Redirecting to dashboard.');
    const response = NextResponse.redirect(new URL('/', request.url));
    // Preserve the session token
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
    return response;
  }
  
  // If the request is not for a public path and the user is not authenticated,
  // redirect them to the login page
  if (!isPublicPath && !sessionToken) {
    console.log('Middleware: User does not have session token and is trying to access protected path. Redirecting to login.');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log('Middleware: Request is allowed to proceed normally');
  const response = NextResponse.next();
  
  // Preserve the session token on all responses
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
  }
  
  return response;
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