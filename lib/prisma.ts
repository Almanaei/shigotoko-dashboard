import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

declare global {
  var prisma: PrismaClient | undefined;
}

// Configuration for Prisma client
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as Prisma.LogLevel[]
    : ['error'] as Prisma.LogLevel[],
  
  // Database connection pool configuration
  // This helps handle multiple concurrent requests efficiently
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // Add connection pooling options if needed
      // poolTimeout: 30, // Seconds before unused connections are removed
      // connectionLimit: 10, // Max number of connections in the pool
    },
  },
};

// Create PrismaClient with proper typing
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we already have a Prisma client instance globally, and if not, create one
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions)

// Set the `globalForPrisma.prisma` to the current instance if we're not in production
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma; 