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
    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    // Create a response with user data
    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json(userWithoutPassword);
    
    // Set the cookie in the response
    response.cookies.set({
      name: 'session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
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
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    console.log('GET /api/auth - Session token exists:', !!sessionToken);
    
    if (!sessionToken) {
      console.log('GET /api/auth - No session token found in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('GET /api/auth - Looking up session with token:', sessionToken.substring(0, 8) + '...');
    
    // Find session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });
    
    console.log('GET /api/auth - Session found:', !!session);
    
    // Check if session exists and is not expired
    if (!session) {
      console.log('GET /api/auth - Session not found in database');
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
      response.cookies.delete('session-token');
      return response;
    }
    
    if (session.expires < new Date()) {
      console.log('GET /api/auth - Session expired, expires:', session.expires, 'current time:', new Date());
      // Clear expired cookie
      const response = NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
      response.cookies.delete('session-token');
      return response;
    }
    
    // Session is valid, return user data (excluding password)
    const { password, ...userWithoutPassword } = session.user;
    console.log('GET /api/auth - Returning authenticated user:', userWithoutPassword.name);
    return NextResponse.json(userWithoutPassword);
    
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
      try {
        // Delete session from database
        await prisma.session.delete({
          where: { id: sessionToken },
        });
      } catch (error) {
        console.log('Session not found in database or deletion failed:', error);
        // Continue with cookie deletion anyway
      }
    }
    
    // Clear cookie regardless of whether session existed
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session-token');
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
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