/**
 * Database Seed Script
 * Run with: npm run seed
 * 
 * This script creates test users for traditional login.
 * No Replit Auth - uses username/password.
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const testUsers = [
  {
    id: "admin-001",
    username: "admin",
    password: "admin123",
    email: "admin@abbottlaw.edu",
    firstName: "Admin",
    lastName: "User",
    role: "admin" as const,
  },
  {
    id: "accountant-001",
    username: "accountant",
    password: "acc123",
    email: "accountant@abbottlaw.edu",
    firstName: "Account",
    lastName: "Manager",
    role: "accountant" as const,
  },
  {
    id: "receptionist-001",
    username: "receptionist",
    password: "rec123",
    email: "receptionist@abbottlaw.edu",
    firstName: "Front",
    lastName: "Desk",
    role: "receptionist" as const,
  },
  {
    id: "teacher-001",
    username: "teacher",
    password: "teach123",
    email: "teacher@abbottlaw.edu",
    firstName: "Prof",
    lastName: "Khan",
    role: "teacher" as const,
  },
  {
    id: "librarian-001",
    username: "librarian",
    password: "lib123",
    email: "librarian@abbottlaw.edu",
    firstName: "Library",
    lastName: "Manager",
    role: "library_staff" as const,
  },
  {
    id: "student-001",
    username: "student",
    password: "student123",
    email: "student@abbottlaw.edu",
    firstName: "Test",
    lastName: "Student",
    role: "student" as const,
  },
  {
    id: "hazara-001",
    username: "hazara",
    password: "hazara123",
    email: "hazara@university.edu",
    firstName: "Hazara",
    lastName: "University",
    role: "hazara_university" as const,
  },
  {
    id: "pbc-001",
    username: "pbc",
    password: "pbc123",
    email: "pbc@barcouncil.gov.pk",
    firstName: "Pakistan Bar",
    lastName: "Council",
    role: "pbc" as const,
  },
];

async function seed() {
  console.log("🌱 Seeding test users with hashed passwords...");

  try {
    for (const user of testUsers) {
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const { id, ...userWithoutId } = user;
      const userWithHashedPassword = { ...userWithoutId, password: hashedPassword };
      
      // Check if user exists
      const existing = await db.select().from(users).where(eq(users.username, user.username));
      
      if (existing.length === 0) {
        await db.insert(users).values(userWithHashedPassword);
        console.log(`✅ Created user: ${user.username} (${user.role})`);
      } else {
        // Update existing user (omit id from update)
        await db.update(users).set(userWithHashedPassword).where(eq(users.username, user.username));
        console.log(`🔄 Updated user: ${user.username} (${user.role})`);
      }
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
