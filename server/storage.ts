// Reference: Database and Replit Auth blueprints
import {
  users,
  students,
  staff,
  studentAttendance,
  staffAttendance,
  grades,
  assignments,
  quizzes,
  feeStructures,
  feeVouchers,
  feePayments,
  receipts,
  studentPreviousDues,
  promotionRuns,
  studentPromotionHistory,
  salaryTypes,
  salarySlips,
  libraryBooks,
  libraryIssues,
  libraryFines,
  libraryCopiesInventory,
  libraryCopiesSales,
  expenseHeads,
  incomeExpense,
  notifications,
  visitors,
  inquiries,
  programs,
  courses,
  classTimetables,
  examSchedules,
  backups,
  systemSettings,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Staff,
  type InsertStaff,
  type StudentAttendance,
  type InsertStudentAttendance,
  type StaffAttendance,
  type InsertStaffAttendance,
  type Grade,
  type InsertGrade,
  type Assignment,
  type InsertAssignment,
  type Quiz,
  type InsertQuiz,
  type FeeStructure,
  type InsertFeeStructure,
  type FeeVoucher,
  type InsertFeeVoucher,
  type FeePayment,
  type InsertFeePayment,
  type Receipt,
  type InsertReceipt,
  type StudentPreviousDues,
  type InsertStudentPreviousDues,
  type PromotionRun,
  type InsertPromotionRun,
  type StudentPromotionHistory,
  type InsertStudentPromotionHistory,
  type SalaryType,
  type InsertSalaryType,
  type SalarySlip,
  type InsertSalarySlip,
  type LibraryBook,
  type InsertLibraryBook,
  type LibraryIssue,
  type InsertLibraryIssue,
  type LibraryFine,
  type InsertLibraryFine,
  type LibraryCopiesInventory,
  type InsertLibraryCopiesInventory,
  type LibraryCopiesSales,
  type InsertLibraryCopiesSales,
  type ExpenseHead,
  type InsertExpenseHead,
  type IncomeExpense,
  type InsertIncomeExpense,
  type Notification,
  type InsertNotification,
  type Visitor,
  type InsertVisitor,
  type Inquiry,
  type InsertInquiry,
  type Program,
  type InsertProgram,
  type Course,
  type InsertCourse,
  type Backup,
  type InsertBackup,
  type ClassTimetable,
  type InsertClassTimetable,
  type ExamSchedule,
  type InsertExamSchedule,
  type SystemSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (mandatory for Replit Auth + Local Auth)
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student & { credentials?: { username: string, password: string } }>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Staff operations
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: string): Promise<void>;
  
  // Attendance operations
  getStudentAttendance(filters: { studentId?: string; date?: string }): Promise<StudentAttendance[]>;
  createStudentAttendance(attendance: InsertStudentAttendance): Promise<StudentAttendance>;
  updateStudentAttendanceById(id: string, data: { status: string; remarks?: string }): Promise<StudentAttendance>;
  deleteStudentAttendance(id: string): Promise<void>;
  getStaffAttendance(filters: { staffId?: string; date?: string }): Promise<StaffAttendance[]>;
  createStaffAttendance(attendance: InsertStaffAttendance): Promise<StaffAttendance>;
  updateStaffAttendanceById(id: string, data: { status: string; remarks?: string }): Promise<StaffAttendance>;
  deleteStaffAttendance(id: string): Promise<void>;
  
  // Grade operations
  getGrades(studentId?: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade>;
  deleteGrade(id: string): Promise<void>;
  
  // Assignment operations
  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;
  
  // Quiz operations
  getQuizzes(): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Fee operations
  getFeeStructures(): Promise<FeeStructure[]>;
  createFeeStructure(fee: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(id: string, fee: Partial<InsertFeeStructure>): Promise<FeeStructure>;
  deleteFeeStructure(id: string): Promise<void>;
  
  getFeeVouchers(): Promise<FeeVoucher[]>;
  getFeeVoucher(id: string): Promise<FeeVoucher | undefined>;
  getFeeVouchersByStudent(studentId: string): Promise<FeeVoucher[]>;
  createFeeVoucher(voucher: InsertFeeVoucher): Promise<FeeVoucher>;
  updateFeeVoucher(id: string, voucher: Partial<InsertFeeVoucher>): Promise<FeeVoucher>;
  deleteFeeVoucher(id: string): Promise<void>;
  
  getFeePayments(): Promise<FeePayment[]>;
  getFeePaymentByVoucher(voucherId: string): Promise<FeePayment | undefined>;
  getPaymentsForVoucher(voucherId: string): Promise<FeePayment[]>;
  getTotalPaidForVoucher(voucherId: string): Promise<number>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  deleteFeePayment(id: string): Promise<void>;
  updateFeeVoucherStatus(id: string, status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'): Promise<FeeVoucher>;
  
  // Receipt operations
  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: string): Promise<Receipt | undefined>;
  getReceiptsByStudent(studentId: string): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;
  getNextReceiptNumber(): Promise<string>;
  getNextVoucherNumber(): Promise<string>;
  
  // Previous Dues operations
  getStudentPreviousDues(studentId?: string): Promise<StudentPreviousDues[]>;
  createStudentPreviousDue(due: InsertStudentPreviousDues): Promise<StudentPreviousDues>;
  updateStudentPreviousDue(id: string, data: Partial<InsertStudentPreviousDues>): Promise<StudentPreviousDues>;
  deleteStudentPreviousDue(id: string): Promise<void>;
  
  // Promotion operations
  getPromotionRuns(): Promise<PromotionRun[]>;
  createPromotionRun(run: InsertPromotionRun): Promise<PromotionRun>;
  getStudentPromotionHistory(studentId?: string): Promise<StudentPromotionHistory[]>;
  createStudentPromotionHistory(history: InsertStudentPromotionHistory): Promise<StudentPromotionHistory>;
  promoteStudents(program: string, fromSemester: number, toSemester: number, studentIds: string[], createdBy?: string): Promise<PromotionRun>;
  
  // Payroll operations
  getSalaryTypes(): Promise<SalaryType[]>;
  createSalaryType(salaryType: InsertSalaryType): Promise<SalaryType>;
  updateSalaryType(id: string, salaryType: Partial<InsertSalaryType>): Promise<SalaryType>;
  deleteSalaryType(id: string): Promise<void>;
  
  getSalarySlips(): Promise<SalarySlip[]>;
  getSalarySlipById(id: string): Promise<SalarySlip | undefined>;
  getSalarySlipsByStaff(staffId: string): Promise<SalarySlip[]>;
  getNextSlipNumber(): Promise<string>;
  createSalarySlip(slip: InsertSalarySlip): Promise<SalarySlip>;
  updateSalarySlip(id: string, slip: Partial<InsertSalarySlip>): Promise<SalarySlip>;
  deleteSalarySlip(id: string): Promise<void>;
  
  // Library operations
  getLibraryBooks(): Promise<LibraryBook[]>;
  createLibraryBook(book: InsertLibraryBook): Promise<LibraryBook>;
  updateLibraryBook(id: string, book: Partial<InsertLibraryBook>): Promise<LibraryBook>;
  deleteLibraryBook(id: string): Promise<void>;
  
  getLibraryIssues(): Promise<LibraryIssue[]>;
  createLibraryIssue(issue: InsertLibraryIssue): Promise<LibraryIssue>;
  updateLibraryIssue(id: string, issue: Partial<InsertLibraryIssue>): Promise<LibraryIssue>;
  
  getLibraryFines(): Promise<LibraryFine[]>;
  createLibraryFine(fine: InsertLibraryFine): Promise<LibraryFine>;
  
  // Accounts operations
  getExpenseHeads(): Promise<ExpenseHead[]>;
  createExpenseHead(head: InsertExpenseHead): Promise<ExpenseHead>;
  updateExpenseHead(id: string, head: Partial<InsertExpenseHead>): Promise<ExpenseHead>;
  deleteExpenseHead(id: string): Promise<void>;
  
  getIncomeExpense(): Promise<IncomeExpense[]>;
  createIncomeExpense(record: InsertIncomeExpense): Promise<IncomeExpense>;
  updateIncomeExpense(id: string, record: Partial<InsertIncomeExpense>): Promise<IncomeExpense>;
  deleteIncomeExpense(id: string): Promise<void>;
  
  // Communication operations
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  
  // Visitor operations
  getVisitors(): Promise<Visitor[]>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitor(id: string, visitor: Partial<InsertVisitor>): Promise<Visitor>;
  deleteVisitor(id: string): Promise<void>;
  
  // Inquiry operations
  getInquiries(): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;
  deleteInquiry(id: string): Promise<void>;
  
  // Program operations
  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program>;
  deleteProgram(id: string): Promise<void>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  // Class Timetable operations
  getClassTimetables(filters?: { program?: string; semester?: number }): Promise<ClassTimetable[]>;
  getClassTimetable(id: string): Promise<ClassTimetable | undefined>;
  createClassTimetable(timetable: InsertClassTimetable): Promise<ClassTimetable>;
  updateClassTimetable(id: string, timetable: Partial<InsertClassTimetable>): Promise<ClassTimetable>;
  deleteClassTimetable(id: string): Promise<void>;
  
  // Exam Schedule operations
  getExamSchedules(filters?: { program?: string; semester?: number }): Promise<ExamSchedule[]>;
  getExamSchedule(id: string): Promise<ExamSchedule | undefined>;
  createExamSchedule(schedule: InsertExamSchedule): Promise<ExamSchedule>;
  updateExamSchedule(id: string, schedule: Partial<InsertExamSchedule>): Promise<ExamSchedule>;
  deleteExamSchedule(id: string): Promise<void>;
  
  // Backup operations
  getBackups(): Promise<Backup[]>;
  getBackup(id: string): Promise<Backup | undefined>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  
  // System Settings operations
  getAllSettings(): Promise<SystemSettings[]>;
  getSetting(key: string): Promise<SystemSettings | undefined>;
  upsertSetting(key: string, value: string): Promise<SystemSettings>;
  
  // Fee Reporting
  getFeeReportData(startDate: Date, endDate: Date): Promise<{
    programFees: Array<{
      programId: string | null;
      programName: string;
      programType: 'group' | 'law' | 'unknown';
      totalCollected: number;
    }>;
    expenses: Array<{
      id: string;
      date: string;
      headId: string | null;
      amount: number;
      description: string | null;
    }>;
  }>;

  getFinancialSummary(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    feeIncome: number;
    otherIncome: number;
    totalExpenses: number;
    netBalance: number;
    monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
    }>;
    categoryBreakdown: {
      income: Array<{ category: string; amount: number }>;
      expenses: Array<{ category: string; amount: number }>;
    };
    recentTransactions: Array<{
      id: string;
      type: 'income' | 'expense';
      headId: string | null;
      amount: number;
      date: string;
      description: string | null;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // ============= USER OPERATIONS (REPLIT AUTH + LOCAL AUTH) =============
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ============= STUDENT OPERATIONS =============
  
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student & { credentials?: { username: string, password: string } }> {
    // Generate username from student's full name (e.g., "John Doe" -> "john_doe")
    const username = student.fullName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Default password for all students
    const password = 'abbott123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user account
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      email: student.email || undefined,
      firstName: student.fullName.split(' ')[0],
      lastName: student.fullName.split(' ').slice(1).join(' ') || undefined,
      role: 'student',
    }).returning();
    
    // Create student record linked to user
    const [newStudent] = await db.insert(students).values({
      ...student,
      userId: newUser.id,
    }).returning();
    
    // Return student with credentials
    return {
      ...newStudent,
      credentials: { username, password },
    };
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    // Get current student to find linked user
    const currentStudent = await this.getStudent(id);
    
    // Update student record
    const [updated] = await db.update(students).set(student).where(eq(students.id, id)).returning();
    
    // If name changed and student has linked user, update username too
    if (student.fullName && currentStudent?.userId) {
      const newUsername = student.fullName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const firstName = student.fullName.split(' ')[0];
      const lastName = student.fullName.split(' ').slice(1).join(' ') || undefined;
      
      await db.update(users).set({
        username: newUsername,
        firstName,
        lastName,
      }).where(eq(users.id, currentStudent.userId));
    }
    
    return updated;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // ============= STAFF OPERATIONS =============
  
  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(desc(staff.createdAt));
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.id, id));
    return member;
  }

  async createStaff(staffData: InsertStaff): Promise<Staff & { credentials?: { username: string, password: string } }> {
    // Generate username from staff's full name
    const username = staffData.fullName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Default password for all staff
    const password = 'abbott123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user account
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      email: staffData.email || undefined,
      firstName: staffData.fullName.split(' ')[0],
      lastName: staffData.fullName.split(' ').slice(1).join(' ') || undefined,
      role: 'teacher',
    }).returning();
    
    // Create staff record linked to user
    const [newStaff] = await db.insert(staff).values({
      ...staffData,
      userId: newUser.id,
    }).returning();
    
    return {
      ...newStaff,
      credentials: { username, password },
    };
  }

  async updateStaff(id: string, staffData: Partial<InsertStaff>): Promise<Staff> {
    // Get current staff to find linked user
    const currentStaff = await this.getStaffMember(id);
    
    // Update staff record
    const [updated] = await db.update(staff).set(staffData).where(eq(staff.id, id)).returning();
    
    // If name changed and staff has linked user, update username too
    if (staffData.fullName && currentStaff?.userId) {
      const newUsername = staffData.fullName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const firstName = staffData.fullName.split(' ')[0];
      const lastName = staffData.fullName.split(' ').slice(1).join(' ') || undefined;
      
      await db.update(users).set({
        username: newUsername,
        firstName,
        lastName,
      }).where(eq(users.id, currentStaff.userId));
    }
    
    return updated;
  }

  async deleteStaff(id: string): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // ============= ATTENDANCE OPERATIONS =============
  
  async getStudentAttendance(filters: { studentId?: string; date?: string }): Promise<StudentAttendance[]> {
    const conditions = [];
    if (filters.studentId) {
      conditions.push(eq(studentAttendance.studentId, filters.studentId));
    }
    if (filters.date) {
      conditions.push(eq(studentAttendance.date, filters.date));
    }
    
    // Join with students table to get student information
    const results = await db
      .select({
        id: studentAttendance.id,
        studentId: studentAttendance.studentId,
        date: studentAttendance.date,
        status: studentAttendance.status,
        subject: studentAttendance.subject,
        remarks: studentAttendance.remarks,
        createdAt: studentAttendance.createdAt,
        student: {
          id: students.id,
          rollNumber: students.rollNumber,
          fullName: students.fullName,
          fatherName: students.fatherName,
          program: students.program,
        }
      })
      .from(studentAttendance)
      .leftJoin(students, eq(studentAttendance.studentId, students.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(studentAttendance.date));
    
    return results as any;
  }

  async createStudentAttendance(attendance: InsertStudentAttendance): Promise<StudentAttendance> {
    // Check if attendance already exists for this student and date
    const existing = await db.select()
      .from(studentAttendance)
      .where(and(
        eq(studentAttendance.studentId, attendance.studentId),
        eq(studentAttendance.date, attendance.date)
      ));
    
    if (existing.length > 0) {
      // Update existing record
      const [updated] = await db.update(studentAttendance)
        .set({ status: attendance.status, remarks: attendance.remarks })
        .where(eq(studentAttendance.id, existing[0].id))
        .returning();
      return updated;
    }
    
    // Create new record
    const [newAttendance] = await db.insert(studentAttendance).values(attendance).returning();
    return newAttendance;
  }

  async updateStudentAttendanceById(id: string, data: { status: string; remarks?: string }): Promise<StudentAttendance> {
    const [updated] = await db.update(studentAttendance)
      .set({ status: data.status as any, remarks: data.remarks })
      .where(eq(studentAttendance.id, id))
      .returning();
    return updated;
  }

  async deleteStudentAttendance(id: string): Promise<void> {
    await db.delete(studentAttendance).where(eq(studentAttendance.id, id));
  }

  async getStaffAttendance(filters: { staffId?: string; date?: string }): Promise<StaffAttendance[]> {
    let query = db.select().from(staffAttendance);
    
    const conditions = [];
    if (filters.staffId) {
      conditions.push(eq(staffAttendance.staffId, filters.staffId));
    }
    if (filters.date) {
      conditions.push(eq(staffAttendance.date, filters.date));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(staffAttendance.date));
  }

  async createStaffAttendance(attendance: InsertStaffAttendance): Promise<StaffAttendance> {
    // Check if attendance already exists for this staff and date (upsert logic)
    const existing = await db.select()
      .from(staffAttendance)
      .where(and(
        eq(staffAttendance.staffId, attendance.staffId),
        eq(staffAttendance.date, attendance.date)
      ));
    
    if (existing.length > 0) {
      // Update existing record
      const [updated] = await db.update(staffAttendance)
        .set({ status: attendance.status, remarks: attendance.remarks })
        .where(eq(staffAttendance.id, existing[0].id))
        .returning();
      return updated;
    }
    
    // Create new record
    const [newAttendance] = await db.insert(staffAttendance).values(attendance).returning();
    return newAttendance;
  }

  async updateStaffAttendanceById(id: string, data: { status: string; remarks?: string }): Promise<StaffAttendance> {
    const [updated] = await db.update(staffAttendance)
      .set({ 
        status: data.status as 'present' | 'absent' | 'leave',
        remarks: data.remarks 
      })
      .where(eq(staffAttendance.id, id))
      .returning();
    return updated;
  }

  async deleteStaffAttendance(id: string): Promise<void> {
    await db.delete(staffAttendance).where(eq(staffAttendance.id, id));
  }

  // ============= GRADE OPERATIONS =============
  
  async getGrades(studentId?: string): Promise<Grade[]> {
    if (studentId) {
      return await db.select().from(grades).where(eq(grades.studentId, studentId)).orderBy(desc(grades.createdAt));
    }
    return await db.select().from(grades).orderBy(desc(grades.createdAt));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  async updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade> {
    const [updated] = await db.update(grades).set(grade).where(eq(grades.id, id)).returning();
    return updated;
  }

  async deleteGrade(id: string): Promise<void> {
    await db.delete(grades).where(eq(grades.id, id));
  }

  // ============= ASSIGNMENT OPERATIONS =============
  
  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).orderBy(desc(assignments.createdAt));
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment> {
    const [updated] = await db.update(assignments).set(assignment).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async deleteAssignment(id: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, id));
  }

  // ============= QUIZ OPERATIONS =============

  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.date));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz> {
    const [updated] = await db.update(quizzes).set(quiz).where(eq(quizzes.id, id)).returning();
    return updated;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // ============= FEE OPERATIONS =============
  
  async getFeeStructures(): Promise<FeeStructure[]> {
    return await db.select().from(feeStructures).orderBy(desc(feeStructures.createdAt));
  }

  async createFeeStructure(fee: InsertFeeStructure): Promise<FeeStructure> {
    const [newFee] = await db.insert(feeStructures).values(fee).returning();
    return newFee;
  }

  async updateFeeStructure(id: string, fee: Partial<InsertFeeStructure>): Promise<FeeStructure> {
    const [updated] = await db.update(feeStructures).set(fee).where(eq(feeStructures.id, id)).returning();
    return updated;
  }

  async deleteFeeStructure(id: string): Promise<void> {
    await db.delete(feeStructures).where(eq(feeStructures.id, id));
  }

  async getFeeVouchers(): Promise<FeeVoucher[]> {
    return await db.select().from(feeVouchers).orderBy(desc(feeVouchers.createdAt));
  }

  async getFeeVoucher(id: string): Promise<FeeVoucher | undefined> {
    const [voucher] = await db.select().from(feeVouchers).where(eq(feeVouchers.id, id));
    return voucher;
  }

  async getFeeVouchersByStudent(studentId: string): Promise<FeeVoucher[]> {
    return await db.select().from(feeVouchers).where(eq(feeVouchers.studentId, studentId)).orderBy(desc(feeVouchers.createdAt));
  }

  async createFeeVoucher(voucher: InsertFeeVoucher): Promise<FeeVoucher> {
    const [newVoucher] = await db.insert(feeVouchers).values(voucher).returning();
    return newVoucher;
  }

  async updateFeeVoucher(id: string, voucher: Partial<InsertFeeVoucher>): Promise<FeeVoucher> {
    const [updated] = await db.update(feeVouchers).set(voucher).where(eq(feeVouchers.id, id)).returning();
    return updated;
  }

  async deleteFeeVoucher(id: string): Promise<void> {
    await db.delete(feeVouchers).where(eq(feeVouchers.id, id));
  }

  async getFeePayments(): Promise<FeePayment[]> {
    return await db.select().from(feePayments).orderBy(desc(feePayments.createdAt));
  }

  async getFeePaymentByVoucher(voucherId: string): Promise<FeePayment | undefined> {
    const [payment] = await db.select().from(feePayments).where(eq(feePayments.voucherId, voucherId));
    return payment;
  }

  async getPaymentsForVoucher(voucherId: string): Promise<FeePayment[]> {
    return await db.select().from(feePayments).where(eq(feePayments.voucherId, voucherId)).orderBy(desc(feePayments.createdAt));
  }

  async getTotalPaidForVoucher(voucherId: string): Promise<number> {
    const payments = await this.getPaymentsForVoucher(voucherId);
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }

  async createFeePayment(payment: InsertFeePayment): Promise<FeePayment> {
    const [newPayment] = await db.insert(feePayments).values(payment).returning();
    return newPayment;
  }

  async deleteFeePayment(id: string): Promise<void> {
    await db.delete(feePayments).where(eq(feePayments.id, id));
  }

  async updateFeeVoucherStatus(id: string, status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'): Promise<FeeVoucher> {
    const [updated] = await db.update(feeVouchers).set({ status }).where(eq(feeVouchers.id, id)).returning();
    return updated;
  }

  // ============= RECEIPT OPERATIONS =============
  
  async getReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts).orderBy(desc(receipts.createdAt));
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt;
  }

  async getReceiptsByStudent(studentId: string): Promise<Receipt[]> {
    return await db.select().from(receipts).where(eq(receipts.studentId, studentId)).orderBy(desc(receipts.createdAt));
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db.insert(receipts).values(receipt).returning();
    return newReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  async getNextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const allReceipts = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
    const lastReceipt = allReceipts.find(r => r.receiptNumber.startsWith(`REC-${year}`));
    if (lastReceipt) {
      const lastNum = parseInt(lastReceipt.receiptNumber.split('-')[2] || '0');
      return `REC-${year}-${String(lastNum + 1).padStart(4, '0')}`;
    }
    return `REC-${year}-0001`;
  }

  async getNextVoucherNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const allVouchers = await db.select().from(feeVouchers).orderBy(desc(feeVouchers.createdAt));
    const lastVoucher = allVouchers.find(v => v.voucherNumber.startsWith(`VCH-${year}`));
    if (lastVoucher) {
      const lastNum = parseInt(lastVoucher.voucherNumber.split('-')[2] || '0');
      return `VCH-${year}-${String(lastNum + 1).padStart(4, '0')}`;
    }
    return `VCH-${year}-0001`;
  }

  // ============= PREVIOUS DUES OPERATIONS =============
  
  async getStudentPreviousDues(studentId?: string): Promise<StudentPreviousDues[]> {
    if (studentId) {
      return await db.select().from(studentPreviousDues).where(eq(studentPreviousDues.studentId, studentId)).orderBy(desc(studentPreviousDues.recordedAt));
    }
    return await db.select().from(studentPreviousDues).orderBy(desc(studentPreviousDues.recordedAt));
  }

  async createStudentPreviousDue(due: InsertStudentPreviousDues): Promise<StudentPreviousDues> {
    const [newDue] = await db.insert(studentPreviousDues).values(due).returning();
    return newDue;
  }

  async updateStudentPreviousDue(id: string, data: Partial<InsertStudentPreviousDues>): Promise<StudentPreviousDues> {
    const [updated] = await db.update(studentPreviousDues).set(data).where(eq(studentPreviousDues.id, id)).returning();
    return updated;
  }

  async deleteStudentPreviousDue(id: string): Promise<void> {
    await db.delete(studentPreviousDues).where(eq(studentPreviousDues.id, id));
  }

  // ============= PROMOTION OPERATIONS =============
  
  async getPromotionRuns(): Promise<PromotionRun[]> {
    return await db.select().from(promotionRuns).orderBy(desc(promotionRuns.createdAt));
  }

  async createPromotionRun(run: InsertPromotionRun): Promise<PromotionRun> {
    const [newRun] = await db.insert(promotionRuns).values(run).returning();
    return newRun;
  }

  async getStudentPromotionHistory(studentId?: string): Promise<StudentPromotionHistory[]> {
    if (studentId) {
      return await db.select().from(studentPromotionHistory).where(eq(studentPromotionHistory.studentId, studentId)).orderBy(desc(studentPromotionHistory.createdAt));
    }
    return await db.select().from(studentPromotionHistory).orderBy(desc(studentPromotionHistory.createdAt));
  }

  async createStudentPromotionHistory(history: InsertStudentPromotionHistory): Promise<StudentPromotionHistory> {
    const [newHistory] = await db.insert(studentPromotionHistory).values(history).returning();
    return newHistory;
  }

  async promoteStudents(program: string, fromSemester: number, toSemester: number, studentIds: string[], createdBy?: string): Promise<PromotionRun> {
    const [run] = await db.insert(promotionRuns).values({
      program,
      fromSemester,
      toSemester,
      promotedCount: studentIds.length,
      createdBy,
    }).returning();
    
    for (const studentId of studentIds) {
      await db.update(students).set({ semester: toSemester }).where(eq(students.id, studentId));
      await db.insert(studentPromotionHistory).values({
        runId: run.id,
        studentId,
        previousSemester: fromSemester,
        newSemester: toSemester,
      });
    }
    
    return run;
  }

  // ============= PAYROLL OPERATIONS =============
  
  async getSalaryTypes(): Promise<SalaryType[]> {
    return await db.select().from(salaryTypes).orderBy(desc(salaryTypes.createdAt));
  }

  async createSalaryType(salaryType: InsertSalaryType): Promise<SalaryType> {
    const [newType] = await db.insert(salaryTypes).values(salaryType).returning();
    return newType;
  }

  async updateSalaryType(id: string, salaryType: Partial<InsertSalaryType>): Promise<SalaryType> {
    const [updated] = await db.update(salaryTypes).set(salaryType).where(eq(salaryTypes.id, id)).returning();
    return updated;
  }

  async deleteSalaryType(id: string): Promise<void> {
    await db.delete(salaryTypes).where(eq(salaryTypes.id, id));
  }

  async getSalarySlips(): Promise<SalarySlip[]> {
    return await db.select().from(salarySlips).orderBy(desc(salarySlips.createdAt));
  }

  async getSalarySlipById(id: string): Promise<SalarySlip | undefined> {
    const [slip] = await db.select().from(salarySlips).where(eq(salarySlips.id, id));
    return slip;
  }

  async getSalarySlipsByStaff(staffId: string): Promise<SalarySlip[]> {
    return await db.select().from(salarySlips)
      .where(eq(salarySlips.staffId, staffId))
      .orderBy(desc(salarySlips.createdAt));
  }

  async getNextSlipNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const allSlips = await db.select({ slipNumber: salarySlips.slipNumber })
      .from(salarySlips)
      .where(sql`${salarySlips.year} = ${currentYear.toString()}`);
    
    const slipNumbers = allSlips
      .map(s => {
        const match = s.slipNumber?.match(/SS-(\d+)-\d+/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);
    
    const maxNumber = slipNumbers.length > 0 ? Math.max(...slipNumbers) : 0;
    return `SS-${String(maxNumber + 1).padStart(4, '0')}-${currentYear}`;
  }

  async createSalarySlip(slip: InsertSalarySlip): Promise<SalarySlip> {
    const [newSlip] = await db.insert(salarySlips).values(slip).returning();
    return newSlip;
  }

  async updateSalarySlip(id: string, slip: Partial<InsertSalarySlip>): Promise<SalarySlip> {
    const [updated] = await db.update(salarySlips).set(slip).where(eq(salarySlips.id, id)).returning();
    return updated;
  }

  async deleteSalarySlip(id: string): Promise<void> {
    await db.delete(salarySlips).where(eq(salarySlips.id, id));
  }

  // ============= LIBRARY OPERATIONS =============
  
  async getLibraryBooks(): Promise<LibraryBook[]> {
    return await db.select().from(libraryBooks).orderBy(desc(libraryBooks.createdAt));
  }

  async createLibraryBook(book: InsertLibraryBook): Promise<LibraryBook> {
    const [newBook] = await db.insert(libraryBooks).values(book).returning();
    return newBook;
  }

  async updateLibraryBook(id: string, book: Partial<InsertLibraryBook>): Promise<LibraryBook> {
    const [updated] = await db.update(libraryBooks).set(book).where(eq(libraryBooks.id, id)).returning();
    return updated;
  }

  async deleteLibraryBook(id: string): Promise<void> {
    await db.delete(libraryBooks).where(eq(libraryBooks.id, id));
  }

  async getLibraryIssues(): Promise<LibraryIssue[]> {
    return await db.select().from(libraryIssues).orderBy(desc(libraryIssues.createdAt));
  }

  async createLibraryIssue(issue: InsertLibraryIssue): Promise<LibraryIssue> {
    const [newIssue] = await db.insert(libraryIssues).values(issue).returning();
    return newIssue;
  }

  async updateLibraryIssue(id: string, issue: Partial<InsertLibraryIssue>): Promise<LibraryIssue> {
    const [updated] = await db.update(libraryIssues).set(issue).where(eq(libraryIssues.id, id)).returning();
    return updated;
  }

  async getLibraryFines(): Promise<LibraryFine[]> {
    return await db.select().from(libraryFines).orderBy(desc(libraryFines.createdAt));
  }

  async createLibraryFine(fine: InsertLibraryFine): Promise<LibraryFine> {
    const [newFine] = await db.insert(libraryFines).values(fine).returning();
    return newFine;
  }

  async updateLibraryFine(id: string, updates: Partial<InsertLibraryFine>): Promise<LibraryFine> {
    const [updated] = await db.update(libraryFines)
      .set(updates)
      .where(eq(libraryFines.id, id))
      .returning();
    return updated;
  }

  async getLibraryCopiesInventory(): Promise<LibraryCopiesInventory[]> {
    return await db.select().from(libraryCopiesInventory)
      .where(eq(libraryCopiesInventory.isActive, true))
      .orderBy(libraryCopiesInventory.itemName);
  }

  async createLibraryCopiesInventory(inventory: InsertLibraryCopiesInventory): Promise<LibraryCopiesInventory> {
    const [newInventory] = await db.insert(libraryCopiesInventory)
      .values(inventory)
      .returning();
    return newInventory;
  }

  async updateLibraryCopiesInventory(id: string, updates: Partial<InsertLibraryCopiesInventory>): Promise<LibraryCopiesInventory> {
    const [updated] = await db.update(libraryCopiesInventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(libraryCopiesInventory.id, id))
      .returning();
    return updated;
  }

  async createLibraryCopiesSale(sale: InsertLibraryCopiesSales): Promise<LibraryCopiesSales> {
    const [newSale] = await db.insert(libraryCopiesSales)
      .values(sale)
      .returning();
    
    // Update inventory stock
    await db.update(libraryCopiesInventory)
      .set({ 
        currentStock: sql`${libraryCopiesInventory.currentStock} - ${sale.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(libraryCopiesInventory.id, sale.inventoryId));
    
    // Record as income in income_expense table
    await db.insert(incomeExpense).values({
      type: 'income',
      amount: sale.totalAmount,
      date: sale.saleDate,
      description: `Library Copies: Sale of ${sale.quantity} units to ${sale.customerName}`,
    });
    
    return newSale;
  }

  async getLibraryCopiesSales(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = db.select({
      id: libraryCopiesSales.id,
      itemName: libraryCopiesInventory.itemName,
      itemType: libraryCopiesInventory.itemType,
      customerType: libraryCopiesSales.customerType,
      customerId: libraryCopiesSales.customerId,
      customerName: libraryCopiesSales.customerName,
      quantity: libraryCopiesSales.quantity,
      unitPrice: libraryCopiesSales.unitPrice,
      totalAmount: libraryCopiesSales.totalAmount,
      saleDate: libraryCopiesSales.saleDate,
      soldBy: libraryCopiesSales.soldBy,
      createdAt: libraryCopiesSales.createdAt,
    })
    .from(libraryCopiesSales)
    .leftJoin(libraryCopiesInventory, eq(libraryCopiesSales.inventoryId, libraryCopiesInventory.id));

    if (startDate && endDate) {
      const formatDateForSQL = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDateForSQL(startDate);
      const endDateStr = formatDateForSQL(endDate);
      
      return await query.where(
        and(
          sql`${libraryCopiesSales.saleDate} >= ${startDateStr}`,
          sql`${libraryCopiesSales.saleDate} <= ${endDateStr}`
        )
      ).orderBy(desc(libraryCopiesSales.saleDate));
    }

    return await query.orderBy(desc(libraryCopiesSales.saleDate));
  }

  // ============= ACCOUNTS OPERATIONS =============
  
  async getExpenseHeads(): Promise<ExpenseHead[]> {
    return await db.select().from(expenseHeads).orderBy(desc(expenseHeads.createdAt));
  }

  async createExpenseHead(head: InsertExpenseHead): Promise<ExpenseHead> {
    const [newHead] = await db.insert(expenseHeads).values(head).returning();
    return newHead;
  }

  async updateExpenseHead(id: string, head: Partial<InsertExpenseHead>): Promise<ExpenseHead> {
    const [updated] = await db.update(expenseHeads).set(head).where(eq(expenseHeads.id, id)).returning();
    return updated;
  }

  async deleteExpenseHead(id: string): Promise<void> {
    await db.delete(expenseHeads).where(eq(expenseHeads.id, id));
  }

  async getIncomeExpense(): Promise<IncomeExpense[]> {
    return await db.select().from(incomeExpense).orderBy(desc(incomeExpense.date));
  }

  async createIncomeExpense(record: InsertIncomeExpense): Promise<IncomeExpense> {
    const [newRecord] = await db.insert(incomeExpense).values(record).returning();
    return newRecord;
  }

  async updateIncomeExpense(id: string, record: Partial<InsertIncomeExpense>): Promise<IncomeExpense> {
    const [updated] = await db.update(incomeExpense).set(record).where(eq(incomeExpense.id, id)).returning();
    return updated;
  }

  async deleteIncomeExpense(id: string): Promise<void> {
    await db.delete(incomeExpense).where(eq(incomeExpense.id, id));
  }

  // ============= COMMUNICATION OPERATIONS =============
  
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  // ============= VISITOR OPERATIONS =============
  
  async getVisitors(): Promise<Visitor[]> {
    return await db.select().from(visitors).orderBy(desc(visitors.createdAt));
  }

  async createVisitor(visitor: InsertVisitor): Promise<Visitor> {
    const [newVisitor] = await db.insert(visitors).values(visitor).returning();
    return newVisitor;
  }

  async updateVisitor(id: string, visitor: Partial<InsertVisitor>): Promise<Visitor> {
    const [updated] = await db.update(visitors).set(visitor).where(eq(visitors.id, id)).returning();
    return updated;
  }

  async deleteVisitor(id: string): Promise<void> {
    await db.delete(visitors).where(eq(visitors.id, id));
  }

  // ============= INQUIRY OPERATIONS =============
  
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updated] = await db.update(inquiries).set(inquiry).where(eq(inquiries.id, id)).returning();
    return updated;
  }

  async deleteInquiry(id: string): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  // ============= PROGRAM OPERATIONS =============
  
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program> {
    const [updated] = await db.update(programs).set(program).where(eq(programs.id, id)).returning();
    return updated;
  }

  async deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  // ============= COURSE OPERATIONS =============

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course> {
    const [updated] = await db.update(courses).set(course).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // ============= BACKUP OPERATIONS =============
  
  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(desc(backups.createdAt));
  }

  async getBackup(id: string): Promise<Backup | undefined> {
    const [backup] = await db.select().from(backups).where(eq(backups.id, id));
    return backup;
  }

  async createBackup(backup: InsertBackup): Promise<Backup> {
    const [newBackup] = await db.insert(backups).values(backup).returning();
    return newBackup;
  }

  // ============= FEE REPORTING =============

  async getFeeReportData(startDate: Date, endDate: Date) {
    // Query 1: Aggregate paid fee payments by program
    const programFeesQuery = await db
      .select({
        programId: programs.id,
        programName: programs.name,
        programType: programs.type,
        totalCollected: sql<number>`COALESCE(SUM(CAST(${feePayments.amount} AS NUMERIC)), 0)`,
      })
      .from(feePayments)
      .innerJoin(feeVouchers, eq(feePayments.voucherId, feeVouchers.id))
      .innerJoin(students, eq(feeVouchers.studentId, students.id))
      .leftJoin(programs, eq(students.program, programs.name))
      .where(
        and(
          sql`${feePayments.paymentDate} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${feePayments.paymentDate} <= ${endDate.toISOString().split('T')[0]}`
        )
      )
      .groupBy(programs.id, programs.name, programs.type);

    // Convert to expected format with unknown type for missing programs
    const programFees = programFeesQuery.map(pf => ({
      programId: pf.programId,
      programName: pf.programName || 'Unknown Program',
      programType: (pf.programType || 'unknown') as 'group' | 'law' | 'unknown',
      totalCollected: parseFloat(pf.totalCollected.toString()),
    }));

    // Query 2: Get all expenses in date range
    const expensesQuery = await db
      .select({
        id: incomeExpense.id,
        date: incomeExpense.date,
        headId: incomeExpense.headId,
        amount: incomeExpense.amount,
        description: incomeExpense.description,
      })
      .from(incomeExpense)
      .where(
        and(
          eq(incomeExpense.type, 'expense'),
          sql`${incomeExpense.date} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${incomeExpense.date} <= ${endDate.toISOString().split('T')[0]}`
        )
      )
      .orderBy(desc(incomeExpense.date));

    const expenses = expensesQuery.map(e => ({
      id: e.id,
      date: e.date!,
      headId: e.headId,
      amount: parseFloat(e.amount.toString()),
      description: e.description,
    }));

    return {
      programFees,
      expenses,
    };
  }

  async getFinancialSummary(startDate?: Date, endDate?: Date) {
    // Default to current fiscal year (Jan 1 - Dec 31)
    // Use UTC dates to avoid timezone shifts
    const now = new Date();
    const defaultStartDate = startDate || new Date(Date.UTC(now.getFullYear(), 0, 1));
    const defaultEndDate = endDate || new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59));

    // Format dates as YYYY-MM-DD without timezone conversion
    const formatDateForSQL = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateForSQL(defaultStartDate);
    const endDateStr = formatDateForSQL(defaultEndDate);

    // Query 1: Get total fee income (paid fees only)
    const [feeIncomeResult] = await db
      .select({
        totalFeeIncome: sql<number>`COALESCE(SUM(CAST(${feePayments.amount} AS NUMERIC)), 0)`,
      })
      .from(feePayments)
      .where(
        and(
          sql`${feePayments.paymentDate} >= ${startDateStr}`,
          sql`${feePayments.paymentDate} <= ${endDateStr}`
        )
      );

    const feeIncome = feeIncomeResult?.totalFeeIncome ? parseFloat(feeIncomeResult.totalFeeIncome.toString()) : 0;

    // Query 2: Get other income from income_expense table
    const [otherIncomeResult] = await db
      .select({
        totalOtherIncome: sql<number>`COALESCE(SUM(CAST(${incomeExpense.amount} AS NUMERIC)), 0)`,
      })
      .from(incomeExpense)
      .where(
        and(
          eq(incomeExpense.type, 'income'),
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      );

    const otherIncome = otherIncomeResult?.totalOtherIncome ? parseFloat(otherIncomeResult.totalOtherIncome.toString()) : 0;

    // Query 3: Get total expenses from income_expense table
    const [expensesResult] = await db
      .select({
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${incomeExpense.amount} AS NUMERIC)), 0)`,
      })
      .from(incomeExpense)
      .where(
        and(
          eq(incomeExpense.type, 'expense'),
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      );

    const totalExpenses = expensesResult?.totalExpenses ? parseFloat(expensesResult.totalExpenses.toString()) : 0;

    // Query 4: Get monthly breakdown
    const monthlyFeesData = await db
      .select({
        month: sql<string>`TO_CHAR(${feePayments.paymentDate}, 'YYYY-MM')`,
        income: sql<number>`COALESCE(SUM(CAST(${feePayments.amount} AS NUMERIC)), 0)`,
      })
      .from(feePayments)
      .where(
        and(
          sql`${feePayments.paymentDate} >= ${startDateStr}`,
          sql`${feePayments.paymentDate} <= ${endDateStr}`
        )
      )
      .groupBy(sql`TO_CHAR(${feePayments.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${feePayments.paymentDate}, 'YYYY-MM')`);

    const monthlyIncomeExpenseData = await db
      .select({
        month: sql<string>`TO_CHAR(CAST(${incomeExpense.date} AS DATE), 'YYYY-MM')`,
        type: incomeExpense.type,
        total: sql<number>`COALESCE(SUM(CAST(${incomeExpense.amount} AS NUMERIC)), 0)`,
      })
      .from(incomeExpense)
      .where(
        and(
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      )
      .groupBy(sql`TO_CHAR(CAST(${incomeExpense.date} AS DATE), 'YYYY-MM')`, incomeExpense.type)
      .orderBy(sql`TO_CHAR(CAST(${incomeExpense.date} AS DATE), 'YYYY-MM')`);

    // Combine monthly data
    const monthsMap = new Map<string, { income: number; expenses: number }>();
    
    monthlyFeesData.forEach(row => {
      const month = row.month;
      if (!monthsMap.has(month)) {
        monthsMap.set(month, { income: 0, expenses: 0 });
      }
      monthsMap.get(month)!.income += parseFloat(row.income.toString());
    });

    monthlyIncomeExpenseData.forEach(row => {
      const month = row.month;
      if (!monthsMap.has(month)) {
        monthsMap.set(month, { income: 0, expenses: 0 });
      }
      if (row.type === 'income') {
        monthsMap.get(month)!.income += parseFloat(row.total.toString());
      } else {
        monthsMap.get(month)!.expenses += parseFloat(row.total.toString());
      }
    });

    const monthlyData = Array.from(monthsMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));

    // Query 5: Get category breakdown for income
    const incomeCategories = await db
      .select({
        headId: incomeExpense.headId,
        amount: sql<number>`COALESCE(SUM(CAST(${incomeExpense.amount} AS NUMERIC)), 0)`,
      })
      .from(incomeExpense)
      .where(
        and(
          eq(incomeExpense.type, 'income'),
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      )
      .groupBy(incomeExpense.headId);

    // Add fee income as a category
    const incomeCategoryBreakdown = [
      { category: 'Student Fees', amount: feeIncome },
      ...incomeCategories.map(cat => ({
        category: cat.headId || 'Other Income',
        amount: parseFloat(cat.amount.toString()),
      })),
    ].filter(cat => cat.amount > 0);

    // Query 6: Get category breakdown for expenses
    const expenseCategories = await db
      .select({
        headId: incomeExpense.headId,
        amount: sql<number>`COALESCE(SUM(CAST(${incomeExpense.amount} AS NUMERIC)), 0)`,
      })
      .from(incomeExpense)
      .where(
        and(
          eq(incomeExpense.type, 'expense'),
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      )
      .groupBy(incomeExpense.headId);

    const expenseCategoryBreakdown = expenseCategories.map(cat => ({
      category: cat.headId || 'Other Expense',
      amount: parseFloat(cat.amount.toString()),
    }));

    // Query 7: Get recent transactions (last 30 records)
    const recentTransactionsQuery = await db
      .select({
        id: incomeExpense.id,
        type: incomeExpense.type,
        headId: incomeExpense.headId,
        amount: incomeExpense.amount,
        date: incomeExpense.date,
        description: incomeExpense.description,
      })
      .from(incomeExpense)
      .where(
        and(
          sql`${incomeExpense.date} >= ${startDateStr}`,
          sql`${incomeExpense.date} <= ${endDateStr}`
        )
      )
      .orderBy(desc(incomeExpense.date))
      .limit(30);

    const recentTransactions = recentTransactionsQuery.map(txn => ({
      id: txn.id,
      type: txn.type as 'income' | 'expense',
      headId: txn.headId,
      amount: parseFloat(txn.amount.toString()),
      date: txn.date!,
      description: txn.description,
    }));

    // Calculate totals
    const totalIncome = feeIncome + otherIncome;
    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      feeIncome,
      otherIncome,
      totalExpenses,
      netBalance,
      monthlyData,
      categoryBreakdown: {
        income: incomeCategoryBreakdown,
        expenses: expenseCategoryBreakdown,
      },
      recentTransactions,
    };
  }

  // ============= CLASS TIMETABLE OPERATIONS =============
  
  async getClassTimetables(filters?: { program?: string; semester?: number }): Promise<ClassTimetable[]> {
    let query = db.select().from(classTimetables);
    if (filters?.program && filters?.semester) {
      return await db.select().from(classTimetables).where(
        and(
          eq(classTimetables.program, filters.program),
          eq(classTimetables.semester, filters.semester)
        )
      );
    } else if (filters?.program) {
      return await db.select().from(classTimetables).where(eq(classTimetables.program, filters.program));
    } else if (filters?.semester) {
      return await db.select().from(classTimetables).where(eq(classTimetables.semester, filters.semester));
    }
    return await db.select().from(classTimetables);
  }

  async getClassTimetable(id: string): Promise<ClassTimetable | undefined> {
    const [timetable] = await db.select().from(classTimetables).where(eq(classTimetables.id, id));
    return timetable;
  }

  async createClassTimetable(timetable: InsertClassTimetable): Promise<ClassTimetable> {
    const [created] = await db.insert(classTimetables).values(timetable).returning();
    return created;
  }

  async updateClassTimetable(id: string, timetable: Partial<InsertClassTimetable>): Promise<ClassTimetable> {
    const [updated] = await db.update(classTimetables).set(timetable).where(eq(classTimetables.id, id)).returning();
    return updated;
  }

  async deleteClassTimetable(id: string): Promise<void> {
    await db.delete(classTimetables).where(eq(classTimetables.id, id));
  }

  // ============= EXAM SCHEDULE OPERATIONS =============
  
  async getExamSchedules(filters?: { program?: string; semester?: number }): Promise<ExamSchedule[]> {
    if (filters?.program && filters?.semester) {
      return await db.select().from(examSchedules).where(
        and(
          eq(examSchedules.program, filters.program),
          eq(examSchedules.semester, filters.semester)
        )
      ).orderBy(examSchedules.examDate);
    } else if (filters?.program) {
      return await db.select().from(examSchedules).where(eq(examSchedules.program, filters.program)).orderBy(examSchedules.examDate);
    } else if (filters?.semester) {
      return await db.select().from(examSchedules).where(eq(examSchedules.semester, filters.semester)).orderBy(examSchedules.examDate);
    }
    return await db.select().from(examSchedules).orderBy(examSchedules.examDate);
  }

  async getExamSchedule(id: string): Promise<ExamSchedule | undefined> {
    const [schedule] = await db.select().from(examSchedules).where(eq(examSchedules.id, id));
    return schedule;
  }

  async createExamSchedule(schedule: InsertExamSchedule): Promise<ExamSchedule> {
    const [created] = await db.insert(examSchedules).values(schedule).returning();
    return created;
  }

  async updateExamSchedule(id: string, schedule: Partial<InsertExamSchedule>): Promise<ExamSchedule> {
    const [updated] = await db.update(examSchedules).set(schedule).where(eq(examSchedules.id, id)).returning();
    return updated;
  }

  async deleteExamSchedule(id: string): Promise<void> {
    await db.delete(examSchedules).where(eq(examSchedules.id, id));
  }

  // ============= SYSTEM SETTINGS OPERATIONS =============
  
  async getAllSettings(): Promise<SystemSettings[]> {
    return await db.select().from(systemSettings);
  }

  async getSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async upsertSetting(key: string, value: string): Promise<SystemSettings> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(systemSettings)
        .values({ key, value })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
