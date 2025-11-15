import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool configuration
const connectionPoolConfig = {
  // Connection pool size limits
  connection_limit: process.env.DATABASE_CONNECTION_LIMIT 
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10) 
    : 20,
  pool_timeout: process.env.DATABASE_POOL_TIMEOUT 
    ? parseInt(process.env.DATABASE_POOL_TIMEOUT, 10) 
    : 10, // seconds
};

// Build database URL with connection pool parameters
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Parse URL to add connection pool parameters
  const url = new URL(baseUrl);
  
  // Add connection pool parameters
  url.searchParams.set("connection_limit", connectionPoolConfig.connection_limit.toString());
  url.searchParams.set("pool_timeout", connectionPoolConfig.pool_timeout.toString());
  
  // Add pgbouncer mode if using Neon or similar pooling service
  if (baseUrl.includes("pooler") || baseUrl.includes("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" 
      ? ["query", "info", "warn", "error"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Connection health monitoring
export async function checkDatabaseConnection(): Promise<{
  healthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
