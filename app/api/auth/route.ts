import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Login route
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password (in a real app, you'd use bcrypt to compare hashed passwords)
    // For simplicity in this demo, we'll assume the password is stored in plain text
    // In production, always use hashed passwords!
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = user.password === password; // DEMO ONLY - NEVER DO THIS IN PRODUCTION

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = uuidv4();
    
    // Store session in database (for a real app)
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
      name: 'session_token',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}

// Logout route
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (sessionToken) {
      // Delete session from database
      await prisma.session.delete({
        where: { id: sessionToken },
      }).catch(() => {
        // Ignore errors if session doesn't exist
      });
    }
    
    // Create a response and clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

// Get current session user
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(null);
    }
    
    // Find session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });
    
    // Check if session exists and is valid
    if (!session || session.expires < new Date()) {
      const response = NextResponse.json(null);
      response.cookies.delete('session_token');
      return response;
    }
    
    // Return user data
    const { password: _, ...userWithoutPassword } = session.user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(null);
  }
} 