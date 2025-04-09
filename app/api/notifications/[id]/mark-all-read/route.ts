import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';

// POST to mark all notifications as read
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to update notifications');
    }
    
    // Mark all notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: entity.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    
    return createSuccessResponse({
      success: true,
      updated: result.count,
    });
  });
} 