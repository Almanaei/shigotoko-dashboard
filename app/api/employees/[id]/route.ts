import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';
import { cookies } from 'next/headers';

interface Params {
  params: {
    id: string;
  };
}

// GET a single employee by ID
export async function GET(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });
    
    if (!employee) {
      return errors.notFound('Employee', id);
    }
    
    return createSuccessResponse(employee);
  });
}

// UPDATE an employee
export async function PUT(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    const body = await request.json();
    
    console.log(`Employee API: Update request for ID: ${id}`, {
      fields: Object.keys(body),
      hasAvatar: !!body.avatar,
      avatarType: body.avatar ? (
        body.avatar.startsWith('data:') ? 'data:URL' : 
        body.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
      ) : 'None',
      avatarLength: body.avatar ? body.avatar.length : 0
    });
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true }
    });
    
    if (!existingEmployee) {
      return errors.notFound('Employee', id);
    }
    
    // Check if department is being changed
    const isDepartmentChanged = body.departmentId && 
      existingEmployee.departmentId !== body.departmentId;
    
    // Process and validate avatar if present
    let avatarToSave = body.avatar;
    if (body.avatar && body.avatar.startsWith('data:image/')) {
      // Avatar is valid data URL
      console.log('Employee API: Processing image data URL for avatar');
      
      // If exceptionally large, we might reject or compress further
      if (body.avatar.length > 1000000) {  // 1MB
        console.log('Employee API: Avatar is exceptionally large, may reject');
      }
    } else if (body.avatar) {
      console.log('Employee API: Avatar is not a data URL, accepted as is');
    } else {
      console.log('Employee API: No avatar in request');
    }
    
    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        position: body.position !== undefined ? body.position : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        avatar: avatarToSave !== undefined ? avatarToSave : undefined,
        status: body.status !== undefined ? body.status : undefined,
        joinDate: body.joinDate !== undefined ? new Date(body.joinDate) : undefined,
        performance: body.performance !== undefined ? body.performance : undefined,
      },
      include: {
        department: true,
      },
    });
    
    console.log(`Employee API: Update successful for ID: ${id}`, {
      name: updatedEmployee.name,
      hasAvatar: !!updatedEmployee.avatar,
      avatarType: updatedEmployee.avatar ? (
        updatedEmployee.avatar.startsWith('data:') ? 'data:URL' : 
        updatedEmployee.avatar.startsWith('http') ? 'HTTP URL' : 'Other'
      ) : 'None',
      avatarLength: updatedEmployee.avatar ? updatedEmployee.avatar.length : 0
    });
    
    // Update department employee counts if department was changed
    if (isDepartmentChanged) {
      // Decrement old department count
      await prisma.department.update({
        where: { id: existingEmployee.departmentId },
        data: {
          employeeCount: {
            decrement: 1
          }
        }
      });
      
      // Increment new department count
      await prisma.department.update({
        where: { id: body.departmentId },
        data: {
          employeeCount: {
            increment: 1
          }
        }
      });
    }
    
    // Create a proper response with refreshed session cookies
    // If employee has password, exclude it from the response
    let responseData = updatedEmployee;
    if ('password' in updatedEmployee) {
      const { password, ...employeeWithoutPassword } = updatedEmployee as any;
      responseData = employeeWithoutPassword;
    }
    
    const response = NextResponse.json(responseData);
    
    // Get the current employee session token
    const employeeSessionToken = request.cookies.get('employee-session')?.value;
    
    // If we have an employee session, refresh it
    if (employeeSessionToken) {
      console.log('Employee API: Refreshing employee session after profile update');
      
      // First attempt to find the current session to verify it's still valid
      const session = await prisma.session.findFirst({
        where: { 
          id: employeeSessionToken,
          // Check if this is an employee session by looking for non-null employeeId
          // Use a type assertion since Prisma doesn't recognize this in the type
          // @ts-ignore - employeeId exists in the Session model but isn't in the types
          employeeId: { not: null }
        }
      });
      
      // If session not found or expired, create a new one
      let effectiveToken = employeeSessionToken;
      if (!session || session.expires < new Date()) {
        console.log('Employee API: Session expired or not found, creating new session');
        
        // Delete any existing session with this ID
        if (session) {
          await prisma.session.delete({ where: { id: employeeSessionToken } });
        }
        
        // Create a new session
        const newSession = await prisma.session.create({
          data: {
            id: employeeSessionToken, // Reuse the same token ID
            // @ts-ignore - employeeId exists in the Session model but isn't in the types
            employeeId: id,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });
        
        effectiveToken = newSession.id;
        console.log('Employee API: Created new session with token:', effectiveToken.substring(0, 8) + '...');
      } else {
        // Update the expiration date of the existing session
        await prisma.session.update({
          where: { id: employeeSessionToken },
          data: { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        });
        console.log('Employee API: Extended existing session expiration');
      }
      
      response.cookies.set({
        name: 'employee-session',
        value: effectiveToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      
      // Also ensure the auth_type cookie is set
      response.cookies.set({
        name: 'auth_type',
        value: 'employee',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }
    
    return response;
  });
}

// DELETE an employee
export async function DELETE(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    // Check if employee exists and get department ID
    const employee = await prisma.employee.findUnique({
      where: { id }
    });
    
    if (!employee) {
      return errors.notFound('Employee', id);
    }
    
    // Delete the employee
    await prisma.employee.delete({
      where: { id }
    });
    
    // Update department employee count
    await prisma.department.update({
      where: { id: employee.departmentId },
      data: {
        employeeCount: {
          decrement: 1
        }
      }
    });
    
    return createSuccessResponse({ message: 'Employee deleted successfully' });
  });
} 