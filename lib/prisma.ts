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

// Function to create a new PrismaClient with error handling
function createPrismaClient() {
  console.log('Initializing Prisma client...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
  }
  
  const client = new PrismaClient(prismaClientOptions);
  
  // Add middleware for connection error handling
  client.$use(async (params, next) => {
    try {
      // Start timer
      const startTime = Date.now();
      
      // Execute the query
      const result = await next(params);
      
      // Log timing for slow queries
      const timeTaken = Date.now() - startTime;
      if (timeTaken > 500) { // 500ms threshold for "slow" queries
        console.warn(`⚠️ Slow query detected: ${params.model}.${params.action} took ${timeTaken}ms`);
      }
      
      return result;
    } catch (error) {
      // Log database errors
      console.error(`Database error in ${params.model}.${params.action}:`, error);
      
      // Rethrow with better message
      if (error instanceof Error) {
        if (error.message.includes('database') || error.message.includes('connection')) {
          console.error('Database connection issue detected:', error.message);
          throw new Error(`Database connection error: ${error.message}`);
        }
      }
      
      // Rethrow the original error
      throw error;
    }
  });
  
  // Test connection on initialization in development
  if (process.env.NODE_ENV === 'development') {
    client.$connect()
      .then(() => console.log('✅ Successfully connected to database'))
      .catch(e => {
        console.error('❌ Failed to connect to database:', e);
        console.error('Check your DATABASE_URL environment variable and ensure PostgreSQL is running');
      });
  }
  
  return client;
}

// Use existing client if available or create a new one
const prisma = global.prisma || createPrismaClient();

// Set up global instance in development to avoid multiple instances
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma; 