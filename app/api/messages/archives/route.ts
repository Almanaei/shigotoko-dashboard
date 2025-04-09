import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionForEmployee, verifySessionForUser } from '@/lib/auth';
import { format, parse, isValid } from 'date-fns';
import { Message, Prisma } from '@prisma/client';

// Type for the message archive
interface MessageWithRelations extends Message {
  employee?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

// Helper for common error handling
async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    console.error('Message Archives API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Verify authentication before proceeding with any operations
async function verifyAuth(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  
  // Check for valid employee session first
  let authenticatedEntity = await verifySessionForEmployee(sessionToken);
  
  // If not found, try user session
  if (!authenticatedEntity) {
    authenticatedEntity = await verifySessionForUser(sessionToken);
  }
  
  if (!authenticatedEntity) {
    return null;
  }
  
  return authenticatedEntity;
}

// GET /api/messages/archives - Get archived messages for a specific month
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Verify authentication
    const authenticatedEntity = await verifyAuth(request);
    if (!authenticatedEntity) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get month parameter (format: YYYY-MM)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }
    
    try {
      // Check if the table exists using raw query
      const archivedMessages = await prisma.$queryRaw<any[]>`
        SELECT * FROM "MessageArchive"
        WHERE "archiveMonth" = ${month}
        ORDER BY "timestamp" ASC
      `;
      
      // Format the archived messages for the response
      const formattedMessages = archivedMessages.map(message => ({
        id: message.id,
        content: message.content,
        sender: message.senderId || message.employeeId || 'unknown',
        senderName: message.senderName || 'Unknown User',
        senderAvatar: message.senderAvatar || null,
        timestamp: new Date(message.timestamp).toISOString(),
        isEmployee: message.isEmployee,
        archiveMonth: message.archiveMonth
      }));
      
      return NextResponse.json({
        messages: formattedMessages,
        count: formattedMessages.length,
        month
      });
    } catch (error) {
      console.error('Error fetching archived messages:', error);
      return NextResponse.json({
        messages: [],
        count: 0,
        month
      });
    }
  });
}

// POST /api/messages/archives - Create a new archive from current messages
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Verify authentication - only admin users can create archives
    const authenticatedEntity = await verifyAuth(request);
    
    if (!authenticatedEntity) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const isAdmin = 
      'role' in authenticatedEntity && 
      (authenticatedEntity.role === 'admin' || authenticatedEntity.role === 'Admin');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can create archives' },
        { status: 403 }
      );
    }
    
    // Check if a custom month was provided in the request body
    let archiveMonth: string;
    let customName: string | null = null;
    
    try {
      const body = await request.json();
      
      // Handle custom month format (YYYY-MM)
      if (body.month && typeof body.month === 'string') {
        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(body.month)) {
          return NextResponse.json(
            { error: 'Invalid month format. Use YYYY-MM' },
            { status: 400 }
          );
        }
        
        // Validate that it's a real month (e.g., 2023-13 is invalid)
        const parsedDate = parse(body.month + '-01', 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
          return NextResponse.json(
            { error: 'Invalid month value' },
            { status: 400 }
          );
        }
        
        archiveMonth = body.month;
      } else {
        // Default to current month
        archiveMonth = format(new Date(), 'yyyy-MM');
      }
      
      // Handle optional custom name for the archive
      if (body.customName && typeof body.customName === 'string') {
        customName = body.customName.trim().substring(0, 100); // Limit length
      }
    } catch (error) {
      // If no body or invalid JSON, use current month
      archiveMonth = format(new Date(), 'yyyy-MM');
    }
    
    // Check if archive for this month already exists
    try {
      const existingArchive = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM "MessageArchive"
        WHERE "archiveMonth" = ${archiveMonth}
      `;
      
      if (existingArchive[0].count > 0) {
        return NextResponse.json(
          { error: `Archive for ${archiveMonth} already exists. Choose a different month.` },
          { status: 409 }
        );
      }
    } catch (error) {
      // Table might not exist yet, which is fine
      console.log('Error checking for existing archive (table might not exist yet):', error);
    }
    
    // Fetch all current messages
    const messages = await prisma.message.findMany({
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
      },
      orderBy: {
        timestamp: 'asc'
      }
    }) as MessageWithRelations[];
    
    try {
      // Begin transaction to archive messages and clear current messages
      const result = await prisma.$transaction(async (tx) => {
        // Check if no messages to archive
        if (messages.length === 0) {
          return {
            archived: 0,
            month: archiveMonth,
            customName
          };
        }
        
        let archivedCount = 0;
        
        // Create archive entries using raw query since Prisma schema might not be updated yet
        for (const message of messages) {
          const senderInfo = message.employee || message.sender;
          const uuid = crypto.randomUUID();
          
          await tx.$executeRaw`
            INSERT INTO "MessageArchive" (
              "id", "content", "senderId", "employeeId", "senderName", 
              "senderAvatar", "timestamp", "archiveMonth", "isEmployee", "createdAt"
            ) VALUES (
              ${uuid}, 
              ${message.content},
              ${message.senderId || null},
              ${message.employeeId || null},
              ${message.senderName || (senderInfo ? senderInfo.name : 'Unknown User')},
              ${senderInfo?.avatar || null},
              ${message.timestamp},
              ${archiveMonth},
              ${!!message.employeeId},
              ${new Date()}
            )
          `;
          
          archivedCount++;
        }
        
        // Delete all current messages
        const deleted = await tx.message.deleteMany({});
        
        // Create system message about the archive
        const monthDisplay = archiveMonth.replace('-', ' ');
        const archiveNotice = customName
          ? `Messages have been archived as "${customName}" (${archiveMonth}). You can view them in the Archives tab.`
          : `Messages have been archived for ${monthDisplay}. You can view them in the Archives tab.`;
        
        const systemMessage = await tx.message.create({
          data: {
            content: archiveNotice,
            senderName: 'System',
            timestamp: new Date()
          }
        });
        
        return {
          archived: archivedCount,
          deleted: deleted.count,
          month: archiveMonth,
          customName,
          systemMessage: systemMessage.id
        };
      });
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error archiving messages:', error);
      return NextResponse.json(
        { error: 'Failed to archive messages', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
} 