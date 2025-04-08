import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Login route
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt with email:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    console.log('User found by email?', !!user, user ? `Name: ${user.name}, Email: ${user.email}` : 'No user found');
    
    // Check if user exists and password is correct
    if (!user || password !== user.password) { // In a real app, use bcrypt.compare
      console.log('Authentication failed: invalid credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate session token
    const sessionToken = uuidv4();
    
    // Store session in database
    try {
      console.log('Login: Attempting to create session in database with token:', sessionToken.substring(0, 8) + '...');
      
      // First, delete any existing sessions for this user to prevent duplicates
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });
      
      // Now create a new session
      await prisma.session.create({
        data: {
          id: sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      
      console.log('Login: Session successfully created in database');
    } catch (error) {
      console.error('Login: Error creating session in database:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    // Create a response with user data
    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json(userWithoutPassword);
    
    // Set the cookie in the response
    response.cookies.set({
      name: 'session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    });
    
    console.log('Login: Set session-token cookie:', {
      name: 'session-token',
      value: sessionToken.substring(0, 8) + '...',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: '30 days',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    });
    
    console.log('Login successful for user:', user.name, user.email);
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Get current user (from session token)
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie - using only one standard name
    const sessionToken = request.cookies.get('session-token')?.value;
    
    console.log('GET /api/auth - Session token exists:', !!sessionToken);
    console.log('GET /api/auth - All cookies:', request.cookies.getAll().map(c => `${c.name}`));
    
    if (!sessionToken) {
      console.log('GET /api/auth - No session token found in cookies');
      return NextResponse.json(
        { error: 'Not authenticated', reason: 'no_session_token' },
        { status: 401 }
      );
    }
    
    console.log('GET /api/auth - Looking up session with token:', sessionToken.substring(0, 8) + '...');
    
    // Find session
    let session;
    try {
      session = await prisma.session.findUnique({
        where: { id: sessionToken },
        include: { user: true },
      });
      
      console.log('GET /api/auth - Session found:', !!session);
      
      if (!session) {
        // No session found - clear invalid cookie
        console.log('GET /api/auth - Session not found in database');
        const response = NextResponse.json(
          { error: 'Session not found', reason: 'invalid_session' },
          { status: 401 }
        );
        response.cookies.delete('session-token');
        return response;
      }
    } catch (error) {
      console.error('GET /api/auth - Error looking up session:', error);
      return NextResponse.json(
        { error: 'Database error when looking up session', reason: 'database_error' },
        { status: 500 }
      );
    }
    
    // Check if session is expired
    if (session.expires < new Date()) {
      console.log('GET /api/auth - Session expired, expires:', session.expires, 'current time:', new Date());
      // Clear expired cookie
      const response = NextResponse.json(
        { error: 'Session expired', reason: 'expired_session' },
        { status: 401 }
      );
      response.cookies.delete('session-token');
      
      // Also delete the expired session from database
      try {
        await prisma.session.delete({
          where: { id: session.id }
        });
        console.log('GET /api/auth - Deleted expired session from database');
      } catch (dbError) {
        console.error('GET /api/auth - Error deleting expired session:', dbError);
      }
      
      return response;
    }
    
    // Session is valid, return user data (excluding password)
    const { password, ...userWithoutPassword } = session.user;
    console.log('GET /api/auth - Returning authenticated user:', userWithoutPassword.name);
    
    // For extra security, refresh the session token on successful authentication
    const response = NextResponse.json(userWithoutPassword);
    
    // Re-set the cookie to extend session lifetime
    response.cookies.set({
      name: 'session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    });
    
    return response;
    
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Logout (delete session)
export async function DELETE(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (sessionToken) {
      console.log('Logout: Session token found, deleting session from database', sessionToken.substring(0, 8) + '...');
      
      try {
        // Delete the session from the database
        await prisma.session.delete({
          where: { id: sessionToken },
        });
      } catch (error) {
        console.log('Logout: Session not found in database or error during deletion:', error);
        // Continue with cookie deletion even if database deletion fails
      }
    } else {
      console.log('Logout: No session token found in cookies, nothing to delete');
    }
    
    // Create a response to clear the cookie
    const response = NextResponse.json({ success: true });
    
    // Clear the cookie
    response.cookies.delete('session-token');
    
    console.log('Logout: Session token cookie cleared');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during logout' },
      { status: 500 }
    );
  }
}

// Update user information (e.g. role)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json();
    
    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check authorization (optional - in a real app you'd check admin privileges here)
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the user to update
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user with provided fields (only role for now)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: role || existingUser.role,
      },
    });
    
    console.log(`User ${updatedUser.name} role updated to: ${updatedUser.role}`);
    
    // Return updated user (excluding password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 