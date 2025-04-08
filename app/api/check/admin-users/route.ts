import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Find users with admin role
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { 
          in: ['admin', 'administrator', 'Admin', 'Administrator'] 
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        // Exclude sensitive fields like password
      },
    });

    return createSuccessResponse({
      count: adminUsers.length,
      users: adminUsers,
    });
  });
} 