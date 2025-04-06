import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all employees
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const departmentId = searchParams.get('departmentId');
  
  try {
    const whereClause = departmentId ? { departmentId } : {};
    
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
      },
    });
    
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newEmployee = await prisma.employee.create({
      data: {
        name: body.name,
        position: body.position,
        departmentId: body.departmentId,
        email: body.email,
        phone: body.phone || null,
        avatar: body.avatar || null,
        status: body.status || 'active',
        joinDate: new Date(body.joinDate),
        performance: body.performance || 0,
      },
      include: {
        department: true,
      },
    });
    
    // Update employee count in department
    await prisma.department.update({
      where: { id: body.departmentId },
      data: {
        employeeCount: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 