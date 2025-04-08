import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, errors, withErrorHandling } from '@/lib/api-utils';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return errors.forbidden('Environment check is only available in development mode');
    }
    
    // Get environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlStart: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL?.split(':')[0]}:${process.env.DATABASE_URL?.split(':')[1]}:****` 
        : 'Not set',
      platform: process.platform,
      envVars: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')),
    };
    
    // Check database connection
    let dbStatus = 'Unknown';
    let dbDetails = {};
    
    try {
      // Test basic connection
      await prisma.$connect();
      dbStatus = 'Connected';
      
      // Get database tables and counts
      const models = [
        'user', 'session', 'employee', 'department',
        'project', 'task', 'message', 'notification'
      ];
      
      const counts = await Promise.all(
        models.map(async (model) => {
          try {
            // Use dynamic method to count records in each model
            const count = await (prisma as any)[model].count();
            return { model, count, status: 'ok' };
          } catch (e) {
            return { model, count: 0, status: 'error', error: (e as Error).message };
          }
        })
      );
      
      dbDetails = {
        counts,
        transactionTest: await testTransaction(),
      };
    } catch (error) {
      dbStatus = 'Error';
      dbDetails = {
        error: (error as Error).message,
        suggestion: 'Check that PostgreSQL is running and DATABASE_URL is correct',
      };
    } finally {
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.error('Error disconnecting from database:', e);
      }
    }
    
    // Get .env file info (redacted)
    let envFileContent = 'Not accessible';
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        // Read .env file but redact sensitive values
        envFileContent = fs.readFileSync(envPath, 'utf8')
          .split('\n')
          .map(line => {
            if (line.includes('=')) {
              // Only show variable names, not values
              const parts = line.split('=');
              if (parts[0].includes('DATABASE_URL')) {
                // Show schema part of database URL
                const urlParts = parts[1].match(/(["']?)(.*?):\/\/(.*?):(.*?)@(.*?)(\/.*?)(["']?)$/);
                if (urlParts) {
                  return `${parts[0]}=${parts[1].charAt(0)}${urlParts[2]}://${urlParts[3]}:****@${urlParts[5]}${urlParts[6]}${parts[1].charAt(parts[1].length-1)}`;
                }
              }
              return `${parts[0]}=[REDACTED]`;
            }
            return line;
          })
          .join('\n');
      }
    } catch (error) {
      envFileContent = `Error reading .env: ${(error as Error).message}`;
    }
    
    // Return all diagnostics
    return createSuccessResponse({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      database: {
        status: dbStatus,
        details: dbDetails,
      },
      envFile: {
        content: envFileContent
      },
      prismaSchema: await getPrismaSchemaInfo(),
    });
  });
}

// Test transaction support
async function testTransaction() {
  try {
    // Try a simple transaction
    const result = await prisma.$transaction(async (tx) => {
      const countBefore = await tx.user.count();
      return { success: true, transactionsSupported: true, count: countBefore };
    });
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      transactionsSupported: false, 
      error: (error as Error).message 
    };
  }
}

// Get Prisma schema info
async function getPrismaSchemaInfo() {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Extract datasource section without using the /s flag
      const datasourceStart = schema.indexOf('datasource db {');
      const datasourceEnd = schema.indexOf('}', datasourceStart);
      const datasource = datasourceStart >= 0 && datasourceEnd >= 0
        ? schema.substring(datasourceStart + 'datasource db {'.length, datasourceEnd).trim()
        : 'Not found';
      
      // Count models
      let modelCount = 0;
      const modelRegex = /model\s+\w+\s+{/g;
      let match;
      while ((match = modelRegex.exec(schema)) !== null) {
        modelCount++;
      }
      
      return {
        datasource,
        modelCount,
      };
    }
    return 'Prisma schema not found';
  } catch (error) {
    return `Error reading Prisma schema: ${(error as Error).message}`;
  }
} 