import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';

// GET all notifications for the current user
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to view notifications');
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const after = searchParams.get('after');  // Add support for 'after' timestamp parameter
    
    // Build query
    const skip = (page - 1) * limit;
    const where: any = {
      userId: entity.id,
      ...(unreadOnly ? { read: false } : {}),
    };
    
    // Add timestamp filter if 'after' parameter is provided
    if (after) {
      where.createdAt = {
        gt: new Date(after)
      };
    }
    
    // Fetch notifications
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);
    
    // Return response
    return createSuccessResponse({
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  });
}

// POST a new notification
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get current user - only admins can create notifications
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity || !['admin', 'Admin', 'administrator', 'Administrator'].includes(entity.role)) {
      return errors.forbidden('Only administrators can create notifications');
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.message || !body.type || !body.userId) {
      return errors.badRequest('Missing required fields', {
        required: ['title', 'message', 'type', 'userId'],
        provided: Object.keys(body),
      });
    }
    
    // Validate notification type
    const validTypes = ['message', 'alert', 'update'];
    if (!validTypes.includes(body.type)) {
      return errors.badRequest(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type,
        userId: body.userId,
        read: body.read || false,
      },
    });
    
    return createSuccessResponse(notification, 201);
  });
} 