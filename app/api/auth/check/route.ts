import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define types for diagnostic info
type SessionInfo = {
  id: string;
  expires: Date;
  userId: string;
} | null;

type UserInfo = {
  id: string;
  name: string;
  email: string;
} | null;

// Endpoint for checking auth status with detailed diagnostics
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie - check both formats
    const sessionToken = 
      request.cookies.get('session-token')?.value || 
      request.cookies.get('session_token')?.value;
    
    // Collect diagnostic information
    const diagnostics = {
      cookies: {
        all: request.cookies.getAll().map(c => c.name),
        session_hyphen: request.cookies.get('session-token')?.value ? true : false,
        session_underscore: request.cookies.get('session_token')?.value ? true : false,
        token_value: sessionToken ? sessionToken.substring(0, 8) + '...' : null,
      },
      database: {
        session_exists: false,
        session_valid: false,
        session_found: null as SessionInfo,
        user_exists: false,
        user_info: null as UserInfo,
        total_sessions: 0,
      }
    };
    
    // Check database for sessions
    if (sessionToken) {
      try {
        // Find all sessions
        const allSessions = await prisma.session.findMany({
          include: { user: true },
        });
        
        diagnostics.database.total_sessions = allSessions.length;
        
        // Try to find the specific session
        const session = await prisma.session.findUnique({
          where: { id: sessionToken },
          include: { user: true },
        });
        
        if (session) {
          diagnostics.database.session_exists = true;
          diagnostics.database.session_valid = session.expires > new Date();
          diagnostics.database.session_found = {
            id: session.id.substring(0, 8) + '...',
            expires: session.expires,
            userId: session.userId,
          };
          
          if (session.user) {
            diagnostics.database.user_exists = true;
            diagnostics.database.user_info = {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            };
          }
        }
      } catch (dbError) {
        return NextResponse.json({
          status: 'error',
          error: 'Database error',
          message: (dbError as Error).message,
          diagnostics
        });
      }
    }
    
    // Return diagnostic info
    return NextResponse.json({
      status: diagnostics.database.session_valid ? 'authenticated' : 'not_authenticated',
      diagnostics
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Unexpected error',
      message: (error as Error).message
    });
  }
} 