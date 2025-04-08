import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Employee authentication endpoint
 * This is a new authentication approach that uses the Employee model instead of User
 */

// Login route for employees
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Employee login attempt with email:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find employee by email
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: {
        department: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('Employee found by email?', !!employee, employee ? `Name: ${employee.name}, Position: ${employee.position}` : 'No employee found');
    
    // Check if employee exists and has a password set
    if (!employee || !employee.password) {
      console.log('Authentication failed: invalid credentials or no password set');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Simple password check for now (in real app, use bcrypt.compare)
    // This will be replaced with proper hashing once we migrate fully
    if (password !== employee.password) {
      console.log('Authentication failed: password mismatch');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate session token
    const sessionToken = uuidv4();
    
    // Store session in database
    try {
      console.log('Employee Login: Creating session in database');
      
      // First, delete any existing sessions for this employee to prevent duplicates
      await prisma.session.deleteMany({
        where: { employeeId: employee.id }
      });
      
      // Now create a new session
      await prisma.session.create({
        data: {
          id: sessionToken,
          employeeId: employee.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          userId: ''  // Empty placeholder since userId is still required in schema
        },
      });
      
      console.log('Employee Login: Session successfully created in database');
    } catch (error) {
      console.error('Employee Login: Error creating session in database:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    // Create a response with employee data
    const { password: _, ...employeeWithoutPassword } = employee;
    const response = NextResponse.json({
      ...employeeWithoutPassword,
      departmentName: employee.department?.name || null
    });
    
    // Set the cookie in the response
    response.cookies.set({
      name: 'employee-session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Also set a non-HttpOnly cookie with the authentication type for client-side detection
    response.cookies.set({
      name: 'auth_type',
      value: 'employee',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    console.log('Employee Login successful for:', employee.name, employee.email);
    return response;
    
  } catch (error) {
    console.error('Employee Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Get current employee from session token
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('employee-session')?.value;
    
    if (!sessionToken) {
      console.log('GET /api/auth/employee - No session token found in cookies');
      console.log('GET /api/auth/employee - All cookies:', request.cookies.getAll().map(c => c.name));
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'no_session_token' },
        { status: 401 }
      );
    }
    
    // Find session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: {
        employee: {
          include: {
            department: true
          }
        }
      },
    });
    
    if (!session || !session.employee) {
      console.log('GET /api/auth/employee - Session not found or no employee linked');
      const response = NextResponse.json(
        { error: 'Session not found', reason: 'invalid_session' },
        { status: 401 }
      );
      response.cookies.delete('employee-session');
      return response;
    }
    
    // Check if session is expired
    if (session.expires < new Date()) {
      console.log('GET /api/auth/employee - Session expired');
      const response = NextResponse.json(
        { error: 'Session expired', reason: 'expired_session' },
        { status: 401 }
      );
      response.cookies.delete('employee-session');
      
      // Also delete the expired session from database
      await prisma.session.delete({
        where: { id: session.id }
      });
      
      return response;
    }
    
    // Session is valid, return employee data (excluding password)
    const { password, ...employeeWithoutPassword } = session.employee;
    
    // Re-set the cookie to extend session lifetime
    const response = NextResponse.json(employeeWithoutPassword);
    response.cookies.set({
      name: 'employee-session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Get current employee error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Logout route
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('employee-session')?.value;
    
    if (sessionToken) {
      // Delete session from database
      await prisma.session.delete({
        where: { id: sessionToken }
      }).catch(() => {
        // Ignore errors - session might not exist
      });
    }
    
    // Clear cookie regardless of whether session exists in DB
    const response = NextResponse.json({ success: true });
    response.cookies.delete('employee-session');
    
    return response;
  } catch (error) {
    console.error('Employee logout error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 