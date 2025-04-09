import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Suppress all Prisma query logs in production, and only show warnings and errors in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['warn', 'error'] // Only log warnings and errors in development
      : ['error'], // Only log errors in production
  });
};

// Use global to keep prisma client instance across hot-reloads
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Create a singleton instance of Prisma client
export const prisma = globalThis.prisma ?? prismaClientSingleton();

// In production, don't keep prisma in the global object
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma; 