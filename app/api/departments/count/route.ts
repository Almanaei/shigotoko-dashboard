import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

/**
 * GET /api/departments/count - Returns the total count of departments
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get the total count of departments
    const count = await prisma.department.count();
    
    console.log(`GET /api/departments/count - Count: ${count}`);
    
    // Return the count in a standardized format
    return createSuccessResponse({ count });
  });
} 