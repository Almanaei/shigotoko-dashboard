import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling, errors } from '@/lib/api-utils';

// GET all employees
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    
    let whereClause: any = {};
    
    // Add department filter if provided
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
      },
      // Limit results for search queries
      ...(search ? { take: 10 } : {}),
    });
    
    // Format the employees to match the expected structure
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      position: employee.position,
      email: employee.email,
      phone: employee.phone,
      avatar: employee.avatar,
      status: employee.status,
      joinDate: employee.joinDate.toISOString(),
      performance: employee.performance,
      department: employee.department?.name,
      departmentId: employee.departmentId
    }));
    
    return createSuccessResponse({
      employees: formattedEmployees,
      total: formattedEmployees.length
    });
  });
}

// POST a new employee
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.position || !body.departmentId || !body.email || !body.joinDate) {
      return errors.badRequest('Missing required fields', {
        required: ['name', 'position', 'departmentId', 'email', 'joinDate'],
        provided: Object.keys(body)
      });
    }
    
    // Create the employee
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
    
    return createSuccessResponse(newEmployee, 201);
  });
} 