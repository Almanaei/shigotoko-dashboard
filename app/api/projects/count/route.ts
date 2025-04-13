import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

/**
 * GET /api/projects/count - Returns the total count of projects
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get the total count of projects
    const count = await prisma.project.count();
    
    console.log(`GET /api/projects/count - Count: ${count}`);
    
    // Return the count in a standardized format
    return createSuccessResponse({ count });
  });
} 