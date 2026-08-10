import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============= REPLIT AUTH TABLES (MANDATORY) =============

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth + Role-based access + Local Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ['admin', 'accountant', 'receptionist', 'teacher', 'library_staff', 'student', 'hazara_university', 'pbc'] }).notNull().default('student'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============= STUDENT MANAGEMENT =============

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  rollNumber: varchar("roll_number").notNull().unique(),
  fullName: varchar("full_name").notNull(),
  fatherName: varchar("father_name"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { enum: ['male', 'female', 'other'] }),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  photoUrl: varchar("photo_url"),
  program: varchar("program"), // LLB 3-year, LLB 5-year
  semester: integer("semester"),
  section: varchar("section"),
  enrollmentDate: date("enrollment_date").defaultNow(),
  status: varchar("status", { enum: ['active', 'inactive', 'graduated', 'suspended'] }).default('active'),
  previousDues: decimal("previous_dues", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  attendance: many(studentAttendance),
  grades: many(grades),
}));

// ============= STAFF MANAGEMENT =============

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  employeeId: varchar("employee_id").notNull().unique(),
  fullName: varchar("full_name").notNull(),
  designation: varchar("designation"), // Professor, Lecturer, Admin Staff, etc.
  department: varchar("department"),
  qualification: varchar("qualification"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  joiningDate: date("joining_date"),
  employmentType: varchar("employment_type", { enum: ['permanent', 'visiting', 'contract'] }).default('permanent'),
  status: varchar("status", { enum: ['active', 'inactive', 'retired'] }).default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  attendance: many(staffAttendance),
  salarySlips: many(salarySlips),
}));

// ============= ATTENDANCE TRACKING =============

export const studentAttendance = pgTable("student_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  date: date("date").notNull(),
  status: varchar("status", { enum: ['present', 'absent', 'leave'] }).notNull(),
  subject: varchar("subject"),
  teacherId: varchar("teacher_id").references(() => staff.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentAttendanceSchema = createInsertSchema(studentAttendance).omit({ id: true, createdAt: true });
export type InsertStudentAttendance = z.infer<typeof insertStudentAttendanceSchema>;
export type StudentAttendance = typeof studentAttendance.$inferSelect;

export const staffAttendance = pgTable("staff_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  date: date("date").notNull(),
  status: varchar("status", { enum: ['present', 'absent', 'leave'] }).notNull(),
  checkIn: varchar("check_in"),
  checkOut: varchar("check_out"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffAttendanceSchema = createInsertSchema(staffAttendance).omit({ id: true, createdAt: true });
export type InsertStaffAttendance = z.infer<typeof insertStaffAttendanceSchema>;
export type StaffAttendance = typeof staffAttendance.$inferSelect;

// ============= GRADES & ACADEMICS =============

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  courseId: varchar("course_id").references(() => courses.id),
  grade: varchar("grade"),
  marks: decimal("marks", { precision: 5, scale: 2 }),
  semester: integer("semester"),
  academicYear: varchar("academic_year"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true });
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  courseId: integer("course_id"),
  dueDate: date("due_date").notNull(),
  totalMarks: integer("total_marks"),
  status: varchar("status", { enum: ['active', 'completed', 'cancelled'] }).default('active'),
  program: varchar("program"),
  semester: integer("semester"),
  section: varchar("section"),
  assignedBy: varchar("assigned_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id),
  date: timestamp("date"),
  totalMarks: integer("total_marks"),
  duration: integer("duration"),
  status: varchar("status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// ============= FEE MANAGEMENT =============

export const feeStructures = pgTable("fee_structures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  program: varchar("program"),
  paymentType: varchar("payment_type").default("semester"),
  semester: integer("semester"),
  isActive: boolean("is_active").default(true),
  feeType: varchar("fee_type"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({ id: true, createdAt: true });
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type FeeStructure = typeof feeStructures.$inferSelect;

export const feeVouchers = pgTable("fee_vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voucherNumber: varchar("voucher_number").notNull().unique(),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month"),
  discountType: varchar("discount_type", { enum: ['percentage', 'fixed'] }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  discountReason: text("discount_reason"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  status: varchar("status", { enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled'] }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeeVoucherSchema = createInsertSchema(feeVouchers).omit({ id: true, createdAt: true });
export type InsertFeeVoucher = z.infer<typeof insertFeeVoucherSchema>;
export type FeeVoucher = typeof feeVouchers.$inferSelect;

export const feePayments = pgTable("fee_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voucherId: varchar("voucher_id").references(() => feeVouchers.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method"),
  receiptNumber: varchar("receipt_number").unique(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  collectedBy: varchar("collected_by").references(() => users.id),
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({ id: true, createdAt: true });
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type FeePayment = typeof feePayments.$inferSelect;

// ============= RECEIPTS (PERMANENT RECORD) =============

export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: varchar("receipt_number").notNull().unique(),
  receiptType: varchar("receipt_type", { enum: ['admission', 'fee_collection', 'other'] }).notNull(),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'set null' }),
  studentName: varchar("student_name").notNull(),
  studentRollNumber: varchar("student_roll_number"),
  fatherName: varchar("father_name"),
  program: varchar("program"),
  semester: integer("semester"),
  voucherId: varchar("voucher_id").references(() => feeVouchers.id, { onDelete: 'set null' }),
  paymentId: varchar("payment_id").references(() => feePayments.id, { onDelete: 'set null' }),
  feeDetails: jsonb("fee_details"),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
  discountType: varchar("discount_type"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  discountReason: text("discount_reason"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"),
  paymentDate: date("payment_date").notNull(),
  collectedBy: varchar("collected_by").references(() => users.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({ id: true, createdAt: true });
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

// ============= STUDENT PREVIOUS DUES =============

export const studentPreviousDues = pgTable("student_previous_dues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueType: varchar("due_type", { enum: ['carry_forward', 'adjustment', 'write_off', 'previous_institute'] }).default('carry_forward'),
  description: text("description"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  recordedAt: timestamp("recorded_at").defaultNow(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
});

export const insertStudentPreviousDuesSchema = createInsertSchema(studentPreviousDues).omit({ id: true, recordedAt: true });
export type InsertStudentPreviousDues = z.infer<typeof insertStudentPreviousDuesSchema>;
export type StudentPreviousDues = typeof studentPreviousDues.$inferSelect;

// ============= CLASS PROMOTION =============

export const promotionRuns = pgTable("promotion_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  program: varchar("program").notNull(),
  fromSemester: integer("from_semester").notNull(),
  toSemester: integer("to_semester").notNull(),
  promotedCount: integer("promoted_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromotionRunSchema = createInsertSchema(promotionRuns).omit({ id: true, createdAt: true });
export type InsertPromotionRun = z.infer<typeof insertPromotionRunSchema>;
export type PromotionRun = typeof promotionRuns.$inferSelect;

export const studentPromotionHistory = pgTable("student_promotion_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").references(() => promotionRuns.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  previousSemester: integer("previous_semester").notNull(),
  newSemester: integer("new_semester").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentPromotionHistorySchema = createInsertSchema(studentPromotionHistory).omit({ id: true, createdAt: true });
export type InsertStudentPromotionHistory = z.infer<typeof insertStudentPromotionHistorySchema>;
export type StudentPromotionHistory = typeof studentPromotionHistory.$inferSelect;

// ============= PAYROLL MANAGEMENT =============

export const salaryTypes = pgTable("salary_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type", { enum: ['fixed', 'per_lecture'] }).default('fixed'),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default('0'),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }),
  allowances: decimal("allowances", { precision: 10, scale: 2 }),
  deductions: decimal("deductions", { precision: 10, scale: 2 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalaryTypeSchema = createInsertSchema(salaryTypes).omit({ id: true, createdAt: true });
export type InsertSalaryType = z.infer<typeof insertSalaryTypeSchema>;
export type SalaryType = typeof salaryTypes.$inferSelect;

export const salarySlips = pgTable("salary_slips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slipNumber: varchar("slip_number").notNull(),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  month: varchar("month").notNull(),
  year: varchar("year"),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default('0'),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: ['pending', 'approved', 'paid'] }).default('pending'),
  paymentDate: date("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  salaryTypeId: varchar("salary_type_id").references(() => salaryTypes.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  generatedBy: varchar("generated_by").references(() => users.id),
  remarks: text("remarks"),
  isVisiting: boolean("is_visiting").default(false),
  lectureCount: integer("lecture_count"),
  lectureRate: decimal("lecture_rate", { precision: 10, scale: 2 }),
  totalLecturePay: decimal("total_lecture_pay", { precision: 10, scale: 2 }),
  signatureAcknowledged: boolean("signature_acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const insertSalarySlipSchema = createInsertSchema(salarySlips).omit({ id: true, createdAt: true });
export type InsertSalarySlip = z.infer<typeof insertSalarySlipSchema>;
export type SalarySlip = typeof salarySlips.$inferSelect;

// ============= LIBRARY MANAGEMENT =============

export const libraryBooks = pgTable("library_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  author: varchar("author"),
  copies: integer("copies"),
  isbn: varchar("isbn").unique(),
  category: varchar("category"),
  quantity: integer("quantity"),
  available: integer("available"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryBookSchema = createInsertSchema(libraryBooks).omit({ id: true, createdAt: true });
export type InsertLibraryBook = z.infer<typeof insertLibraryBookSchema>;
export type LibraryBook = typeof libraryBooks.$inferSelect;

export const libraryIssues = pgTable("library_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").references(() => libraryBooks.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => students.id),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: varchar("status", { enum: ['issued', 'returned', 'overdue'] }).default('issued'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryIssueSchema = createInsertSchema(libraryIssues).omit({ id: true, createdAt: true });
export type InsertLibraryIssue = z.infer<typeof insertLibraryIssueSchema>;
export type LibraryIssue = typeof libraryIssues.$inferSelect;

export const libraryFines = pgTable("library_fines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => libraryIssues.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { enum: ['pending', 'paid'] }).default('pending'),
  paidDate: date("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryFineSchema = createInsertSchema(libraryFines).omit({ id: true, createdAt: true });
export type InsertLibraryFine = z.infer<typeof insertLibraryFineSchema>;
export type LibraryFine = typeof libraryFines.$inferSelect;

export const libraryCopiesInventory = pgTable("library_copies_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemName: varchar("item_name").notNull(),
  itemType: varchar("item_type").notNull(), // 'Practical Copy Small', 'Practical Copy Large', or custom
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  currentStock: integer("current_stock").default(0).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLibraryCopiesInventorySchema = createInsertSchema(libraryCopiesInventory).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLibraryCopiesInventory = z.infer<typeof insertLibraryCopiesInventorySchema>;
export type LibraryCopiesInventory = typeof libraryCopiesInventory.$inferSelect;

export const libraryCopiesSales = pgTable("library_copies_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inventoryId: varchar("inventory_id").references(() => libraryCopiesInventory.id, { onDelete: 'restrict' }).notNull(),
  customerType: varchar("customer_type", { enum: ['student', 'staff', 'external'] }).notNull(),
  customerId: varchar("customer_id"), // studentId or staffId, null for external
  customerName: varchar("customer_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: date("sale_date").notNull(),
  soldBy: varchar("sold_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryCopiesSalesSchema = createInsertSchema(libraryCopiesSales).omit({ id: true, createdAt: true });
export type InsertLibraryCopiesSales = z.infer<typeof insertLibraryCopiesSalesSchema>;
export type LibraryCopiesSales = typeof libraryCopiesSales.$inferSelect;

// ============= ACCOUNTS & FINANCE =============

export const expenseHeads = pgTable("expense_heads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  category: varchar("category"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseHeadSchema = createInsertSchema(expenseHeads).omit({ id: true, createdAt: true });
export type InsertExpenseHead = z.infer<typeof insertExpenseHeadSchema>;
export type ExpenseHead = typeof expenseHeads.$inferSelect;

export const incomeExpense = pgTable("income_expense", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { enum: ['income', 'expense'] }).notNull(),
  headId: varchar("head_id").references(() => expenseHeads.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"),
  referenceNumber: varchar("reference_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIncomeExpenseSchema = createInsertSchema(incomeExpense).omit({ id: true, createdAt: true });
export type InsertIncomeExpense = z.infer<typeof insertIncomeExpenseSchema>;
export type IncomeExpense = typeof incomeExpense.$inferSelect;

// ============= COMMUNICATION =============

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { enum: ['announcement', 'fee_reminder', 'general'] }).default('general'),
  targetRole: varchar("target_role"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============= ADMISSIONS & VISITORS =============

export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  purpose: text("purpose"),
  visitDate: date("visit_date").notNull(),
  checkIn: varchar("check_in"),
  checkOut: varchar("check_out"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({ id: true, createdAt: true });
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  program: varchar("program"),
  message: text("message"),
  status: varchar("status", { enum: ['pending', 'contacted', 'admitted', 'rejected'] }).default('pending'),
  followUpDate: date("follow_up_date"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

// ============= PROGRAMS =============

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  type: varchar("type", { enum: ['group', 'law'] }).notNull(),
  category: varchar("category", { enum: ['llb', 'group'] }).default('group'), // llb = Law, group = Abbott Group (Education)
  durationYears: integer("duration_years").notNull(),
  totalSemesters: integer("total_semesters").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// ============= COURSES =============

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  programId: varchar("program_id").references(() => programs.id),
  credits: integer("credits"),
  semester: integer("semester"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ============= CLASS TIMETABLE =============

export const classTimetables = pgTable("class_timetables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  program: varchar("program").notNull(),
  semester: integer("semester").notNull(),
  section: varchar("section"),
  dayOfWeek: varchar("day_of_week", { enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }).notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  courseId: integer("course_id"),
  courseName: varchar("course_name"),
  teacherId: varchar("teacher_id"),
  teacherName: varchar("teacher_name"),
  room: varchar("room"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassTimetableSchema = createInsertSchema(classTimetables).omit({ id: true, createdAt: true });
export type InsertClassTimetable = z.infer<typeof insertClassTimetableSchema>;
export type ClassTimetable = typeof classTimetables.$inferSelect;

// ============= EXAM SCHEDULE =============

export const examSchedules = pgTable("exam_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  examType: varchar("exam_type", { enum: ['midterm', 'final', 'quiz', 'practical', 'internal'] }).notNull(),
  program: varchar("program").notNull(),
  semester: integer("semester"),
  courseId: integer("course_id"),
  courseName: varchar("course_name"),
  examDate: date("exam_date").notNull(),
  startTime: varchar("start_time"),
  endTime: varchar("end_time"),
  room: varchar("room"),
  invigilatorId: varchar("invigilator_id"),
  invigilatorName: varchar("invigilator_name"),
  totalMarks: integer("total_marks"),
  passingMarks: integer("passing_marks"),
  instructions: text("instructions"),
  status: varchar("status", { enum: ['scheduled', 'ongoing', 'completed', 'cancelled'] }).default('scheduled'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExamScheduleSchema = createInsertSchema(examSchedules).omit({ id: true, createdAt: true });
export type InsertExamSchedule = z.infer<typeof insertExamScheduleSchema>;
export type ExamSchedule = typeof examSchedules.$inferSelect;

// ============= BACKUPS =============

export const backups = pgTable("backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  size: varchar("size").notNull(),
  type: varchar("type", { enum: ['manual', 'automatic'] }).notNull().default('manual'),
  backupData: text("backup_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });
export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

// ============= SYSTEM SETTINGS =============

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
