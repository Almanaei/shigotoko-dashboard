import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET a single employee by ID
export async function GET(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(employee);
  } catch (error) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// UPDATE an employee
export async function PUT(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  try {
    const body = await request.json();
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true }
    });
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
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
    
    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error(`Error updating employee with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update employee', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE an employee
export async function DELETE(request: NextRequest, { params }: Params) {
  const id = params.id;
  
  try {
    // Check if employee exists and get department ID
    const employee = await prisma.employee.findUnique({
      where: { id }
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
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
    
    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting employee with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
} 