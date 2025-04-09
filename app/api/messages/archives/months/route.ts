import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionForEmployee, verifySessionForUser } from '@/lib/auth';

// Interface for archive month response
interface ArchiveMonth {
  archiveMonth: string;
}

// Helper for common error handling
async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    console.error('Message Archives Months API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Verify authentication before proceeding
async function verifyAuth(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  
  // Check for valid employee session first
  let authenticatedEntity = await verifySessionForEmployee(sessionToken);
  
  // If not found, try user session
  if (!authenticatedEntity) {
    authenticatedEntity = await verifySessionForUser(sessionToken);
  }
  
  if (!authenticatedEntity) {
    return null;
  }
  
  return authenticatedEntity;
}

// GET /api/messages/archives/months - Get available archive months
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authenticatedEntity = await verifyAuth(request);
    if (!authenticatedEntity) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    try {
      // Try to query available months using raw SQL
      // This will work even if the Prisma schema isn't fully updated yet
      const result = await prisma.$queryRaw<{ archiveMonth: string }[]>`
        SELECT DISTINCT "archiveMonth" 
        FROM "MessageArchive" 
        ORDER BY "archiveMonth" DESC
      `;
      
      const months = result.map(row => row.archiveMonth);
      
      return NextResponse.json({
        months,
        count: months.length
      });
    } catch (error) {
      console.error('Error fetching archive months:', error);
      
      // If the table doesn't exist yet, just return an empty array
      return NextResponse.json({
        months: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Message Archives Months API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 