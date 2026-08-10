import "dotenv/config";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Enable websocket support for Neon
neonConfig.webSocketConstructor = ws;

// Load database URL from environment
const databaseUrl =
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

// Debug check
console.log("DATABASE_URL Loaded:", !!databaseUrl);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to create a .env file?"
  );
}

// PostgreSQL pool
export const pool = new Pool({
  connectionString: databaseUrl,
});

// Drizzle ORM
export const db = drizzle({
  client: pool,
  schema,
});