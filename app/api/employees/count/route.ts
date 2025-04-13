import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

/**
 * GET /api/employees/count - Returns the total count of employees
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get the total count of employees
    const count = await prisma.employee.count();
    
    console.log(`GET /api/employees/count - Count: ${count}`);
    
    // Return the count in a standardized format
    return createSuccessResponse({ count });
  });
} 