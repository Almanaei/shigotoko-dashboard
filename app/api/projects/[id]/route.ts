import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PrismaClient, Prisma } from '@prisma/client';

// GET a single project by ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            employee: true
          }
        },
        tasks: true,
        logs: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Error fetching project with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// UPDATE a project
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
  try {
    const body = await request.json();
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true
      }
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Start a transaction
    const updatedProject = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the project
      const project = await tx.project.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          description: body.description !== undefined ? body.description : undefined,
          status: body.status !== undefined ? body.status : undefined,
          progress: body.progress !== undefined ? body.progress : undefined,
          startDate: body.startDate !== undefined ? new Date(body.startDate) : undefined,
          endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
          budget: body.budget !== undefined ? body.budget : undefined,
          client: body.client !== undefined ? body.client : undefined,
          priority: body.priority !== undefined ? body.priority : undefined,
        }
      });
      
      // Update members if provided
      if (body.memberIds && Array.isArray(body.memberIds)) {
        // Get current member IDs
        const currentMemberIds = existingProject.members.map((m: { employeeId: string }) => m.employeeId);
        
        // Find IDs to remove and add
        const idsToRemove = currentMemberIds.filter((id: string) => !body.memberIds.includes(id));
        const idsToAdd = body.memberIds.filter((id: string) => !currentMemberIds.includes(id));
        
        // Remove members not in the new list
        if (idsToRemove.length > 0) {
          await tx.projectsOnEmployees.deleteMany({
            where: {
              projectId: id,
              employeeId: {
                in: idsToRemove
              }
            }
          });
        }
        
        // Add new members
        if (idsToAdd.length > 0) {
          const memberConnections = idsToAdd.map((employeeId: string) => ({
            employeeId,
            projectId: id,
            role: 'member',
          }));
          
          await tx.projectsOnEmployees.createMany({
            data: memberConnections
          });
        }
      }
      
      // Log the update
      await tx.projectLog.create({
        data: {
          action: 'update',
          description: `Project "${project.name}" was updated`,
          projectId: id,
        }
      });
      
      // Return updated project with members
      return tx.project.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              employee: true
            }
          },
          tasks: true
        }
      });
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update project', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE a project
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  // Properly extract params to avoid the Next.js warning
  const { id } = context.params;
  
  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Delete the project and related records in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete associated task records
      await tx.task.deleteMany({
        where: { projectId: id }
      });
      
      // Delete project-employee relationships
      await tx.projectsOnEmployees.deleteMany({
        where: { projectId: id }
      });
      
      // Delete project logs
      await tx.projectLog.deleteMany({
        where: { projectId: id }
      });
      
      // Finally delete the project
      await tx.project.delete({
        where: { id }
      });
    });
    
    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting project with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 