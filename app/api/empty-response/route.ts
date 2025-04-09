import { NextResponse } from 'next/server';

// This route returns an empty response with a 200 status
// It's used to intercept requests for the MSW service worker to prevent 404 errors
export async function GET() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}

// Handle other HTTP methods with the same response
export async function POST() {
  return GET();
} 