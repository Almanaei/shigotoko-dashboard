import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newDepartment = await prisma.department.create({
      data: {
        name: body.name,
        description: body.description || null,
        employeeCount: 0, // Start with zero employees
        color: body.color || null,
      }
    });
    
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 