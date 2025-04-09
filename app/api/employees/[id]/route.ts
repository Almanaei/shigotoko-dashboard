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
    
    // If employee has password, exclude it from the response
    let responseData = employee;
    if ('password' in employee) {
      const { password, ...employeeWithoutPassword } = employee as any;
      responseData = employeeWithoutPassword;
    }
    
    return createSuccessResponse(responseData);
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
    const isDepartmentChanged = body.department && 
      existingEmployee.departmentId !== body.department;
    
    // Process and validate avatar if present
    let avatarToSave = body.avatar;
    if (body.avatar && body.avatar.startsWith('data:image/')) {
      // Avatar is valid data URL
      console.log('Employee API: Processing image data URL for avatar');
      
      // If exceptionally large, we might reject or compress further
      if (body.avatar.length > 1000000) {  // 1MB
        console.log('Employee API: Avatar is exceptionally large, consider compression');
      }
    } else if (body.avatar) {
      console.log('Employee API: Avatar is not a data URL, accepted as is');
    } else {
      console.log('Employee API: No avatar in request, preserving existing avatar');
      // Important: Don't overwrite existing avatar if none provided
      avatarToSave = undefined;
    }
    
    // Prepare update data with only the fields that were provided
    const updateData: any = {};
    
    // Only include fields that were actually provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.department !== undefined) updateData.departmentId = body.department;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (avatarToSave !== undefined) updateData.avatar = avatarToSave;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.joinDate !== undefined) updateData.joinDate = new Date(body.joinDate);
    if (body.performance !== undefined) updateData.performance = body.performance;
    
    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
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
        where: { id: body.department },
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
          // @ts-ignore - employeeId exists in the Session model but isn't in the types
          employeeId: { not: null }
        }
      });
      
      // If session found and valid, refresh it
      if (session) {
        // Update the session expiration date
        await prisma.session.update({
          where: { id: employeeSessionToken },
          data: {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });
        
        // Re-set the cookie to extend session lifetime
        response.cookies.set({
          name: 'employee-session',
          value: employeeSessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        // Also refresh the auth_type cookie
        response.cookies.set({
          name: 'auth_type',
          value: 'employee',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        console.log('Employee API: Session refreshed successfully');
      } else {
        console.log('Employee API: Session not found, could not refresh');
      }
    }
    
    return response;
  });
}

// DELETE an employee
export async function DELETE(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  return withErrorHandling(async () => {
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true }
    });
    
    if (!employee) {
      return errors.notFound('Employee', id);
    }
    
    // Delete the employee
    await prisma.employee.delete({
      where: { id }
    });
    
    // Decrement the department's employee count
    await prisma.department.update({
      where: { id: employee.departmentId },
      data: {
        employeeCount: {
          decrement: 1
        }
      }
    });
    
    return createSuccessResponse({ message: `Employee ${id} deleted successfully` });
  });
} 