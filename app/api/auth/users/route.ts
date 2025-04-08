import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Endpoint for listing all users in the database
export async function GET(request: NextRequest) {
  try {
    // Find all users in the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password for security
        sessions: {
          select: {
            id: true,
            expires: true,
            createdAt: true
          }
        }
      },
    });
    
    // Count active sessions
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gt: new Date()
        }
      }
    });
    
    return NextResponse.json({
      users,
      stats: {
        totalUsers: users.length,
        activeSessions,
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: (error as Error).message },
      { status: 500 }
    );
  }
} 