import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all departments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let whereClause: any = {};
    
    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const departments = await prisma.department.findMany({
      where: whereClause,
      // Limit results for search queries
      ...(search ? { take: 10 } : {}),
    });
    
    return NextResponse.json({ departments, total: departments.length });
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