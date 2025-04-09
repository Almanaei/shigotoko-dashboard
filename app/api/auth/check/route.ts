import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Employee, User } from '@prisma/client';

/**
 * Authentication check endpoint that provides detailed diagnostic information
 * about the current session status. This can be used for troubleshooting
 * authentication issues or implementing client-side session handling.
 */

// Define a minimal type for diagnostics to avoid 'any'
type AuthDiagnostics = {
  cookies: {
    sessionToken: boolean;
    employeeSessionToken: boolean;
    authType: string | null;
    allCookies: string[];
  };
  sessionCheck: Record<string, unknown> | null;
  timestamp: string;
};

// Define proper types for the diagnostics information
interface CookieDiagnostics {
  sessionToken: boolean;
  employeeSessionToken: boolean;
  authType: string | null;
  allCookies: string[];
}

interface SessionCheckDiagnostics {
  valid: boolean;
  type: 'employee' | 'user';
  name?: string;
  email?: string;
  expires?: Date;
  reason?: string;
  expiredAt?: Date;
  error?: string;
}

// Define session types that include the relations
interface SessionWithEmployee {
  id: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  employee: Employee | null;
  employeeId: string | null;
}

interface SessionWithUser {
  id: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  user: User | null;
}

export async function GET(request: NextRequest) {
  try {
    // Extract cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    const employeeSessionToken = request.cookies.get('employee-session')?.value;
    const authTypeCookie = request.cookies.get('auth_type')?.value;
    
    // Log debugging information
    console.log('Auth Check: Received request with cookies:', {
      hasSessionToken: !!sessionToken,
      hasEmployeeSessionToken: !!employeeSessionToken,
      authTypeCookie,
      allCookies: request.cookies.getAll().map(c => c.name),
    });
    
    // Diagnostic info to return
    const diagnostics: AuthDiagnostics = {
      cookies: {
        sessionToken: !!sessionToken,
        employeeSessionToken: !!employeeSessionToken,
        authType: authTypeCookie || null,
        allCookies: request.cookies.getAll().map(c => c.name),
      },
      sessionCheck: null,
      timestamp: new Date().toISOString(),
    };
    
    // First try employee authentication (if we have that cookie)
    if (employeeSessionToken) {
      try {
        console.log('Auth Check: Checking employee session:', employeeSessionToken.substring(0, 8) + '...');
        
        // Check for employee session
        const employeeSession = await prisma.session.findUnique({
          where: { id: employeeSessionToken },
          include: { 
            employee: true 
          }
        });
        
        if (employeeSession && employeeSession.employee) {
          // Check session expiration
          if (employeeSession.expires > new Date()) {
            // Valid employee session
            const employee = employeeSession.employee;
            
            console.log('Auth Check: Found valid employee session for:', employee.name);
            
            diagnostics.sessionCheck = {
              valid: true,
              type: 'employee',
              name: employee.name,
              email: employee.email,
              expires: employeeSession.expires,
            };
            
            return NextResponse.json({
              status: 'authenticated',
              user: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role || 'employee',
                type: 'employee'
              },
              diagnostics,
            });
          } else {
            // Expired session
            console.log('Auth Check: Employee session expired:', employeeSession.expires);
            diagnostics.sessionCheck = {
              valid: false,
              type: 'employee',
              reason: 'expired',
              expiredAt: employeeSession.expires,
            };
          }
        } else {
          // Invalid session
          console.log('Auth Check: Employee session not found or missing employee reference');
          diagnostics.sessionCheck = {
            valid: false,
            type: 'employee',
            reason: 'not_found',
          };
        }
      } catch (error) {
        // Error checking employee session
        console.error('Auth Check: Error verifying employee session:', error);
        diagnostics.sessionCheck = {
          valid: false,
          type: 'employee',
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    
    // If employee auth failed, try standard user auth
    if (sessionToken) {
      try {
        console.log('Auth Check: Checking user session:', sessionToken.substring(0, 8) + '...');
        
        const userSession = await prisma.session.findUnique({
          where: { id: sessionToken },
          include: { user: true }
        });
        
        if (userSession && userSession.user) {
          // Check session expiration
          if (userSession.expires > new Date()) {
            const user = userSession.user;
            
            console.log('Auth Check: Found valid user session for:', user.name);
            
            // Valid user session
            diagnostics.sessionCheck = {
              valid: true,
              type: 'user',
              name: user.name,
              email: user.email,
              expires: userSession.expires,
            };
            
            return NextResponse.json({
              status: 'authenticated',
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                type: 'user'
              },
              diagnostics,
            });
          } else {
            // Expired session
            console.log('Auth Check: User session expired:', userSession.expires);
            diagnostics.sessionCheck = {
              valid: false,
              type: 'user',
              reason: 'expired',
              expiredAt: userSession.expires,
            };
          }
        } else {
          // Invalid session
          console.log('Auth Check: User session not found or missing user reference');
          diagnostics.sessionCheck = {
            valid: false,
            type: 'user',
            reason: 'not_found',
          };
        }
      } catch (error) {
        // Error checking user session
        console.error('Auth Check: Error verifying user session:', error);
        diagnostics.sessionCheck = {
          valid: false,
          type: 'user',
          reason: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    
    // If we get here, both auth methods failed or were not attempted
    console.log('Auth Check: No valid session found');
    return NextResponse.json({
      status: 'unauthenticated',
      message: 'No valid session found',
      diagnostics,
    }, { status: 401 });
  } catch (error) {
    console.error('Auth check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Error checking authentication status',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
} 