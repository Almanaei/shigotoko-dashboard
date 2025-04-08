import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { generateAvatarUrl } from '@/lib/helpers';

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the current session to authenticate the user
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the user's session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get the profile update data from the request
    const { name, email, avatar } = await request.json();
    
    console.log('Profile update request for user:', session.user.id, { name, email, avatar });

    // Validate input - at least one field should be provided
    if (!name && !email && !avatar) {
      return NextResponse.json(
        { error: 'At least one field (name, email, or avatar) is required' },
        { status: 400 }
      );
    }

    // Prepare update data with only the fields that were provided
    const updateData: any = {};
    
    // Handle name update
    if (name) {
      updateData.name = name;
      
      // If no custom avatar is provided, generate one from the name
      if (!avatar) {
        updateData.avatar = generateAvatarUrl(name);
        console.log('Generated avatar based on name:', updateData.avatar);
      }
    }
    
    // Handle avatar update if provided
    if (avatar) {
      updateData.avatar = avatar;
      console.log('Using custom avatar:', avatar);
    }
    
    // Handle email update
    if (email) {
      // Check if email already exists for another user
      if (email !== session.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.id !== session.user.id) {
          return NextResponse.json(
            { error: 'Email already in use by another user' },
            { status: 409 }
          );
        }
      }
      updateData.email = email;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    console.log('User profile updated:', { id: updatedUser.id, name: updatedUser.name });

    // Return the updated user without the password
    const { password, ...userWithoutPassword } = updatedUser;
    
    // Set a new cookie to extend the session after profile update
    const response = NextResponse.json(userWithoutPassword);
    
    // Update the session cookie to extend its lifetime
    response.cookies.set({
      name: 'session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An error occurred during profile update' },
      { status: 500 }
    );
  }
}

// Get user profile
export async function GET(request: NextRequest) {
  try {
    // Get the current session to authenticate the user
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the user's session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Return the user without the password
    const { password, ...userWithoutPassword } = session.user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred while retrieving the profile' },
      { status: 500 }
    );
  }
} 