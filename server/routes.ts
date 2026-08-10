// Reference: Local Auth (Traditional Login)
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupLocalAuth } from "./localAuth";
import { getSession } from "./replitAuth";
import { isAuthenticated, hasRole } from "./middleware";
import passport from "passport";
import { getDateRange, calculateFeeReport, type ReportPeriod } from "./services/reports";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  insertStudentSchema,
  insertStaffSchema,
  insertStudentAttendanceSchema,
  insertStaffAttendanceSchema,
  insertGradeSchema,
  insertAssignmentSchema,
  insertQuizSchema,
  insertFeeStructureSchema,
  insertFeeVoucherSchema,
  insertFeePaymentSchema,
  insertSalaryTypeSchema,
  insertSalarySlipSchema,
  insertLibraryBookSchema,
  insertLibraryIssueSchema,
  insertLibraryFineSchema,
  insertLibraryCopiesInventorySchema,
  insertLibraryCopiesSalesSchema,
  insertExpenseHeadSchema,
  insertIncomeExpenseSchema,
  insertNotificationSchema,
  insertVisitorSchema,
  insertInquirySchema,
  insertProgramSchema,
  insertCourseSchema,
  insertClassTimetableSchema,
  insertExamScheduleSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session and auth
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user for sessions
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Setup local authentication
  setupLocalAuth(app);

  // ============= AUTH ROUTES =============
  
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // req.user contains the full user object from database
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // ============= USER ROUTES =============
  
  app.get('/api/users', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ============= DASHBOARD ROUTES =============
  
  app.get('/api/dashboard/admin', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      const students = await storage.getStudents();
      const staff = await storage.getStaff();
      const feePayments = await storage.getFeePayments();
      const feeVouchers = await storage.getFeeVouchers();
      const incomeExpenseRecords = await storage.getIncomeExpense();
      
      // Separate LLB and Group students
      const llbStudents = students.filter(s => s.program?.toLowerCase().includes('llb'));
      const groupStudents = students.filter(s => !s.program?.toLowerCase().includes('llb'));
      const llbStudentIds = new Set(llbStudents.map(s => s.id));
      const groupStudentIds = new Set(groupStudents.map(s => s.id));
      
      // Get voucher to student mapping
      const voucherStudentMap = new Map<string, string>();
      feeVouchers.forEach(v => voucherStudentMap.set(v.id, v.studentId));
      
      // Separate fee payments by division
      const llbFeePayments = feePayments.filter(p => {
        const studentId = voucherStudentMap.get(p.voucherId);
        return studentId && llbStudentIds.has(studentId);
      });
      const groupFeePayments = feePayments.filter(p => {
        const studentId = voucherStudentMap.get(p.voucherId);
        return studentId && groupStudentIds.has(studentId);
      });
      
      // Calculate monthly revenue (current month) - separated by division
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const llbMonthlyRevenue = llbFeePayments
        .filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        
      const groupMonthlyRevenue = groupFeePayments
        .filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      
      // Calculate daily balance (today's income - today's expenses)
      const today = new Date().toISOString().split('T')[0];
      
      // Today's LLB fee collection
      const todayLlbFeeIncome = llbFeePayments
        .filter(payment => payment.paymentDate === today)
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        
      // Today's Group fee collection
      const todayGroupFeeIncome = groupFeePayments
        .filter(payment => payment.paymentDate === today)
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      
      // Today's recorded income from income_expense table (library, other income etc.)
      const todayRecordedIncome = incomeExpenseRecords
        .filter(record => record.type === 'income' && record.date === today)
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      // Today's expenses from income_expense table
      const todayExpenses = incomeExpenseRecords
        .filter(record => record.type === 'expense' && record.date === today)
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      // Calculate totals clearly
      const todayLlbIncome = todayLlbFeeIncome;
      const todayGroupFeeOnly = todayGroupFeeIncome; // Group fees only (no other income)
      const todayOtherIncome = todayRecordedIncome; // Canteen, library, etc.
      
      // Combined Report: LLB + Group fees + other income - expenses
      const combinedTotalIncome = todayLlbIncome + todayGroupFeeOnly + todayOtherIncome;
      const combinedBalance = combinedTotalIncome - todayExpenses;
      
      // Group Report: Group fees + other income - expenses (NO LLB)
      const groupTotalIncome = todayGroupFeeOnly + todayOtherIncome;
      const groupBalance = groupTotalIncome - todayExpenses;
      
      // LLB-only balance (no expenses deducted from LLB as per user's requirement)
      const llbBalance = todayLlbIncome;
      
      res.json({
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        totalStaff: staff.length,
        monthlyRevenue: Math.round(llbMonthlyRevenue + groupMonthlyRevenue),
        // Combined balance (LLB + Group + other - expenses)
        combinedBalance: Math.round(combinedBalance),
        combinedTotalIncome: Math.round(combinedTotalIncome),
        // Group-only balance (Group + other - expenses, no LLB)
        groupDailyBalance: Math.round(groupBalance),
        groupTotalIncome: Math.round(groupTotalIncome),
        // Daily balance (same as combined for backward compatibility)
        dailyBalance: Math.round(combinedBalance),
        // Separate values
        llbStudents: llbStudents.length,
        groupStudents: groupStudents.length,
        llbMonthlyRevenue: Math.round(llbMonthlyRevenue),
        groupMonthlyRevenue: Math.round(groupMonthlyRevenue),
        llbDailyBalance: Math.round(llbBalance),
        todayLlbIncome: Math.round(todayLlbIncome),
        todayGroupIncome: Math.round(todayGroupFeeOnly),
        todayOtherIncome: Math.round(todayOtherIncome),
        todayExpenses: Math.round(todayExpenses),
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Program-wise fee collection summary for dashboard
  app.get('/api/dashboard/program-fees', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const students = await storage.getStudents();
      const feePayments = await storage.getFeePayments();
      const feeVouchers = await storage.getFeeVouchers();
      
      // Build voucher to student mapping
      const voucherStudentMap = new Map<string, string>();
      feeVouchers.forEach(v => voucherStudentMap.set(v.id, v.studentId));
      
      // Group students by program
      const programGroups = new Map<string, typeof students>();
      students.forEach(student => {
        const program = student.program?.toLowerCase().includes('llb') ? 'LLB' : 'Abbott Group';
        if (!programGroups.has(program)) {
          programGroups.set(program, []);
        }
        programGroups.get(program)!.push(student);
      });
      
      const programFeeData: Array<{
        programName: string;
        totalStudents: number;
        collectedFees: number;
        pendingFees: number;
        totalFees: number;
      }> = [];
      
      programGroups.forEach((programStudents, programName) => {
        const studentIds = new Set(programStudents.map(s => s.id));
        
        // Get vouchers for this program's students
        const programVouchers = feeVouchers.filter(v => studentIds.has(v.studentId));
        
        // Calculate total fees from vouchers
        const totalFees = programVouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);
        
        // Get payments for this program's vouchers
        const programVoucherIds = new Set(programVouchers.map(v => v.id));
        const programPayments = feePayments.filter(p => programVoucherIds.has(p.voucherId));
        
        // Calculate collected fees
        const collectedFees = programPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
        // Pending fees = total - collected
        const pendingFees = Math.max(0, totalFees - collectedFees);
        
        programFeeData.push({
          programName,
          totalStudents: programStudents.length,
          collectedFees: Math.round(collectedFees),
          pendingFees: Math.round(pendingFees),
          totalFees: Math.round(totalFees),
        });
      });
      
      res.json(programFeeData);
    } catch (error) {
      console.error("Error fetching program fees:", error);
      res.status(500).json({ message: "Failed to fetch program fee data" });
    }
  });

  // Detailed daily report for printing
  app.get('/api/reports/daily', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const dateParam = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const students = await storage.getStudents();
      const feePayments = await storage.getFeePayments();
      const feeVouchers = await storage.getFeeVouchers();
      const incomeExpenseRecords = await storage.getIncomeExpense();
      const expenseHeads = await storage.getExpenseHeads();
      
      // Build student map for quick lookup
      const studentMap = new Map(students.map(s => [s.id, s]));
      
      // Build voucher to student mapping
      const voucherStudentMap = new Map<string, string>();
      feeVouchers.forEach(v => voucherStudentMap.set(v.id, v.studentId));
      
      // Build expense head map
      const headMap = new Map(expenseHeads.map(h => [h.id, h.name]));
      
      // Separate LLB and Group students
      const llbStudentIds = new Set(students.filter(s => s.program?.toLowerCase().includes('llb')).map(s => s.id));
      const groupStudentIds = new Set(students.filter(s => !s.program?.toLowerCase().includes('llb')).map(s => s.id));
      
      // Filter today's payments
      const todayPayments = feePayments.filter(p => p.paymentDate === dateParam);
      
      // Build detailed LLB payments
      const llbPayments = todayPayments
        .filter(p => {
          const studentId = voucherStudentMap.get(p.voucherId);
          return studentId && llbStudentIds.has(studentId);
        })
        .map(p => {
          const studentId = voucherStudentMap.get(p.voucherId);
          const student = studentId ? studentMap.get(studentId) : null;
          return {
            id: p.id,
            receiptNumber: p.receiptNumber,
            studentName: student ? student.fullName : 'Unknown',
            fatherName: student?.fatherName || '',
            rollNumber: student?.rollNumber || '',
            program: student?.program || '',
            semester: student?.semester || 1,
            amount: parseFloat(p.amount),
            paymentMethod: p.paymentMethod || 'Cash',
          };
        });
      
      // Build detailed Group payments
      const groupPayments = todayPayments
        .filter(p => {
          const studentId = voucherStudentMap.get(p.voucherId);
          return studentId && groupStudentIds.has(studentId);
        })
        .map(p => {
          const studentId = voucherStudentMap.get(p.voucherId);
          const student = studentId ? studentMap.get(studentId) : null;
          return {
            id: p.id,
            receiptNumber: p.receiptNumber,
            studentName: student ? student.fullName : 'Unknown',
            fatherName: student?.fatherName || '',
            rollNumber: student?.rollNumber || '',
            program: student?.program || '',
            semester: student?.semester || 1,
            amount: parseFloat(p.amount),
            paymentMethod: p.paymentMethod || 'Cash',
          };
        });
      
      // Build detailed other income
      const otherIncome = incomeExpenseRecords
        .filter(r => r.type === 'income' && r.date === dateParam)
        .map(r => ({
          id: r.id,
          description: r.description || 'Income',
          category: r.headId ? headMap.get(r.headId) || 'Other' : 'Other',
          amount: parseFloat(r.amount),
          referenceNumber: r.referenceNumber || '',
        }));
      
      // Build detailed expenses
      const expenses = incomeExpenseRecords
        .filter(r => r.type === 'expense' && r.date === dateParam)
        .map(r => ({
          id: r.id,
          description: r.description || 'Expense',
          category: r.headId ? headMap.get(r.headId) || 'Other' : 'Other',
          amount: parseFloat(r.amount),
          referenceNumber: r.referenceNumber || '',
        }));
      
      // Calculate totals
      const llbTotal = llbPayments.reduce((sum, p) => sum + p.amount, 0);
      const groupTotal = groupPayments.reduce((sum, p) => sum + p.amount, 0);
      const otherIncomeTotal = otherIncome.reduce((sum, i) => sum + i.amount, 0);
      const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      
      const combinedTotalIncome = llbTotal + groupTotal + otherIncomeTotal;
      const combinedBalance = combinedTotalIncome - expenseTotal;
      
      const groupTotalIncome = groupTotal + otherIncomeTotal;
      const groupBalance = groupTotalIncome - expenseTotal;
      
      res.json({
        date: dateParam,
        llbPayments,
        groupPayments,
        otherIncome,
        expenses,
        totals: {
          llbTotal: Math.round(llbTotal),
          groupTotal: Math.round(groupTotal),
          otherIncomeTotal: Math.round(otherIncomeTotal),
          expenseTotal: Math.round(expenseTotal),
          combinedTotalIncome: Math.round(combinedTotalIncome),
          combinedBalance: Math.round(combinedBalance),
          groupTotalIncome: Math.round(groupTotalIncome),
          groupBalance: Math.round(groupBalance),
        },
      });
    } catch (error) {
      console.error("Error fetching daily report:", error);
      res.status(500).json({ message: "Failed to fetch daily report" });
    }
  });

  app.get('/api/dashboard/accountant', isAuthenticated, hasRole('accountant'), async (req, res) => {
    try {
      res.json({
        todayCollection: 0,
        pendingFees: 0,
        monthlyExpenses: 0,
        salaryDue: 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/dashboard/student', isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      const user = req.user as any;
      const studentId = user?.studentId;
      
      let attendancePercentage = 0;
      let presentDays = 0;
      let totalDays = 0;
      let pendingAmount = 0;
      
      if (studentId) {
        const attendanceRecords = await storage.getStudentAttendance({ studentId });
        totalDays = attendanceRecords.length;
        presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        const studentVouchers = await storage.getFeeVouchersByStudent(studentId);
        pendingAmount = studentVouchers
          .filter(v => v.status === 'pending' || v.status === 'overdue')
          .reduce((sum, v) => sum + Number(v.amount || 0), 0);
      }
      
      res.json({
        attendancePercentage,
        presentDays,
        totalDays,
        pendingAmount,
        feeStatus: pendingAmount > 0 ? 'pending' : 'paid',
        booksIssued: 0,
        overdueBooks: 0,
        courses: [],
      });
    } catch (error) {
      console.error("Error fetching student dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/dashboard/teacher', isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      res.json({
        classes: [],
        todaySchedule: [],
        pendingTasks: 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/dashboard/receptionist', isAuthenticated, hasRole('receptionist'), async (req, res) => {
    try {
      res.json({
        newInquiries: 0,
        totalVisitors: 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // ============= STUDENT ROUTES =============
  
  app.get('/api/students', isAuthenticated, async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/students/:id', isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post('/api/students', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    let createdStudent: any = null;
    
    try {
      // Extract fee collection data from request (including partial payment amounts)
      const { 
        admissionFee, 
        prospectusFee, 
        admissionFeePayingNow,
        prospectusFeePayingNow,
        paymentMethod, 
        paymentDate, 
        receiptNumber, 
        ...studentData 
      } = req.body;
      
      // Validate student data
      const validatedData = insertStudentSchema.parse(studentData);
      
      // Create student
      createdStudent = await storage.createStudent(validatedData);
      
      // Create fee vouchers and payments if fee amounts are provided
      const createdPayments = [];
      
      try {
        if (admissionFee && parseFloat(admissionFee) > 0) {
          // Determine payment amount (partial or full)
          const payingNow = admissionFeePayingNow && parseFloat(admissionFeePayingNow) > 0 
            ? parseFloat(admissionFeePayingNow) 
            : parseFloat(admissionFee);
          const totalFee = parseFloat(admissionFee);
          const isFullyPaid = payingNow >= totalFee;
          
          // Generate voucher number
          const voucherNumber = `ADM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          // Create Admission Fee voucher (with total amount)
          const admissionVoucher = await storage.createFeeVoucher({
            voucherNumber,
            studentId: createdStudent.id,
            amount: admissionFee,
            dueDate: new Date().toISOString().split('T')[0],
            status: isFullyPaid ? "paid" : "pending",
          });
          
          // Create Admission Fee payment (with partial amount if applicable)
          const admissionPayment = await storage.createFeePayment({
            voucherId: admissionVoucher.id,
            amount: payingNow.toString(),
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod || "cash",
            receiptNumber: receiptNumber || undefined,
            remarks: isFullyPaid 
              ? "Admission Fee - Full payment at admission" 
              : `Admission Fee - Partial payment (Rs ${payingNow} of Rs ${totalFee})`,
          });
          
          createdPayments.push({ 
            type: "Admission Fee", 
            amount: payingNow.toString(), 
            totalAmount: admissionFee,
            remaining: (totalFee - payingNow).toString(),
            voucherId: admissionVoucher.id, 
            paymentId: admissionPayment.id,
            receipt: admissionPayment
          });
        }
        
        if (prospectusFee && parseFloat(prospectusFee) > 0) {
          // Determine payment amount (partial or full)
          const payingNow = prospectusFeePayingNow && parseFloat(prospectusFeePayingNow) > 0 
            ? parseFloat(prospectusFeePayingNow) 
            : parseFloat(prospectusFee);
          const totalFee = parseFloat(prospectusFee);
          const isFullyPaid = payingNow >= totalFee;
          
          // Generate voucher number
          const voucherNumber = `PRO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          // Create Prospectus Fee voucher (with total amount)
          const prospectusVoucher = await storage.createFeeVoucher({
            voucherNumber,
            studentId: createdStudent.id,
            amount: prospectusFee,
            dueDate: new Date().toISOString().split('T')[0],
            status: isFullyPaid ? "paid" : "pending",
          });
          
          // Create Prospectus Fee payment (with partial amount if applicable)
          const prospectusPayment = await storage.createFeePayment({
            voucherId: prospectusVoucher.id,
            amount: payingNow.toString(),
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod || "cash",
            receiptNumber: receiptNumber || undefined,
            remarks: isFullyPaid 
              ? "Prospectus Fee - Full payment at admission" 
              : `Prospectus Fee - Partial payment (Rs ${payingNow} of Rs ${totalFee})`,
          });
          
          createdPayments.push({ 
            type: "Prospectus Fee", 
            amount: payingNow.toString(), 
            totalAmount: prospectusFee,
            remaining: (totalFee - payingNow).toString(),
            voucherId: prospectusVoucher.id, 
            paymentId: prospectusPayment.id,
            receipt: prospectusPayment
          });
        }
      } catch (feeError: any) {
        // If fee creation fails, rollback by deleting the student
        console.error("Error creating fees, rolling back student creation:", feeError);
        if (createdStudent) {
          await storage.deleteStudent(createdStudent.id);
        }
        throw new Error(`Failed to process admission fees: ${feeError.message}`);
      }
      
      // Return response with student data, credentials, and fee payments
      res.status(201).json({ 
        id: createdStudent.id,
        rollNumber: createdStudent.rollNumber,
        fullName: createdStudent.fullName,
        program: createdStudent.program,
        credentials: createdStudent.credentials,
        feePayments: createdPayments 
      });
    } catch (error: any) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: error.message || "Failed to create student" });
    }
  });

  app.put('/api/students/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validatedData);
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update student" });
    }
  });

  app.delete('/api/students/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Promote students to next semester with previous dues calculation
  app.post('/api/students/promote', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const { studentIds, newSemester } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Please select students to promote" });
      }

      const results = [];
      const feeVouchers = await storage.getFeeVouchers();
      const feePayments = await storage.getFeePayments();

      for (const studentId of studentIds) {
        const student = await storage.getStudent(studentId);
        if (!student) continue;

        // Calculate unpaid dues from pending/overdue vouchers
        const studentVouchers = feeVouchers.filter(v => 
          v.studentId === studentId && 
          (v.status === 'pending' || v.status === 'overdue')
        );

        let totalUnpaid = 0;
        for (const voucher of studentVouchers) {
          const voucherPayments = feePayments.filter(p => p.voucherId === voucher.id);
          const paidAmount = voucherPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
          const remaining = parseFloat(voucher.amount) - paidAmount;
          if (remaining > 0) {
            totalUnpaid += remaining;
          }
        }

        // Add current unpaid to existing previous dues
        const existingDues = parseFloat(student.previousDues || '0');
        const newPreviousDues = existingDues + totalUnpaid;

        // Update student with new semester and previous dues
        const updatedStudent = await storage.updateStudent(studentId, {
          semester: newSemester || (student.semester || 0) + 1,
          previousDues: newPreviousDues.toString(),
        });

        results.push({
          studentId,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          newSemester: updatedStudent.semester,
          previousDues: newPreviousDues,
        });
      }

      res.json({ 
        message: `Successfully promoted ${results.length} students`,
        students: results 
      });
    } catch (error: any) {
      console.error("Error promoting students:", error);
      res.status(500).json({ message: error.message || "Failed to promote students" });
    }
  });

  // Get student previous dues
  app.get('/api/students/:id/dues', isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const feeVouchers = await storage.getFeeVouchers();
      const feePayments = await storage.getFeePayments();

      // Calculate current semester unpaid
      const studentVouchers = feeVouchers.filter(v => 
        v.studentId === req.params.id && 
        (v.status === 'pending' || v.status === 'overdue')
      );

      let currentUnpaid = 0;
      for (const voucher of studentVouchers) {
        const voucherPayments = feePayments.filter(p => p.voucherId === voucher.id);
        const paidAmount = voucherPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const remaining = parseFloat(voucher.amount) - paidAmount;
        if (remaining > 0) {
          currentUnpaid += remaining;
        }
      }

      res.json({
        studentId: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        previousDues: parseFloat(student.previousDues || '0'),
        currentUnpaid,
        totalDues: parseFloat(student.previousDues || '0') + currentUnpaid,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch student dues" });
    }
  });

  // ============= STAFF ROUTES =============
  
  app.get('/api/staff', isAuthenticated, async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post('/api/staff', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(validatedData);
      res.status(201).json(staff);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create staff" });
    }
  });

  app.put('/api/staff/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, validatedData);
      res.json(staff);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update staff" });
    }
  });

  app.delete('/api/staff/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteStaff(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff" });
    }
  });

  // ============= ATTENDANCE ROUTES =============
  
  // Get student attendance records (all records if no params, filtered if params provided)
  app.get('/api/attendance/student', isAuthenticated, async (req, res) => {
    try {
      const { studentId, date } = req.query;
      const attendance = await storage.getStudentAttendance({
        studentId: studentId as string,
        date: date as string,
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance/students', isAuthenticated, async (req, res) => {
    try {
      const { studentId, date } = req.query;
      const attendance = await storage.getStudentAttendance({
        studentId: studentId as string,
        date: date as string,
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance/students', isAuthenticated, hasRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertStudentAttendanceSchema.parse(req.body);
      const attendance = await storage.createStudentAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create attendance" });
    }
  });

  app.put('/api/attendance/students/:id', isAuthenticated, hasRole('admin', 'teacher'), async (req, res) => {
    try {
      const { status, remarks } = req.body;
      const attendance = await storage.updateStudentAttendanceById(req.params.id, { status, remarks });
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update attendance" });
    }
  });

  app.delete('/api/attendance/students/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteStudentAttendance(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete attendance" });
    }
  });

  app.get('/api/attendance/staff', isAuthenticated, async (req, res) => {
    try {
      const { staffId, date } = req.query;
      const attendance = await storage.getStaffAttendance({
        staffId: staffId as string,
        date: date as string,
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff attendance" });
    }
  });

  app.get('/api/attendance/staff/:date', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.params;
      const attendance = await storage.getStaffAttendance({ date });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff attendance" });
    }
  });

  app.post('/api/attendance/staff', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStaffAttendanceSchema.parse(req.body);
      const attendance = await storage.createStaffAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create staff attendance" });
    }
  });

  app.put('/api/attendance/staff/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const { status, remarks } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const attendance = await storage.updateStaffAttendanceById(req.params.id, { status, remarks });
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update staff attendance" });
    }
  });

  app.delete('/api/attendance/staff/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteStaffAttendance(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete staff attendance" });
    }
  });

  // ============= GRADE ROUTES =============
  
  app.get('/api/grades', isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.query;
      const grades = await storage.getGrades(studentId as string);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.post('/api/grades', isAuthenticated, hasRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create grade" });
    }
  });

  app.put('/api/grades/:id', isAuthenticated, hasRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(req.params.id, validatedData);
      res.json(grade);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update grade" });
    }
  });

  app.delete('/api/grades/:id', isAuthenticated, hasRole('admin', 'teacher'), async (req, res) => {
    try {
      await storage.deleteGrade(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete grade" });
    }
  });

  // ============= ASSIGNMENT ROUTES =============
  
  app.get('/api/assignments', isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/assignments/:id', isAuthenticated, async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  app.post('/api/assignments', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create assignment" });
    }
  });

  app.put('/api/assignments/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateAssignment(req.params.id, validatedData);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update assignment" });
    }
  });

  app.delete('/api/assignments/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteAssignment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete assignment" });
    }
  });

  // ============= QUIZ ROUTES =============

  app.get('/api/quizzes', isAuthenticated, async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:id', isAuthenticated, async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post('/api/quizzes', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create quiz" });
    }
  });

  app.put('/api/quizzes/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertQuizSchema.partial().parse(req.body);
      const quiz = await storage.updateQuiz(req.params.id, validatedData);
      res.json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update quiz" });
    }
  });

  app.delete('/api/quizzes/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete quiz" });
    }
  });

  // ============= CLASS TIMETABLE ROUTES =============

  app.get('/api/timetables', isAuthenticated, async (req, res) => {
    try {
      const { program, semester } = req.query;
      const filters: { program?: string; semester?: number } = {};
      if (program) filters.program = program as string;
      if (semester) filters.semester = parseInt(semester as string);
      const timetables = await storage.getClassTimetables(filters);
      res.json(timetables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timetables" });
    }
  });

  app.get('/api/timetables/:id', isAuthenticated, async (req, res) => {
    try {
      const timetable = await storage.getClassTimetable(req.params.id);
      if (!timetable) {
        return res.status(404).json({ message: "Timetable entry not found" });
      }
      res.json(timetable);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timetable entry" });
    }
  });

  app.post('/api/timetables', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertClassTimetableSchema.parse(req.body);
      const timetable = await storage.createClassTimetable(validatedData);
      res.status(201).json(timetable);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create timetable entry" });
    }
  });

  app.put('/api/timetables/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertClassTimetableSchema.partial().parse(req.body);
      const timetable = await storage.updateClassTimetable(req.params.id, validatedData);
      res.json(timetable);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update timetable entry" });
    }
  });

  app.delete('/api/timetables/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteClassTimetable(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete timetable entry" });
    }
  });

  // ============= EXAM SCHEDULE ROUTES =============

  app.get('/api/exam-schedules', isAuthenticated, async (req, res) => {
    try {
      const { program, semester } = req.query;
      const filters: { program?: string; semester?: number } = {};
      if (program) filters.program = program as string;
      if (semester) filters.semester = parseInt(semester as string);
      const schedules = await storage.getExamSchedules(filters);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam schedules" });
    }
  });

  app.get('/api/exam-schedules/:id', isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getExamSchedule(req.params.id);
      if (!schedule) {
        return res.status(404).json({ message: "Exam schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam schedule" });
    }
  });

  app.post('/api/exam-schedules', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertExamScheduleSchema.parse(req.body);
      const schedule = await storage.createExamSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create exam schedule" });
    }
  });

  app.put('/api/exam-schedules/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertExamScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateExamSchedule(req.params.id, validatedData);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update exam schedule" });
    }
  });

  app.delete('/api/exam-schedules/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteExamSchedule(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete exam schedule" });
    }
  });

  // ============= FEE ROUTES =============
  
  app.get('/api/fees/structures', isAuthenticated, async (req, res) => {
    try {
      const structures = await storage.getFeeStructures();
      res.json(structures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fee structures" });
    }
  });

  app.post('/api/fees/structures', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertFeeStructureSchema.parse(req.body);
      const structure = await storage.createFeeStructure(validatedData);
      res.status(201).json(structure);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create fee structure" });
    }
  });

  app.put('/api/fees/structures/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertFeeStructureSchema.partial().parse(req.body);
      const structure = await storage.updateFeeStructure(req.params.id, validatedData);
      res.json(structure);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update fee structure" });
    }
  });

  app.delete('/api/fees/structures/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteFeeStructure(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete fee structure" });
    }
  });

  app.get('/api/fees/vouchers', isAuthenticated, async (req, res) => {
    try {
      const vouchers = await storage.getFeeVouchers();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vouchers" });
    }
  });

  app.get('/api/fees/vouchers/:id', isAuthenticated, async (req, res) => {
    try {
      const voucher = await storage.getFeeVoucher(req.params.id);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      res.json(voucher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voucher" });
    }
  });

  app.post('/api/fees/vouchers', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertFeeVoucherSchema.parse(req.body);
      const voucher = await storage.createFeeVoucher(validatedData);
      res.status(201).json(voucher);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create voucher" });
    }
  });

  // Bulk voucher generation for entire class
  app.post('/api/fees/vouchers/bulk', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const { program, semester, feeStructureId, month, semesterPeriod, year, dueDate } = req.body;
      const periodLabel = semesterPeriod || month;
      
      // Get all active students matching the program and semester
      const allStudents = await storage.getStudents();
      const matchingStudents = allStudents.filter(s => 
        s.status === 'active' && 
        s.program === program && 
        s.semester === semester
      );

      if (matchingStudents.length === 0) {
        return res.status(404).json({ message: "No active students found for this program and semester" });
      }

      // Get fee structure details
      const feeStructures = await storage.getFeeStructures();
      const feeStructure = feeStructures.find(fs => fs.id === feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }

      // Generate vouchers for all matching students
      const createdVouchers = [];
      for (const student of matchingStudents) {
        const voucherNumber = await storage.getNextVoucherNumber();
        
        const voucher = await storage.createFeeVoucher({
          voucherNumber,
          studentId: student.id,
          amount: feeStructure.amount,
          month: periodLabel,
          dueDate: dueDate,
          status: 'pending',
        });
        
        createdVouchers.push(voucher);
      }

      const periodType = semesterPeriod ? `${semesterPeriod} Semester` : `${month}`;
      res.status(201).json({ 
        count: createdVouchers.length, 
        vouchers: createdVouchers,
        message: `Successfully generated ${createdVouchers.length} vouchers for ${program} - Semester ${semester} (${periodType} ${year})`
      });
    } catch (error: any) {
      console.error("Error generating bulk vouchers:", error);
      res.status(400).json({ message: error.message || "Failed to generate bulk vouchers" });
    }
  });

  // Individual voucher generation for single student
  app.post('/api/fees/vouchers/individual', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const { studentId, feeStructureId, month, semesterPeriod, year, dueDate } = req.body;
      const periodLabel = semesterPeriod || month;
      
      // Verify student exists and is active
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.status !== 'active') {
        return res.status(400).json({ message: "Cannot generate voucher for inactive student" });
      }

      // Get fee structure details
      const feeStructures = await storage.getFeeStructures();
      const feeStructure = feeStructures.find(fs => fs.id === feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }

      // Generate voucher
      const voucherNumber = await storage.getNextVoucherNumber();
      
      const voucher = await storage.createFeeVoucher({
        voucherNumber,
        studentId: studentId,
        amount: feeStructure.amount,
        month: periodLabel,
        dueDate: dueDate,
        status: 'pending',
      });

      const periodType = semesterPeriod ? `${semesterPeriod} Semester` : `${month}`;
      res.status(201).json({ 
        voucher,
        message: `Successfully generated ${periodType} ${year} voucher for ${student.fullName}`
      });
    } catch (error: any) {
      console.error("Error generating individual voucher:", error);
      res.status(400).json({ message: error.message || "Failed to generate voucher" });
    }
  });

  app.get('/api/fees/payments', isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getFeePayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get('/api/fees/payments/voucher/:voucherId', isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.getFeePaymentByVoucher(req.params.voucherId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.post('/api/fees/payments', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertFeePaymentSchema.parse(req.body);
      const payment = await storage.createFeePayment(validatedData);
      
      // Get voucher to calculate remaining balance
      const voucher = await storage.getFeeVoucher(validatedData.voucherId);
      if (voucher) {
        const totalPaid = await storage.getTotalPaidForVoucher(voucher.id);
        const netAmount = parseFloat(voucher.netAmount || voucher.amount);
        const remainingBalance = netAmount - totalPaid;
        
        // Update voucher status based on payment
        if (remainingBalance <= 0) {
          await storage.updateFeeVoucherStatus(voucher.id, 'paid');
        } else {
          await storage.updateFeeVoucherStatus(voucher.id, 'partial');
        }
        
        // Return payment with additional balance info
        res.status(201).json({
          ...payment,
          totalPaid: totalPaid.toString(),
          remainingBalance: Math.max(0, remainingBalance).toString(),
          voucherStatus: remainingBalance <= 0 ? 'paid' : 'partial'
        });
      } else {
        res.status(201).json(payment);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create payment" });
    }
  });

  // Delete fee payment (admin only)
  app.delete('/api/fees/payments/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteFeePayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Update fee voucher (admin only)
  app.put('/api/fees/vouchers/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const updated = await storage.updateFeeVoucher(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update voucher" });
    }
  });

  // Delete fee voucher (admin only)
  app.delete('/api/fees/vouchers/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteFeeVoucher(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete voucher" });
    }
  });

  // Delete receipt (admin only)
  app.delete('/api/receipts/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteReceipt(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // ============= FEE REPORTS ROUTES =============

  app.get('/api/reports/fees', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const period = (req.query.period as ReportPeriod) || 'monthly';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      // Validate period
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Must be: daily, weekly, monthly, or yearly" });
      }

      // Calculate date range
      const dateRange = getDateRange(period, startDate, endDate);

      // Get data from storage
      const { programFees, expenses } = await storage.getFeeReportData(dateRange.start, dateRange.end);

      // Calculate report with smart expense deduction
      const report = calculateFeeReport(
        programFees,
        expenses,
        period,
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0]
      );

      res.json(report);
    } catch (error: any) {
      console.error('Fee report error:', error);
      res.status(500).json({ message: error.message || "Failed to generate fee report" });
    }
  });

  // ============= RECEIPTS ROUTES =============
  
  app.get('/api/receipts', isAuthenticated, async (req, res) => {
    try {
      const allReceipts = await storage.getReceipts();
      res.json(allReceipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.get('/api/receipts/:id', isAuthenticated, async (req, res) => {
    try {
      const receipt = await storage.getReceipt(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });

  app.get('/api/receipts/student/:studentId', isAuthenticated, async (req, res) => {
    try {
      const studentReceipts = await storage.getReceiptsByStudent(req.params.studentId);
      res.json(studentReceipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student receipts" });
    }
  });

  app.post('/api/receipts', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const receiptNumber = await storage.getNextReceiptNumber();
      const user = req.user as any;
      const receipt = await storage.createReceipt({
        ...req.body,
        receiptNumber,
        collectedBy: user?.id,
      });
      res.status(201).json(receipt);
    } catch (error) {
      console.error('Receipt creation error:', error);
      res.status(500).json({ message: "Failed to create receipt" });
    }
  });

  // ============= PREVIOUS DUES ROUTES =============
  
  app.get('/api/fees/previous-dues', isAuthenticated, async (req, res) => {
    try {
      const studentId = req.query.studentId as string | undefined;
      const dues = await storage.getStudentPreviousDues(studentId);
      res.json(dues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch previous dues" });
    }
  });

  app.post('/api/fees/previous-dues', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const { studentId, amount, dueType, description } = req.body;
      const user = req.user as any;
      
      const due = await storage.createStudentPreviousDue({
        studentId,
        amount: amount.toString(),
        dueType: dueType || 'carry_forward',
        description,
        recordedBy: user?.id,
      });
      res.status(201).json(due);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to add previous dues" });
    }
  });

  app.put('/api/fees/previous-dues/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const updated = await storage.updateStudentPreviousDue(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update previous dues" });
    }
  });

  app.delete('/api/fees/previous-dues/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteStudentPreviousDue(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete previous dues" });
    }
  });

  // ============= PROMOTION ROUTES =============

  app.get('/api/promotion/preview', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const program = req.query.program as string;
      const fromSemester = parseInt(req.query.fromSemester as string);
      
      if (!program || isNaN(fromSemester)) {
        return res.status(400).json({ message: "Program and semester are required" });
      }
      
      const allStudents = await storage.getStudents();
      const eligibleStudents = allStudents.filter(s => 
        s.status === 'active' && 
        s.program === program && 
        s.semester === fromSemester
      );
      
      res.json(eligibleStudents);
    } catch (error) {
      res.status(500).json({ message: "Failed to preview promotion candidates" });
    }
  });

  app.post('/api/promotion/run', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const { program, fromSemester, toSemester, studentIds } = req.body;
      const user = req.user as any;
      
      if (!program || !fromSemester || !toSemester || !studentIds?.length) {
        return res.status(400).json({ message: "Program, semesters, and student IDs are required" });
      }
      
      const run = await storage.promoteStudents(program, fromSemester, toSemester, studentIds, user?.id);
      res.status(201).json(run);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to promote students" });
    }
  });

  app.get('/api/promotion/history', isAuthenticated, async (req, res) => {
    try {
      const runs = await storage.getPromotionRuns();
      res.json(runs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotion history" });
    }
  });

  // ============= PAYROLL ROUTES =============
  
  app.get('/api/payroll/types', isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getSalaryTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching salary types:", error);
      res.status(500).json({ message: "Failed to fetch salary types" });
    }
  });

  app.post('/api/payroll/types', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertSalaryTypeSchema.parse(req.body);
      const type = await storage.createSalaryType(validatedData);
      res.status(201).json(type);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create salary type" });
    }
  });

  app.put('/api/payroll/types/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertSalaryTypeSchema.partial().parse(req.body);
      const type = await storage.updateSalaryType(req.params.id, validatedData);
      res.json(type);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update salary type" });
    }
  });

  app.delete('/api/payroll/types/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteSalaryType(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete salary type" });
    }
  });

  app.get('/api/payroll/slips', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const slips = await storage.getSalarySlips();
      res.json(slips);
    } catch (error) {
      console.error("Error fetching salary slips:", error);
      res.status(500).json({ message: "Failed to fetch salary slips" });
    }
  });

  app.get('/api/payroll/slips/next-number', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const slipNumber = await storage.getNextSlipNumber();
      res.json({ slipNumber });
    } catch (error) {
      res.status(500).json({ message: "Failed to get next slip number" });
    }
  });

  app.get('/api/payroll/slips/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const slip = await storage.getSalarySlipById(req.params.id);
      if (!slip) {
        return res.status(404).json({ message: "Salary slip not found" });
      }
      res.json(slip);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary slip" });
    }
  });

  app.get('/api/payroll/slips/staff/:staffId', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const slips = await storage.getSalarySlipsByStaff(req.params.staffId);
      res.json(slips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary slips" });
    }
  });

  app.post('/api/payroll/slips', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertSalarySlipSchema.parse(req.body);
      const slip = await storage.createSalarySlip(validatedData);
      res.status(201).json(slip);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create salary slip" });
    }
  });

  app.put('/api/payroll/slips/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertSalarySlipSchema.partial().parse(req.body);
      const slip = await storage.updateSalarySlip(req.params.id, validatedData);
      res.json(slip);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update salary slip" });
    }
  });

  app.delete('/api/payroll/slips/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteSalarySlip(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete salary slip" });
    }
  });

  // ============= LIBRARY ROUTES =============
  
  app.get('/api/library/books', isAuthenticated, async (req, res) => {
    try {
      const books = await storage.getLibraryBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.post('/api/library/books', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const validatedData = insertLibraryBookSchema.parse(req.body);
      const book = await storage.createLibraryBook(validatedData);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create book" });
    }
  });

  app.patch('/api/library/books/:id', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const validatedData = insertLibraryBookSchema.partial().parse(req.body);
      
      // Get current book data
      const books = await storage.getLibraryBooks();
      const currentBook = books.find(b => b.id === req.params.id);
      if (!currentBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Calculate currently issued copies
      const issuedCopies = (currentBook.quantity || 0) - (currentBook.available || 0);
      
      // Calculate new totals after update
      const newTotal = validatedData.quantity ?? currentBook.quantity ?? 0;
      const newAvailable = validatedData.available ?? currentBook.available ?? 0;
      const newIssued = newTotal - newAvailable;
      
      // Validate that available doesn't exceed quantity
      if (newAvailable > newTotal) {
        return res.status(400).json({ 
          message: `Available copies (${newAvailable}) cannot exceed total copies (${newTotal}).` 
        });
      }
      
      // Validate that the implied issued count doesn't change (only issue/return operations can change this)
      if (newIssued !== issuedCopies) {
        return res.status(400).json({ 
          message: `Cannot modify book quantities. Currently ${issuedCopies} copies are issued. Your changes would imply ${newIssued} issued copies. Use issue/return operations to change issued counts.` 
        });
      }
      
      const book = await storage.updateLibraryBook(req.params.id, validatedData);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update book" });
    }
  });

  app.delete('/api/library/books/:id', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      // Check for active issues
      const activeIssues = await storage.getLibraryIssues();
      const hasActiveIssues = activeIssues.some(issue => 
        issue.bookId === req.params.id && issue.status !== 'returned'
      );
      
      if (hasActiveIssues) {
        return res.status(400).json({ 
          message: "Cannot delete book with active issues. Please return all issued copies first." 
        });
      }
      
      await storage.deleteLibraryBook(req.params.id);
      res.json({ message: "Book deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete book" });
    }
  });

  app.get('/api/library/issues', isAuthenticated, async (req, res) => {
    try {
      const issues = await storage.getLibraryIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch library issues" });
    }
  });

  app.post('/api/library/issues', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const validatedData = insertLibraryIssueSchema.parse(req.body);
      const issue = await storage.createLibraryIssue(validatedData);
      res.status(201).json(issue);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create issue" });
    }
  });

  app.get('/api/library/fines', isAuthenticated, async (req, res) => {
    try {
      const fines = await storage.getLibraryFines();
      res.json(fines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fines" });
    }
  });

  app.post('/api/library/fines', isAuthenticated, hasRole('admin', 'library_staff', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertLibraryFineSchema.parse(req.body);
      const fine = await storage.createLibraryFine(validatedData);
      res.status(201).json(fine);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create fine" });
    }
  });

  app.patch('/api/library/fines/:id', isAuthenticated, hasRole('admin', 'library_staff', 'accountant'), async (req, res) => {
    try {
      const { id } = req.params;
      const fine = await storage.updateLibraryFine(id, req.body);
      res.json(fine);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update fine" });
    }
  });

  // Library Copies Inventory Routes
  app.get('/api/library/copies-inventory', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getLibraryCopiesInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch copies inventory" });
    }
  });

  app.post('/api/library/copies-inventory', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const validatedData = insertLibraryCopiesInventorySchema.parse(req.body);
      const inventory = await storage.createLibraryCopiesInventory(validatedData);
      res.status(201).json(inventory);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create inventory item" });
    }
  });

  app.patch('/api/library/copies-inventory/:id', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const { id } = req.params;
      const inventory = await storage.updateLibraryCopiesInventory(id, req.body);
      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update inventory" });
    }
  });

  // Library Copies Sales Routes
  app.get('/api/library/copies-sales', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid startDate parameter" });
        }
      }

      if (endDate) {
        end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid endDate parameter" });
        }
      }

      const sales = await storage.getLibraryCopiesSales(start, end);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch copies sales" });
    }
  });

  app.post('/api/library/copies-sales', isAuthenticated, hasRole('admin', 'library_staff'), async (req, res) => {
    try {
      const validatedData = insertLibraryCopiesSalesSchema.parse(req.body);
      const sale = await storage.createLibraryCopiesSale(validatedData);
      res.status(201).json(sale);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create sale record" });
    }
  });

  // ============= ACCOUNTS ROUTES =============
  
  app.get('/api/accounts/expense-heads', isAuthenticated, async (req, res) => {
    try {
      const heads = await storage.getExpenseHeads();
      res.json(heads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense heads" });
    }
  });

  app.post('/api/accounts/expense-heads', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertExpenseHeadSchema.parse(req.body);
      const head = await storage.createExpenseHead(validatedData);
      res.status(201).json(head);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create expense head" });
    }
  });

  app.put('/api/accounts/expense-heads/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertExpenseHeadSchema.partial().parse(req.body);
      const head = await storage.updateExpenseHead(req.params.id, validatedData);
      res.json(head);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update expense head" });
    }
  });

  app.delete('/api/accounts/expense-heads/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      await storage.deleteExpenseHead(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete expense head" });
    }
  });

  app.get('/api/accounts/income-expense', isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getIncomeExpense();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch income/expense records" });
    }
  });

  app.post('/api/accounts/income-expense', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertIncomeExpenseSchema.parse(req.body);
      const record = await storage.createIncomeExpense(validatedData);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create record" });
    }
  });

  app.put('/api/accounts/income-expense/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertIncomeExpenseSchema.partial().parse(req.body);
      const record = await storage.updateIncomeExpense(req.params.id, validatedData);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update income/expense record" });
    }
  });

  app.delete('/api/accounts/income-expense/:id', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      await storage.deleteIncomeExpense(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete income/expense record" });
    }
  });

  app.get('/api/accounts/financial-summary', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      // Optional date range parameters with validation
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;

      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Invalid startDate parameter" });
        }
      }

      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "Invalid endDate parameter" });
        }
      }

      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ message: "startDate cannot be after endDate" });
      }

      const summary = await storage.getFinancialSummary(startDate, endDate);
      res.json(summary);
    } catch (error: any) {
      console.error('Financial summary error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch financial summary" });
    }
  });

  // ============= NOTIFICATION ROUTES =============
  
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, hasRole('admin', 'accountant'), async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create notification" });
    }
  });

  // ============= VISITOR ROUTES =============
  
  app.get('/api/visitors', isAuthenticated, async (req, res) => {
    try {
      const visitors = await storage.getVisitors();
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitors" });
    }
  });

  app.post('/api/visitors', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      const validatedData = insertVisitorSchema.parse(req.body);
      const visitor = await storage.createVisitor(validatedData);
      res.status(201).json(visitor);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create visitor" });
    }
  });

  app.put('/api/visitors/:id', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      const validatedData = insertVisitorSchema.partial().parse(req.body);
      const visitor = await storage.updateVisitor(req.params.id, validatedData);
      res.json(visitor);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update visitor" });
    }
  });

  app.delete('/api/visitors/:id', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      await storage.deleteVisitor(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete visitor" });
    }
  });

  // ============= INQUIRY ROUTES =============
  
  app.get('/api/inquiries', isAuthenticated, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.post('/api/inquiries', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create inquiry" });
    }
  });

  app.put('/api/inquiries/:id', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      const validatedData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, validatedData);
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update inquiry" });
    }
  });

  app.delete('/api/inquiries/:id', isAuthenticated, hasRole('admin', 'receptionist'), async (req, res) => {
    try {
      await storage.deleteInquiry(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  // ============= COURSE ROUTES =============
  
  app.get('/api/courses', isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create course" });
    }
  });

  app.put('/api/courses/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(req.params.id, validatedData);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update course" });
    }
  });

  app.delete('/api/courses/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // ============= PROGRAM ROUTES =============
  
  app.get('/api/programs', isAuthenticated, async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get('/api/programs/:id', isAuthenticated, async (req, res) => {
    try {
      const program = await storage.getProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch program" });
    }
  });

  app.post('/api/programs', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(validatedData);
      res.status(201).json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create program" });
    }
  });

  app.put('/api/programs/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const validatedData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(req.params.id, validatedData);
      res.json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update program" });
    }
  });

  app.delete('/api/programs/:id', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteProgram(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete program" });
    }
  });

  // ============= SYSTEM SETTINGS ROUTES =============
  
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      // Convert array to object for easier frontend use
      const settingsObj: Record<string, string> = {};
      settings.forEach(s => {
        if (s.value) settingsObj[s.key] = s.value;
      });
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const settings = req.body as Record<string, string>;
      // Save each setting (skip internal fields like _section)
      for (const [key, value] of Object.entries(settings)) {
        if (!key.startsWith('_')) {
          await storage.upsertSetting(key, value);
        }
      }
      res.json({ message: "Settings saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // ============= BACKUP ROUTES =============
  
  app.get('/api/backups', isAuthenticated, async (req, res) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  app.post('/api/backups/manual', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get ALL data for complete backup
      const users = await storage.getAllUsers();
      const students = await storage.getStudents();
      const staff = await storage.getStaff();
      const feeStructures = await storage.getFeeStructures();
      const feeVouchers = await storage.getFeeVouchers();
      const feePayments = await storage.getFeePayments();
      const libraryBooks = await storage.getLibraryBooks();
      const libraryIssues = await storage.getLibraryIssues();
      const libraryFines = await storage.getLibraryFines();
      const programs = await storage.getPrograms();
      const courses = await storage.getCourses();
      const studentAttendance = await storage.getStudentAttendance({});
      const staffAttendance = await storage.getStaffAttendance({});
      const grades = await storage.getGrades();
      const salaryTypes = await storage.getSalaryTypes();
      const salarySlips = await storage.getSalarySlips();
      const expenseHeads = await storage.getExpenseHeads();
      const incomeExpense = await storage.getIncomeExpense();
      const notifications = await storage.getNotifications();
      const visitors = await storage.getVisitors();
      const inquiries = await storage.getInquiries();
      
      // Create complete backup data structure
      const timestamp = new Date().getTime();
      const fileName = `abbott-law-full-backup-${timestamp}.json`;
      
      const fullBackupData = {
        metadata: {
          version: "2.0",
          fileName: fileName,
          createdAt: new Date().toISOString(),
          type: 'manual',
          application: "Abbott Law College Management System",
          backupType: "full"
        },
        data: {
          users: users.map(u => ({ ...u, password: undefined })),
          students,
          staff,
          programs,
          courses,
          feeStructures,
          feeVouchers,
          feePayments,
          libraryBooks,
          libraryIssues,
          libraryFines,
          studentAttendance,
          staffAttendance,
          grades,
          salaryTypes,
          salarySlips,
          expenseHeads,
          incomeExpense,
          notifications,
          visitors,
          inquiries
        }
      };
      
      const backupDataString = JSON.stringify(fullBackupData);
      const dataSize = backupDataString.length;
      const sizeInMB = (dataSize / (1024 * 1024)).toFixed(2);
      
      // Create backup record with actual data stored
      const backup = await storage.createBackup({
        filename: fileName,
        type: 'manual',
        size: `${sizeInMB} MB`,
        backupData: backupDataString,
      });
      
      res.status(201).json({
        ...backup,
        summary: {
          totalUsers: users.length,
          totalStudents: students.length,
          totalStaff: staff.length,
          totalPrograms: programs.length,
          totalCourses: courses.length,
          totalBooks: libraryBooks.length,
          totalAttendanceRecords: studentAttendance.length + staffAttendance.length
        }
      });
    } catch (error: any) {
      console.error("Backup error:", error);
      res.status(500).json({ message: error.message || "Failed to create backup" });
    }
  });

  app.get('/api/backups/:id/download', isAuthenticated, async (req, res) => {
    try {
      const backup = await storage.getBackup(req.params.id);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }
      
      // Use stored backup data if available
      if (backup.backupData) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
        res.send(backup.backupData);
      } else {
        // Fallback for old backups without stored data - fetch current data
        const users = await storage.getAllUsers();
        const students = await storage.getStudents();
        const staff = await storage.getStaff();
        const feeStructures = await storage.getFeeStructures();
        const feeVouchers = await storage.getFeeVouchers();
        const feePayments = await storage.getFeePayments();
        const libraryBooks = await storage.getLibraryBooks();
        const libraryIssues = await storage.getLibraryIssues();
        const libraryFines = await storage.getLibraryFines();
        const programs = await storage.getPrograms();
        const courses = await storage.getCourses();
        const studentAttendance = await storage.getStudentAttendance({});
        const staffAttendance = await storage.getStaffAttendance({});
        const grades = await storage.getGrades();
        const salaryTypes = await storage.getSalaryTypes();
        const salarySlips = await storage.getSalarySlips();
        const expenseHeads = await storage.getExpenseHeads();
        const incomeExpense = await storage.getIncomeExpense();
        const notifications = await storage.getNotifications();
        const visitors = await storage.getVisitors();
        const inquiries = await storage.getInquiries();
        
        const backupData = {
          metadata: {
            version: "2.0",
            fileName: backup.filename,
            createdAt: backup.createdAt,
            type: backup.type,
            application: "Abbott Law College Management System",
            backupType: "full",
            note: "Legacy backup - data fetched at download time"
          },
          data: {
            users: users.map(u => ({ ...u, password: undefined })),
            students, staff, programs, courses, feeStructures, feeVouchers,
            feePayments, libraryBooks, libraryIssues, libraryFines,
            studentAttendance, staffAttendance, grades, salaryTypes,
            salarySlips, expenseHeads, incomeExpense, notifications,
            visitors, inquiries
          }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
        res.send(JSON.stringify(backupData, null, 2));
      }
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ message: error.message || "Failed to download backup" });
    }
  });

  // Restore backup endpoint
  app.post('/api/backups/restore', isAuthenticated, async (req, res) => {
    try {
      const { backupData } = req.body;
      
      console.log("Restore request received, backupData keys:", backupData ? Object.keys(backupData) : 'null');
      console.log("backupData.data keys:", backupData?.data ? Object.keys(backupData.data) : 'null');
      console.log("Students count in backup:", backupData?.data?.students?.length || 0);
      
      if (!backupData || !backupData.data) {
        return res.status(400).json({ message: "Invalid backup file format" });
      }

      const results = {
        students: 0,
        staff: 0,
        programs: 0,
        courses: 0,
        feeStructures: 0,
        feeVouchers: 0,
        feePayments: 0,
        libraryBooks: 0,
        libraryIssues: 0,
        libraryFines: 0,
        studentAttendance: 0,
        staffAttendance: 0,
        grades: 0,
        salaryTypes: 0,
        salarySlips: 0,
        expenseHeads: 0,
        incomeExpense: 0,
        notifications: 0,
        visitors: 0,
        inquiries: 0,
        errors: [] as string[]
      };

      // Restore Programs first (other data may depend on them)
      if (backupData.data.programs && Array.isArray(backupData.data.programs)) {
        for (const program of backupData.data.programs) {
          try {
            await storage.createProgram({
              name: program.name,
              type: program.type || 'law',
              durationYears: program.durationYears || 3,
              totalSemesters: program.totalSemesters || 6,
              description: program.description
            });
            results.programs++;
          } catch (e: any) {
            if (!e.message?.includes('duplicate')) {
              results.errors.push(`Program: ${program.name} - ${e.message}`);
            }
          }
        }
      }

      // Restore Courses
      if (backupData.data.courses && Array.isArray(backupData.data.courses)) {
        for (const course of backupData.data.courses) {
          try {
            await storage.createCourse({
              name: course.name,
              code: course.code,
              credits: course.credits,
              description: course.description
            });
            results.courses++;
          } catch (e: any) {
            if (!e.message?.includes('duplicate')) {
              results.errors.push(`Course: ${course.name} - ${e.message}`);
            }
          }
        }
      }

      // Restore Students
      if (backupData.data.students && Array.isArray(backupData.data.students)) {
        // Get existing students once to check for duplicates
        const existingStudents = await storage.getStudents();
        const existingRollNumbers = new Set(existingStudents.map(s => s.rollNumber));
        
        console.log("Existing students in DB:", existingStudents.length);
        console.log("Students in backup:", backupData.data.students.length);
        
        // Find missing students
        const missingStudents = backupData.data.students.filter(
          (s: any) => !existingRollNumbers.has(s.rollNumber)
        );
        console.log("Missing students to restore:", missingStudents.length);
        if (missingStudents.length > 0) {
          console.log("Missing student names:", missingStudents.map((s: any) => s.fullName).join(", "));
        }
        
        for (const student of backupData.data.students) {
          try {
            if (!existingRollNumbers.has(student.rollNumber)) {
              console.log("Restoring student:", student.fullName, student.rollNumber);
              
              // Check for orphaned user account and delete it first
              const username = student.fullName
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
              
              const existingUsers = await db.select().from(users).where(eq(users.username, username));
              if (existingUsers.length > 0) {
                console.log("Found orphaned user, deleting:", username);
                await db.delete(users).where(eq(users.username, username));
              }
              
              await storage.createStudent({
                fullName: student.fullName,
                fatherName: student.fatherName,
                rollNumber: student.rollNumber,
                phone: student.phone,
                email: student.email,
                address: student.address,
                program: student.program,
                semester: student.semester,
                previousDues: student.previousDues,
                status: student.status || 'active'
              });
              results.students++;
              existingRollNumbers.add(student.rollNumber); // Track newly added
              console.log("Successfully restored:", student.fullName);
            }
          } catch (e: any) {
            const errMsg = e.message || String(e);
            console.log("Error restoring student:", student.fullName, errMsg);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Student: ${student.fullName} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Staff
      if (backupData.data.staff && Array.isArray(backupData.data.staff)) {
        for (const member of backupData.data.staff) {
          try {
            await storage.createStaff({
              fullName: member.fullName,
              employeeId: member.employeeId,
              designation: member.designation,
              department: member.department,
              phone: member.phone,
              email: member.email,
              address: member.address,
              joiningDate: member.joiningDate,
              status: member.status || 'active'
            });
            results.staff++;
          } catch (e: any) {
            if (!e.message?.includes('duplicate')) {
              results.errors.push(`Staff: ${member.fullName} - ${e.message}`);
            }
          }
        }
      }

      // Restore Library Books
      if (backupData.data.libraryBooks && Array.isArray(backupData.data.libraryBooks)) {
        for (const book of backupData.data.libraryBooks) {
          try {
            await storage.createLibraryBook({
              isbn: book.isbn,
              title: book.title,
              author: book.author,
              category: book.category,
              copies: book.copies || book.totalCopies,
              quantity: book.quantity || book.totalCopies,
              available: book.available || book.availableCopies,
              location: book.location || book.shelfLocation
            });
            results.libraryBooks++;
          } catch (e: any) {
            if (!e.message?.includes('duplicate')) {
              results.errors.push(`Book: ${book.title} - ${e.message}`);
            }
          }
        }
      }

      // Restore Fee Structures
      if (backupData.data.feeStructures && Array.isArray(backupData.data.feeStructures)) {
        for (const fee of backupData.data.feeStructures) {
          try {
            if (!fee.name && !fee.feeType) {
              results.errors.push(`Fee Structure: Missing required name field`);
              continue;
            }
            if (!fee.amount) {
              results.errors.push(`Fee Structure: ${fee.name || fee.feeType} - Missing required amount field`);
              continue;
            }
            await storage.createFeeStructure({
              name: fee.name || fee.feeType,
              program: fee.program,
              semester: fee.semester,
              feeType: fee.feeType,
              amount: String(fee.amount),
              paymentType: fee.paymentType,
              description: fee.description
            });
            results.feeStructures++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Fee Structure: ${fee.name || fee.feeType} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Salary Types
      if (backupData.data.salaryTypes && Array.isArray(backupData.data.salaryTypes)) {
        for (const salaryType of backupData.data.salaryTypes) {
          try {
            if (!salaryType.name) {
              results.errors.push(`Salary Type: Missing required name field`);
              continue;
            }
            const baseSal = salaryType.baseSalary || salaryType.basicSalary;
            await storage.createSalaryType({
              name: salaryType.name,
              description: salaryType.description,
              baseSalary: baseSal ? String(baseSal) : undefined,
              allowances: salaryType.allowances ? String(salaryType.allowances) : undefined,
              deductions: salaryType.deductions ? String(salaryType.deductions) : undefined
            });
            results.salaryTypes++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Salary Type: ${salaryType.name} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Expense Heads
      if (backupData.data.expenseHeads && Array.isArray(backupData.data.expenseHeads)) {
        for (const head of backupData.data.expenseHeads) {
          try {
            await storage.createExpenseHead({
              name: head.name,
              category: head.category || head.type,
              description: head.description
            });
            results.expenseHeads++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Expense Head: ${head.name} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Visitors
      if (backupData.data.visitors && Array.isArray(backupData.data.visitors)) {
        for (const visitor of backupData.data.visitors) {
          try {
            if (!visitor.name) {
              results.errors.push(`Visitor: Missing required name field`);
              continue;
            }
            await storage.createVisitor({
              name: visitor.name,
              phone: visitor.phone,
              purpose: visitor.purpose,
              visitDate: visitor.visitDate || visitor.date || new Date().toISOString().split('T')[0],
              remarks: visitor.remarks || visitor.personToMeet,
              checkIn: visitor.checkIn,
              checkOut: visitor.checkOut
            });
            results.visitors++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Visitor: ${visitor.name} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Inquiries
      if (backupData.data.inquiries && Array.isArray(backupData.data.inquiries)) {
        for (const inquiry of backupData.data.inquiries) {
          try {
            await storage.createInquiry({
              name: inquiry.name,
              phone: inquiry.phone,
              email: inquiry.email,
              program: inquiry.program,
              message: inquiry.message,
              status: inquiry.status
            });
            results.inquiries++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Inquiry: ${inquiry.name} - ${errMsg}`);
            }
          }
        }
      }

      // Restore Notifications
      if (backupData.data.notifications && Array.isArray(backupData.data.notifications)) {
        for (const notification of backupData.data.notifications) {
          try {
            await storage.createNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type,
              targetRole: notification.targetRole
            });
            results.notifications++;
          } catch (e: any) {
            const errMsg = e.message || String(e);
            if (!errMsg.includes('duplicate') && !errMsg.includes('unique')) {
              results.errors.push(`Notification: ${notification.title} - ${errMsg}`);
            }
          }
        }
      }

      // Note: Fee vouchers, fee payments, grades, attendance, salary slips, library issues/fines, 
      // and income/expense records are dependent on student/staff IDs which may differ after restore.
      // These are best restored manually or through a full database restore.

      console.log("Restore completed:", results);

      res.json({
        success: true,
        message: "Backup restored successfully",
        restored: results
      });
    } catch (error: any) {
      console.error("Restore error:", error);
      res.status(500).json({ message: error.message || "Failed to restore backup" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
