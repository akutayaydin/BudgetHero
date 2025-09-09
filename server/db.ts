import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Determine environment and use appropriate database
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';


// Use environment-specific database URLs
const databaseUrl = isProduction 
  ? process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
  : process.env.DATABASE_URL_DEVELOPMENT || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `Database URL not found for ${isProduction ? 'production' : 'development'} environment. Please set DATABASE_URL${isProduction ? '_PRODUCTION' : '_DEVELOPMENT'} or DATABASE_URL.`,
  );
}

console.log(`Database configuration: Using ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

export async function migrateDb() {
  await migrate(db, { migrationsFolder: './migrations' });
}