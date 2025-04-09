import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';

// GET notification counts (total and unread)
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to view notification counts');
    }
    
    // Get total count and unread count
    const [total, unread] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: entity.id
        }
      }),
      prisma.notification.count({
        where: {
          userId: entity.id,
          read: false
        }
      })
    ]);
    
    // Return the counts
    return createSuccessResponse({
      total,
      unread
    });
  });
} 