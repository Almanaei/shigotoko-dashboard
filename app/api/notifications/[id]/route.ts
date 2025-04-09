import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';

// GET a specific notification
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
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
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to update notifications');
    }
    
    // Get update data
    const updateData = await request.json();
    
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
    
    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: updateData,
    });
    
    return createSuccessResponse(updatedNotification);
  });
}

// DELETE a notification
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
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
    
    // Ensure user owns this notification
    if (notification.userId !== entity.id) {
      return errors.forbidden('You do not have permission to delete this notification');
    }
    
    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });
    
    return createSuccessResponse({ message: 'Notification deleted successfully' });
  });
} 