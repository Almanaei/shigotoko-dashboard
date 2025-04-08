import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SessionInfo {
  id: string;
  expires: Date;
  user: string;
}

interface DiagnosticsData {
  database: {
    connection: boolean;
    error: string | null;
    models: {
      user: { exists: boolean; count: number };
      session: { exists: boolean; count: number };
      employee: { exists: boolean; count: number };
      department: { exists: boolean; count: number };
      project: { exists: boolean; count: number };
      document: { exists: boolean; count: number };
    };
    sessionData: SessionInfo[];
  };
  cookies: {
    all: string[];
  };
}

// Endpoint for checking database connectivity and schema
export async function GET(request: NextRequest) {
  const diagnostics: DiagnosticsData = {
    database: {
      connection: false,
      error: null,
      models: {
        user: { exists: false, count: 0 },
        session: { exists: false, count: 0 },
        employee: { exists: false, count: 0 },
        department: { exists: false, count: 0 },
        project: { exists: false, count: 0 },
        document: { exists: false, count: 0 }
      },
      sessionData: []
    },
    cookies: {
      all: request.cookies.getAll().map(c => c.name)
    }
  };

  try {
    // Test database connection by checking user count
    try {
      const userCount = await prisma.user.count();
      diagnostics.database.connection = true;
      diagnostics.database.models.user.exists = true;
      diagnostics.database.models.user.count = userCount;
    } catch (userError) {
      diagnostics.database.error = `User model error: ${(userError as Error).message}`;
    }

    // Check session model
    try {
      const sessionCount = await prisma.session.count();
      diagnostics.database.models.session.exists = true;
      diagnostics.database.models.session.count = sessionCount;
      
      // Get active sessions for diagnostic purposes
      if (sessionCount > 0) {
        const activeSessions = await prisma.session.findMany({
          where: {
            expires: {
              gt: new Date()
            }
          },
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          },
          take: 5 // Limit to avoid large responses
        });
        
        // Use type assertion to avoid any Prisma type issues
        diagnostics.database.sessionData = activeSessions.map(session => ({
          id: session.id.substring(0, 8) + '...',
          expires: session.expires,
          user: session.user ? session.user.email : 'unknown'
        })) as SessionInfo[];
      }
    } catch (sessionError) {
      diagnostics.database.error = `Session model error: ${(sessionError as Error).message}`;
    }

    // Check other models
    try {
      diagnostics.database.models.employee.count = await prisma.employee.count();
      diagnostics.database.models.employee.exists = true;
    } catch (e) { /* ignore errors */ }
    
    try {
      diagnostics.database.models.department.count = await prisma.department.count();
      diagnostics.database.models.department.exists = true;
    } catch (e) { /* ignore errors */ }
    
    try {
      diagnostics.database.models.project.count = await prisma.project.count();
      diagnostics.database.models.project.exists = true;
    } catch (e) { /* ignore errors */ }
    
    try {
      diagnostics.database.models.document.count = await prisma.document.count();
      diagnostics.database.models.document.exists = true;
    } catch (e) { /* ignore errors */ }

    return NextResponse.json({
      status: diagnostics.database.connection ? 'connected' : 'error',
      diagnostics
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Diagnostic failure',
      message: (error as Error).message
    }, { status: 500 });
  }
} 