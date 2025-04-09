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
    
    console.log('Profile update request for user:', session.user.id, { 
      name, 
      email, 
      hasAvatar: !!avatar,
      avatarLength: avatar ? avatar.length : 0
    });

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
      if (!avatar && !session.user.avatar) {
        updateData.avatar = generateAvatarUrl(name);
        console.log('Generated avatar based on name:', updateData.avatar);
      }
    }
    
    // Handle avatar update if provided
    if (avatar) {
      updateData.avatar = avatar;
      console.log('Using custom avatar, length:', avatar.length);
    }
    
    // Handle email update
    if (email) {
      updateData.email = email;
    }
    
    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    
    // Log the update result
    console.log('User profile updated successfully:', {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      hasAvatar: !!updatedUser.avatar,
      avatarLength: updatedUser.avatar ? updatedUser.avatar.length : 0
    });
    
    // Return the updated user (excluding password)
    const { password, ...userWithoutPassword } = updatedUser;
    
    // Create a response with refreshed session expiration
    const response = NextResponse.json(userWithoutPassword);
    
    // Refresh the session cookie to extend its lifetime
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
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
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