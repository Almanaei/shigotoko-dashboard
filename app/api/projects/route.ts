import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { getCurrentAuthenticatedEntity } from '@/lib/auth';
import { notifyNewProject } from '@/lib/notifications';

// GET all projects
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const whereClause = status ? { status } : {};
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                position: true,
                avatar: true,
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform to a more convenient structure for the frontend
    const transformedProjects = projects.map(project => ({
      ...project,
      teamMembers: project.members.map(member => member.employeeId),
      // Include the full employee objects for the client as well for convenience
      teamMembersDetails: project.members.map(member => member.employee),
      // Remove the raw members array to avoid redundancy
      members: undefined
    }));
    
    return createSuccessResponse(transformedProjects);
  });
}

// POST a new project
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get current user
    const { entity, type } = await getCurrentAuthenticatedEntity(request);
    
    if (!entity) {
      return errors.unauthorized('You must be logged in to create a project');
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.startDate || !body.status || !body.priority) {
      return errors.badRequest('Missing required fields', {
        required: ['name', 'startDate', 'status', 'priority'],
        provided: Object.keys(body),
      });
    }
    
    // Check if teamMembers is provided as an array
    if (body.teamMembers && !Array.isArray(body.teamMembers)) {
      return errors.badRequest('teamMembers must be an array of employee IDs');
    }
    
    // Create the project first
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status,
        progress: body.progress || 0,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        budget: body.budget || null,
        client: body.client || null,
        priority: body.priority,
      },
    });
    
    // Handle team members if provided
    let updatedProject = project;
    if (body.teamMembers && body.teamMembers.length > 0) {
      // Create the project-employee relationships
      await Promise.all(
        body.teamMembers.map((employeeId: string) =>
          prisma.projectsOnEmployees.create({
            data: {
              projectId: project.id,
              employeeId,
              role: 'member', // Default role
            },
          })
        )
      );
      
      // Get the updated project with members
      updatedProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          members: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  position: true,
                  avatar: true,
                }
              }
            }
          },
        },
      }) as any;
      
      // Create a project log entry for the creation
      await prisma.projectLog.create({
        data: {
          projectId: project.id,
          action: 'Project Created',
          description: `Project "${body.name}" was created and team members were assigned`,
          timestamp: new Date(),
        },
      });
      
      // Send notifications to team members
      try {
        await notifyNewProject(
          project.id,
          project.name,
          entity.id,
          body.teamMembers
        );
      } catch (error) {
        console.error('Error sending project notifications:', error);
        // Continue execution even if notifications fail
      }
    } else {
      // Create a project log entry for the creation without team members
      await prisma.projectLog.create({
        data: {
          projectId: project.id,
          action: 'Project Created',
          description: `Project "${body.name}" was created`,
          timestamp: new Date(),
        },
      });
    }
    
    // Transform the response the same way as in the GET handler
    const transformedProject = {
      ...updatedProject,
      teamMembers: updatedProject.members?.map((member: any) => member.employeeId) || [],
      teamMembersDetails: updatedProject.members?.map((member: any) => member.employee) || [],
      members: undefined
    };
    
    return createSuccessResponse(transformedProject, 201);
  });
} 