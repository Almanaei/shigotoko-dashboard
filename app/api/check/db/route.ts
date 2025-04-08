import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Extended timeout for thorough connection testing
    const startTime = Date.now();
    
    try {
      // Test connection
      await prisma.$connect();
      
      // Run a simple query
      const counts = {
        users: await prisma.user.count(),
        employees: await prisma.employee.count(),
        departments: await prisma.department.count(),
        projects: await prisma.project.count(),
      };
      
      // Test a transaction
      const transactionTest = await prisma.$transaction(async (tx) => {
        return {
          success: true,
          counts: {
            tx_users: await tx.user.count(),
            tx_employees: await tx.employee.count(),
          }
        };
      });
      
      // Disconnect cleanly
      await prisma.$disconnect();
      
      const endTime = Date.now();
      
      return createSuccessResponse({
        status: 'success',
        message: 'Database connection is healthy',
        timing: {
          totalMs: endTime - startTime,
        },
        database: {
          url: process.env.DATABASE_URL 
            ? `${process.env.DATABASE_URL.split(':')[0]}:***` // Show only the protocol
            : 'Not configured',
          counts,
          transactionTest,
        }
      });
    } catch (error) {
      // Always ensure we disconnect on error
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.error('Failed to disconnect:', e);
      }
      
      throw error;
    }
  });
} 