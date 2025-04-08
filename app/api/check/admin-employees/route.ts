import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Find employees with admin positions
    const adminEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { position: { contains: 'admin', mode: 'insensitive' } },
          { position: { contains: 'manager', mode: 'insensitive' } },
          { position: { contains: 'director', mode: 'insensitive' } }
        ]
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also check the User table for admin users (legacy)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { 
          in: ['admin', 'administrator', 'Admin', 'Administrator'] 
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return createSuccessResponse({
      adminEmployees: {
        count: adminEmployees.length,
        items: adminEmployees.map(emp => ({
          id: emp.id,
          name: emp.name,
          position: emp.position,
          email: emp.email,
          department: emp.department?.name || null,
          status: emp.status,
          joinDate: emp.joinDate,
          createdAt: emp.createdAt
        }))
      },
      adminUsers: {
        count: adminUsers.length,
        items: adminUsers,
        note: "Legacy data - User model will be deprecated in favor of Employee model"
      },
      recommendation: "Use the Employee model for all user management going forward."
    });
  });
} 