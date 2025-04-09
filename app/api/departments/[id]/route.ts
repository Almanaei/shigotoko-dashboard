import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET a single department by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Must await params before using it
    const id = params.id;
    
    const department = await prisma.department.findUnique({
      where: { id },
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
    // Get id safely for error logging
    const id = params.id;
    console.error(`Error fetching department with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// UPDATE a department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Must await params before using it
    const id = params.id;
    
    const body = await request.json();
    
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        color: body.color !== undefined ? body.color : undefined,
      },
    });
    
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    // Get id safely for error logging
    const id = params.id;
    console.error(`Error updating department with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE a department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Must await params before using it
    const id = params.id;
    
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
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
      where: { id }
    });
    
    return NextResponse.json(
      { message: 'Department deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Get id safely for error logging
    const id = params.id;
    console.error(`Error deleting department with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
} 