import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Standardized API error response
 */
export interface ApiError {
  error: string;
  details?: string | object;
  code?: string;
  status: number;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string, 
  status: number = 500, 
  details?: string | object,
  code?: string
): NextResponse<ApiError> {
  console.error(`API Error [${status}${code ? ` ${code}` : ''}]: ${message}`, details || '');
  
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      ...(code && { code }),
      status,
    },
    { status }
  );
}

/**
 * Standard error responses
 */
export const errors = {
  notFound: (resource: string, id?: string) => 
    createErrorResponse(
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      404,
      undefined,
      'NOT_FOUND'
    ),
    
  unauthorized: (reason?: string) => 
    createErrorResponse(
      'Unauthorized: ' + (reason || 'You need to be logged in'),
      401,
      undefined,
      'UNAUTHORIZED'
    ),
    
  forbidden: (reason?: string) => 
    createErrorResponse(
      'Forbidden: ' + (reason || 'You do not have permission to perform this action'),
      403,
      undefined,
      'FORBIDDEN'
    ),
    
  badRequest: (reason: string, details?: object) => 
    createErrorResponse(
      `Bad request: ${reason}`,
      400,
      details,
      'BAD_REQUEST'
    ),
    
  serverError: (error: Error) => 
    createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error.stack : error.message,
      'SERVER_ERROR'
    ),
    
  databaseError: (error: Error) => 
    createErrorResponse(
      'Database error',
      500,
      process.env.NODE_ENV === 'development' ? error.stack : error.message,
      'DATABASE_ERROR'
    ),
    
  validationError: (details: object) => 
    createErrorResponse(
      'Validation error',
      422,
      details,
      'VALIDATION_ERROR'
    ),
    
  connectionError: (error: Error) => 
    createErrorResponse(
      'Database connection error',
      503,
      {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        dbUrl: process.env.DATABASE_URL ? 'Configured' : 'Missing',
      },
      'CONNECTION_ERROR'
    )
};

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Ensure database connection before executing a handler
 * This helps recover from connection issues
 */
async function ensureDatabaseConnection() {
  try {
    // Check if we can query the database
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database connection check failed, attempting reconnect...', error);
    
    try {
      // Try to reconnect
      await prisma.$disconnect();
      await prisma.$connect();
      
      // Verify connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('Successfully reconnected to database');
      return true;
    } catch (reconnectError) {
      console.error('Failed to reconnect to database', reconnectError);
      throw reconnectError;
    }
  }
}

/**
 * Try-catch wrapper for API route handlers with database connection handling
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  customErrorHandler?: (error: any) => NextResponse<ApiError>
): Promise<NextResponse<T | ApiError>> {
  try {
    // Ensure database connection before proceeding
    await ensureDatabaseConnection();
    
    return await handler() as NextResponse<T>;
  } catch (error: any) {
    // Use custom error handler if provided
    if (customErrorHandler) {
      return customErrorHandler(error);
    }
    
    // Check for connection-related errors
    if (
      error.message?.includes('connect') || 
      error.message?.includes('connection') ||
      error.code === 'P1001' || // Prisma can't reach database server
      error.code === 'P1002' // Database server already in use
    ) {
      return errors.connectionError(error);
    }
    
    // Default error handling
    if (error.code === 'P2025') {
      // Prisma record not found error
      return errors.notFound('Record');
    }
    
    if (error.code?.startsWith('P2')) {
      // Other Prisma errors
      return errors.databaseError(error);
    }
    
    return errors.serverError(error);
  }
} 