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
  
  // Check if user is authenticated
  const sessionToken = request.cookies.get('session-token')?.value;
  
  console.log('Middleware: sessionToken exists:', !!sessionToken);
  
  // If the request is for the login or register page and the user is authenticated,
  // redirect them to the dashboard
  if (isPublicPath && sessionToken) {
    console.log('Middleware: User has session token and is trying to access public path. Redirecting to dashboard.');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If the request is not for a public path and the user is not authenticated,
  // redirect them to the login page
  if (!isPublicPath && !sessionToken) {
    console.log('Middleware: User does not have session token and is trying to access protected path. Redirecting to login.');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log('Middleware: Request is allowed to proceed normally');
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  // Match all request paths except for static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public folder files (e.g. /images, /fonts, /icons)
     * - favicon.ico, robots.txt (common static files)
     */
    '/((?!_next/static|_next/image|images|favicon.ico|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}; 