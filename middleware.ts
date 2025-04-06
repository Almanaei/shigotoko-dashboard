import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/api/auth'];

export function middleware(request: NextRequest) {
  // Get the pathname from the request
  const path = request.nextUrl.pathname;

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Check if API request (except auth API)
  const isApiRoute = path.startsWith('/api/') && !path.startsWith('/api/auth');

  // Check if the user is authenticated - FIXED: use session-token with hyphen to match auth.ts
  const sessionToken = request.cookies.get('session-token')?.value;
  const isAuthenticated = !!sessionToken;

  // If it's an API route, just continue (API routes handle auth internally)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users trying to access login page
  if (isAuthenticated && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Continue for authenticated users or public routes
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all request paths except for those starting with these paths:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (images, etc.)
    '/((?!_next/static|_next/image|favicon.ico|avatars/).*)',
  ],
}; 