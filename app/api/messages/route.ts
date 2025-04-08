import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionForEmployee, verifySessionForUser } from '@/lib/auth';

// Helper for common error handling
async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/messages - Fetch all messages with pagination
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const sessionToken = getSessionToken(request);
    
    // Check for valid employee session first
    let authenticatedEntity = await verifySessionForEmployee(sessionToken);
    let isEmployee = !!authenticatedEntity;
    
    // If not found, try user session
    if (!authenticatedEntity) {
      authenticatedEntity = await verifySessionForUser(sessionToken);
    }
    
    if (!authenticatedEntity) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const after = searchParams.get('after');
    
    // Build query
    const queryOptions: any = {
      take: limit,
      skip: after ? 0 : (page - 1) * limit,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            position: true,
            departmentId: true,
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    };
    
    // If "after" is provided, get messages after that timestamp
    if (after) {
      queryOptions.where = {
        timestamp: {
          gt: new Date(after),
        },
      };
    }
    
    const messages = await prisma.message.findMany(queryOptions);
    
    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: queryOptions.where,
    });
    
    // Format messages to include sender information consistently
    const formattedMessages = messages.map(message => {
      const senderInfo = message.employee || message.sender;
      return {
        id: message.id,
        content: message.content,
        sender: message.employeeId || message.senderId || 'unknown',
        senderName: senderInfo?.name || message.senderName || 'Unknown User',
        senderAvatar: senderInfo?.avatar || null,
        timestamp: message.timestamp.toISOString(),
        isEmployee: !!message.employeeId
      };
    });
    
    return NextResponse.json({
      messages: formattedMessages,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      }
    });
  });
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Verify authentication
    const sessionToken = getSessionToken(request);
    
    // Check for valid employee session first
    let authenticatedEmployee = await verifySessionForEmployee(sessionToken);
    
    // If not found, try user session
    let authenticatedUser = null;
    if (!authenticatedEmployee) {
      authenticatedUser = await verifySessionForUser(sessionToken);
    }
    
    if (!authenticatedEmployee && !authenticatedUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Create message with the appropriate sender information
    let messageData: any = {
      content: body.content.trim(),
      timestamp: new Date(),
    };
    
    if (authenticatedEmployee) {
      messageData.employeeId = authenticatedEmployee.id;
      messageData.senderName = authenticatedEmployee.name;
    } else if (authenticatedUser) {
      messageData.senderId = authenticatedUser.id;
      messageData.senderName = authenticatedUser.name;
    }
    
    const message = await prisma.message.create({
      data: messageData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });
    
    // Format response consistently
    const senderInfo = message.employee || message.sender;
    const formattedMessage = {
      id: message.id,
      content: message.content,
      sender: message.employeeId || message.senderId || 'unknown',
      senderName: senderInfo?.name || message.senderName || 'Unknown User',
      senderAvatar: senderInfo?.avatar || null,
      timestamp: message.timestamp.toISOString(),
      isEmployee: !!message.employeeId
    };
    
    return NextResponse.json(formattedMessage, { status: 201 });
  });
}

// DELETE /api/messages/:id - Delete a specific message (admin or message creator only)
export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    // Extract message ID from request path
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const messageId = parts[parts.length - 1];
    
    if (!messageId || messageId === 'messages') {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const sessionToken = getSessionToken(request);
    
    // Check for valid employee session first
    let authenticatedEmployee = await verifySessionForEmployee(sessionToken);
    let isAdmin = authenticatedEmployee?.role === 'admin';
    
    // If not found, try user session
    let authenticatedUser = null;
    if (!authenticatedEmployee) {
      authenticatedUser = await verifySessionForUser(sessionToken);
      isAdmin = authenticatedUser?.role === 'Admin';
    }
    
    if (!authenticatedEmployee && !authenticatedUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to delete this message
    const isOwnMessage = 
      (authenticatedEmployee && message.employeeId === authenticatedEmployee.id) ||
      (authenticatedUser && message.senderId === authenticatedUser.id);
    
    if (!isAdmin && !isOwnMessage) {
      return NextResponse.json(
        { error: 'Not authorized to delete this message' },
        { status: 403 }
      );
    }
    
    // Delete the message
    await prisma.message.delete({
      where: { id: messageId }
    });
    
    return NextResponse.json({ success: true });
  });
} 