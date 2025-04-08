import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection with timeout
    const connectionPromise = prisma.$connect();
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout after 5 seconds')), 5000)
    );
    
    // Race the connection against the timeout
    await Promise.race([connectionPromise, timeoutPromise]);
    
    // If we get here, connection was successful
    // Try a simple query to verify full functionality
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      status: 'Database connection successful',
      diagnostics: {
        userCount,
        dbInfo: {
          databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Redact password
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Extract useful information from the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to database', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        envCheck: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(e => console.error('Error disconnecting from database:', e));
  }
} 