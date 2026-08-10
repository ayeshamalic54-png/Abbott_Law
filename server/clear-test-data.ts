/**
 * Clear Test Data Script
 * Run with: npx tsx server/clear-test-data.ts
 * 
 * This removes all test users except the admin account.
 * Use this to clean your database before production.
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { ne } from "drizzle-orm";

async function clearTestData() {
  console.log("🧹 Clearing test data from database...");

  try {
    // Delete all users EXCEPT the admin user
    const result = await db
      .delete(users)
      .where(ne(users.username, "admin"));
    
    console.log("✅ Removed all test users (kept admin account)");
    console.log("✨ Database is now clean!");
    console.log("\n📋 Remaining user:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("\n⚠️  Add real users through the User Management page\n");

  } catch (error) {
    console.error("❌ Clear failed:", error);
    throw error;
  }
}

clearTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
