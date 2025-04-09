import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Share document with users
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Correctly handle params in an async context by awaiting
    const { id: documentId } = params;
    
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
      where: { id: documentId },
      include: { 
        uploadedBy: true,
        sharedWith: true 
      },
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

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (document.uploadedById !== employee.id) {
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

    // Verify that all userIds exist as employees
    const employeeCount = await prisma.employee.count({
      where: {
        id: {
          in: userIds
        }
      }
    });

    if (employeeCount !== userIds.length) {
      return NextResponse.json(
        { error: 'One or more employee IDs are invalid' },
        { status: 400 }
      );
    }

    // First, disconnect all existing relations
    await prisma.document.update({
      where: { id: documentId },
      data: {
        sharedWith: {
          disconnect: document.sharedWith.map(emp => ({ id: emp.id }))
        }
      }
    });

    // Then connect the new relations
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        sharedWith: {
          connect: userIds.map(id => ({ id }))
        }
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
      { error: `Failed to share document: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 