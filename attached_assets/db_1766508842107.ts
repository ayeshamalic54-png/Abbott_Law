import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Required for Neon WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

/**
 * Database URL priority:
 * 1. DATABASE_URL (your .env already uses this)
 * 2. NEON_DATABASE_URL (optional fallback)
 */
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

// ---- VALIDATION ----
if (!databaseUrl) {
  console.error("❌ DATABASE CONFIGURATION ERROR");
  console.error(
    "DATABASE_URL is missing.\n" +
    "➡ Check your .env file\n" +
    "➡ Restart the dev server\n"
  );

  // Crash only in production
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production");
  }
}

// ---- CONNECTION POOL ----
export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
    })
  : null;

// ---- DRIZZLE ORM ----
export const db = pool
  ? drizzle({
      client: pool,
      schema,
    })
  : null;
