import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

// GET a specific notification
export async function GET(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to view notifications');
    }
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return errors.notFound('Notification', id);
    }
    
    // Ensure user owns this notification
    if (notification.userId !== entity.id) {
      return errors.forbidden('You do not have permission to view this notification');
    }
    
    return createSuccessResponse(notification);
  });
}

// PATCH to update a notification (e.g., mark as read)
export async function PATCH(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to update notifications');
    }
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return errors.notFound('Notification', id);
    }
    
    // Ensure user owns this notification
    if (notification.userId !== entity.id) {
      return errors.forbidden('You do not have permission to update this notification');
    }
    
    // Parse request body
    const body = await request.json();
    
    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: body.read !== undefined ? body.read : notification.read,
      },
    });
    
    return createSuccessResponse(updatedNotification);
  });
}

// DELETE a notification
export async function DELETE(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to delete notifications');
    }
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return errors.notFound('Notification', id);
    }
    
    // Ensure user owns this notification or is an admin
    const isAdmin = ['admin', 'Admin', 'administrator', 'Administrator'].includes(entity.role);
    if (notification.userId !== entity.id && !isAdmin) {
      return errors.forbidden('You do not have permission to delete this notification');
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id },
    });
    
    return createSuccessResponse({ success: true });
  });
} 