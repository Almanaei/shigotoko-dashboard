import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET all projects
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  
  try {
    const whereClause = status ? { status } : {};
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            employee: true
          }
        }
      },
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Start a transaction
    const newProject = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          name: body.name,
          description: body.description || null,
          status: body.status || 'pending',
          progress: body.progress || 0,
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          budget: body.budget || null,
          client: body.client || null,
          priority: body.priority || 'medium',
        }
      });
      
      // Add members to the project if specified
      if (body.memberIds && Array.isArray(body.memberIds) && body.memberIds.length > 0) {
        const memberConnections = body.memberIds.map((employeeId: string) => ({
          employeeId,
          projectId: project.id,
          role: 'member',
        }));
        
        await tx.projectsOnEmployees.createMany({
          data: memberConnections
        });
      }
      
      // Create project log entry
      await tx.projectLog.create({
        data: {
          action: 'create',
          description: `Project "${project.name}" was created`,
          projectId: project.id,
        }
      });
      
      // Return project with members
      return tx.project.findUnique({
        where: { id: project.id },
        include: {
          members: {
            include: {
              employee: true
            }
          }
        }
      });
    });
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 