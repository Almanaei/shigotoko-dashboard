import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET a single department by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        employees: true,
      },
    });
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(department);
  } catch (error) {
    console.error(`Error fetching department with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// UPDATE a department
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: params.id }
    });
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        color: body.color !== undefined ? body.color : undefined,
      },
    });
    
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error(`Error updating department with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE a department
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: { employees: true }
    });
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    // Check if department has employees
    if (department.employees.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with employees. Please reassign or delete employees first.' },
        { status: 400 }
      );
    }
    
    // Delete the department
    await prisma.department.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Department deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting department with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
} 