import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Auth Check API
 * Diagnostic endpoint to check authentication status and provide detailed information
 * about session state and user data for debugging authentication issues.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Auth check endpoint called');
    
    // Get all cookies for diagnostic purposes
    const allCookies = request.cookies.getAll().map(c => c.name);
    
    // Check for both authentication methods
    const userSessionToken = 
      request.cookies.get('session-token')?.value || 
      request.cookies.get('session_token')?.value;
    
    const employeeSessionToken = request.cookies.get('employee-session')?.value;
    
    console.log('Auth check: Cookies found:', {
      userSessionToken: !!userSessionToken,
      employeeSessionToken: !!employeeSessionToken,
      allCookies
    });
    
    // Diagnostics object to return
    const diagnostics: Record<string, any> = {
      cookies: allCookies,
      userSessionExists: !!userSessionToken,
      employeeSessionExists: !!employeeSessionToken,
      timestamp: new Date().toISOString()
    };
    
    // Try to get user data from standard session
    let userData = null;
    let authMethod = null;
    
    if (userSessionToken) {
      try {
        console.log('Auth check: Looking up user session with token:', userSessionToken.substring(0, 8) + '...');
        
        const session = await prisma.session.findUnique({
          where: { id: userSessionToken },
          include: { user: true },
        });
        
        if (session && session.user) {
          if (session.expires > new Date()) {
            const { password, ...userWithoutPassword } = session.user;
            userData = userWithoutPassword;
            authMethod = 'standard';
            console.log('Auth check: Valid user session found for:', userData.name);
          } else {
            console.log('Auth check: User session expired');
            diagnostics.userSessionExpired = true;
          }
        } else {
          console.log('Auth check: User session not found in database');
          diagnostics.userSessionInvalid = true;
        }
      } catch (error) {
        console.error('Auth check: Error looking up user session:', error);
        diagnostics.userSessionError = (error as Error).message;
      }
    }
    
    // If user auth failed, try checking for employee in database directly
    if (!userData && employeeSessionToken) {
      try {
        console.log('Auth check: Looking up employee session with token:', employeeSessionToken.substring(0, 8) + '...');
        
        // Find session in database
        const session = await prisma.session.findUnique({
          where: { id: employeeSessionToken },
        });
        
        if (session && session.expires > new Date()) {
          // If session is valid, try to find the employee by checking if employeeId exists in the session
          if ('employeeId' in session && session.employeeId) {
            const employee = await prisma.employee.findUnique({
              where: { id: session.employeeId as string },
              include: { department: true }
            });
            
            if (employee) {
              // If password exists on employee, exclude it
              if ('password' in employee) {
                const { password, ...employeeWithoutPassword } = employee as any;
                userData = employeeWithoutPassword;
              } else {
                userData = employee;
              }
              authMethod = 'employee';
              console.log('Auth check: Valid employee found for employeeId:', session.employeeId);
            }
          }
        } else {
          console.log('Auth check: Employee session expired or not found');
          diagnostics.employeeSessionInvalid = true;
        }
      } catch (error) {
        console.error('Auth check: Error looking up employee session:', error);
        diagnostics.employeeSessionError = (error as Error).message;
      }
    }
    
    // Return detailed diagnostic information
    const status = userData ? 'authenticated' : 'unauthenticated';
    
    return NextResponse.json({
      status,
      authMethod,
      user: userData,
      diagnostics
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to check authentication status',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 