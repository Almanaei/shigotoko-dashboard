import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Get all documents or filter by project
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');

    // Build filter conditions
    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (fileType && fileType !== 'all') {
      where.fileType = { contains: fileType, mode: 'insensitive' };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Fetch documents from database
    const documents = await prisma.document.findMany({
      where,
      include: {
        project: true,
        uploadedBy: true,
        sharedWith: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// Upload a new document
export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const projectId = formData.get('projectId') as string;
    const tags = formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [];
    const sharedWith = formData.get('sharedWith') ? (formData.get('sharedWith') as string).split(',').map(id => id.trim()) : [];

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Get employee ID from user
    const employee = await prisma.employee.findFirst({
      where: { email: session.user.email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    // Create document in database
    const document = await prisma.document.create({
      data: {
        name: name || file.name,
        fileType: file.type,
        size: file.size,
        url: `/uploads/${fileName}`,
        description: description || null,
        tags: tags,
        projectId: projectId || null,
        uploadedById: employee.id,
        sharedWith: {
          connect: sharedWith.map(id => ({ id })),
        },
      },
      include: {
        project: true,
        uploadedBy: true,
        sharedWith: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
} 