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
    
    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        position: body.position !== undefined ? body.position : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
        status: body.status !== undefined ? body.status : undefined,
        joinDate: body.joinDate !== undefined ? new Date(body.joinDate) : undefined,
        performance: body.performance !== undefined ? body.performance : undefined,
      },
      include: {
        department: true,
      },
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
    const response = NextResponse.json(updatedEmployee);
    
    // Get the current employee session token
    const employeeSessionToken = request.cookies.get('employee-session')?.value;
    
    // If we have an employee session, refresh it
    if (employeeSessionToken) {
      console.log('Employee API: Refreshing employee session after profile update');
      
      response.cookies.set({
        name: 'employee-session',
        value: employeeSessionToken,
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