import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Share document with users
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { uploadedBy: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user is the uploader
    const employee = await prisma.employee.findFirst({
      where: { email: session.user.email },
    });

    if (!employee || document.uploadedById !== employee.id) {
      return NextResponse.json(
        { error: 'Unauthorized to share this document' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'userIds must be an array' },
        { status: 400 }
      );
    }

    // Update document in database to share with users
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        sharedWith: {
          set: userIds.map(id => ({ id })),
        },
      },
      include: {
        project: true,
        uploadedBy: true,
        sharedWith: true,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error sharing document:', error);
    return NextResponse.json(
      { error: 'Failed to share document' },
      { status: 500 }
    );
  }
} 