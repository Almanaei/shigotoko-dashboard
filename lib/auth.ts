import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

/**
 * Extract session token from request cookies
 */
export function getSessionToken(request: NextRequest): string | null {
  // Check for employee session first (newer format)
  const employeeSession = request.cookies.get('employee-session')?.value;
  if (employeeSession) {
    return employeeSession;
  }
  
  // Then check for user session token (two possible formats)
  const sessionHyphen = request.cookies.get('session-token')?.value;
  if (sessionHyphen) {
    return sessionHyphen;
  }
  
  const sessionUnderscore = request.cookies.get('session_token')?.value;
  if (sessionUnderscore) {
    return sessionUnderscore;
  }
  
  return null;
}

/**
 * Verify session token for an employee
 * @returns The authenticated employee or null if not found
 */
export async function verifySessionForEmployee(sessionToken: string | null) {
  if (!sessionToken) {
    return null;
  }
  
  try {
    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: {
        // We need to cast this as any because the Session model in the Prisma schema
        // has the employeeId field but TypeScript doesn't recognize it yet in the generated types
        employee: true
      }
    }) as any; // Cast to any to handle the employee relation
    
    // Check if session exists, is valid, and has an associated employee
    if (!session || !session.employee || session.expires < new Date()) {
      return null;
    }
    
    return session.employee;
  } catch (error) {
    console.error('Error verifying employee session:', error);
    return null;
  }
}

/**
 * Verify session token for a user
 * @returns The authenticated user or null if not found
 */
export async function verifySessionForUser(sessionToken: string | null) {
  if (!sessionToken) {
    return null;
  }
  
  try {
    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: {
        user: true
      }
    });
    
    // Check if session exists, is valid, and has an associated user
    if (!session || !session.user || session.expires < new Date()) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error verifying user session:', error);
    return null;
  }
}

/**
 * Get current authenticated entity (either Employee or User)
 * @returns Object containing the authenticated entity and its type
 */
export async function getCurrentAuthenticatedEntity(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  
  // Check for employee session first
  const employee = await verifySessionForEmployee(sessionToken);
  if (employee) {
    return { 
      entity: employee, 
      type: 'employee'
    };
  }
  
  // Then check for user session
  const user = await verifySessionForUser(sessionToken);
  if (user) {
    return {
      entity: user,
      type: 'user'
    };
  }
  
  return { entity: null, type: null };
} 