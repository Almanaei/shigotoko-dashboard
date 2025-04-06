import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Register a new user
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'User' } = await request.json();
    
    console.log('Registration request received for:', { name, email, role });

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // For a real app, hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);
    // For demo purposes, we'll store it as plain text (NEVER DO THIS IN PRODUCTION)
    const hashedPassword = password;

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatar: `/avatars/default-${Math.floor(Math.random() * 5) + 1}.jpg`, // Random default avatar
      },
    });
    
    console.log('User created:', { id: user.id, name: user.name, role: user.role });

    // Generate session token for automatic login
    const sessionToken = uuidv4();
    
    // Store session in database
    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    console.log('Session created with token:', sessionToken);

    // Create response with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json(userWithoutPassword);
    
    // Set the session cookie
    response.cookies.set({
      name: 'session_token',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'strict',
    });
    
    console.log('Registration complete, returning user:', userWithoutPassword);
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 