import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

// Dashboards
import AdminDashboard from "@/pages/dashboards/admin-dashboard";
import AccountantDashboard from "@/pages/dashboards/accountant-dashboard";
import StudentDashboard from "@/pages/dashboards/student-dashboard";
import TeacherDashboard from "@/pages/dashboards/teacher-dashboard";
import ReceptionistDashboard from "@/pages/dashboards/receptionist-dashboard";
import HazaraUniversityDashboard from "@/pages/dashboards/hazara-university-dashboard";
import PBCDashboard from "@/pages/dashboards/pbc-dashboard";

// Student Management
import StudentsList from "@/pages/students/students-list";
import AddStudent from "@/pages/students/add-student";
import StudentsListPrint from "@/pages/students/students-list-print";

// Staff Management
import StaffList from "@/pages/staff/staff-list";
import AddStaff from "@/pages/staff/add-staff";
import StaffListPrint from "@/pages/staff/staff-list-print";

// Fee Management
import FeeStructure from "@/pages/fees/fee-structure";
import FeeVouchers from "@/pages/fees/fee-vouchers";
import GenerateVouchers from "@/pages/fees/generate-vouchers";
import FeeVouchersPrint from "@/pages/fees/fee-vouchers-print";
import CollectFees from "@/pages/fees/collect-fees";
import IncomeExpensePrint from "@/pages/accounts/income-expense-print";

// Library
import LibraryBooks from "@/pages/library/library-books";
import LibraryBooksPrint from "@/pages/library/library-books-print";

// Attendance
import AttendanceTracker from "@/pages/attendance/attendance-tracker";

// Hazara University
import HazaraAttendanceReport from "@/pages/hazara/attendance-report";

// Pakistan Bar Council
import PBCAttendanceReport from "@/pages/pbc/attendance-report";

// Staff Management Pages
import UserManagement from "@/pages/staff/user-management";
import PermissionControl from "@/pages/staff/permission-control";
import StaffAttendanceReport from "@/pages/attendance/staff-attendance-report";

// Payroll
import SalaryTypes from "@/pages/payroll/salary-types";
import SalarySlips from "@/pages/payroll/salary-slips";

// Communication
import Notifications from "@/pages/communication/notifications";

// Admissions & Visitors
import InquiriesList from "@/pages/admissions/inquiries-list";
import InquiriesListPrint from "@/pages/admissions/inquiries-list-print";
import VisitorsList from "@/pages/visitors/visitors-list";
import VisitorsListPrint from "@/pages/visitors/visitors-list-print";
import NewAdmission from "@/pages/admissions/new-admission";
import AllAdmissions from "@/pages/admissions/all-admissions";
import AllAdmissionsPrint from "@/pages/admissions/all-admissions-print";
import AdmissionReports from "@/pages/admissions/admission-reports";
import CustomAdmissionForm from "@/pages/admissions/custom-form";

// Fee Reports
import IndividualFeeReport from "@/pages/fees/individual-report";
import ProgramFeeReport from "@/pages/fees/program-report";
import DailyFeeReport from "@/pages/fees/daily-report";
import DefaultersReport from "@/pages/fees/defaulters-report";
import FeeReceiptView from "@/pages/fees/fee-receipt-view";
import FeeVoucherView from "@/pages/fees/fee-voucher-view";
import ComprehensiveReports from "@/pages/fees/comprehensive-reports";
import MyVouchers from "@/pages/fees/my-vouchers";
import Receipts from "@/pages/fees/receipts";

// Accounts
import AccountsReports from "@/pages/accounts/reports";
import ExpenseHeads from "@/pages/accounts/expense-heads";
import IncomeExpense from "@/pages/accounts/income-expense";
import FinancialSummary from "@/pages/accounts/financial-summary";

// Programs
import AddProgram from "@/pages/programs/add-program";
import ManagePrograms from "@/pages/programs/manage-programs";
import ManageProgramsPrint from "@/pages/programs/manage-programs-print";
import CoursesManagement from "@/pages/programs/courses";
import AssignCourses from "@/pages/programs/assign-courses";

// Library
import IssueBooks from "@/pages/library/issue-books";
import CirculationReport from "@/pages/library/circulation-report";
import FineManagement from "@/pages/library/fine-management";
import LibraryReports from "@/pages/library/library-reports";
import CopiesSales from "@/pages/library/copies-sales";

// Students
import AttendanceReport from "@/pages/students/attendance-report";
import PerformanceReport from "@/pages/students/performance-report";
import StudentDetailView from "@/pages/students/student-detail-view";
import Grades from "@/pages/students/grades";
import GenerateIDCards from "@/pages/students/id-cards";
import Timetable from "@/pages/students/timetable";
import ExamSchedule from "@/pages/students/exam-schedule";

// Academics
import GradeEntry from "@/pages/academics/grade-entry";
import Assignments from "@/pages/academics/assignments";
import QuizzesManagement from "@/pages/academics/quizzes";
import ClassPromotion from "@/pages/academics/class-promotion";

// Previous Dues
import PreviousDues from "@/pages/fees/previous-dues";

// Settings
import Settings from "@/pages/settings/settings";

// Placeholder for pages under development
import Placeholder from "@/pages/placeholder";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-lg font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const Dashboard = () => {
    const role = user?.role || 'student';
    const dashboards: Record<string, any> = {
      admin: AdminDashboard,
      accountant: AccountantDashboard,
      student: StudentDashboard,
      receptionist: ReceptionistDashboard,
      teacher: TeacherDashboard,
      library_staff: AdminDashboard,
      hazara_university: HazaraUniversityDashboard,
      pbc: PBCDashboard,
    };
    const DashboardComponent = dashboards[role] || StudentDashboard;
    return <DashboardComponent />;
  };

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      
      {/* Hazara University Dashboard - accessible by admin */}
      <Route path="/hazara-dashboard" component={HazaraUniversityDashboard} />
      <Route path="/hazara/attendance-report" component={HazaraAttendanceReport} />
      
      {/* Pakistan Bar Council Dashboard - accessible by admin */}
      <Route path="/pbc-dashboard" component={PBCDashboard} />
      <Route path="/pbc/attendance-report" component={PBCAttendanceReport} />
      
      {/* Student Management */}
      <Route path="/students" component={StudentsList} />
      <Route path="/students/print" component={StudentsListPrint} />
      <Route path="/students/add" component={AddStudent} />
      <Route path="/students/view/:id" component={StudentDetailView} />
      <Route path="/students/records" component={StudentsList} />
      
      {/* Staff Management */}
      <Route path="/staff" component={StaffList} />
      <Route path="/staff/print" component={StaffListPrint} />
      <Route path="/staff/add" component={AddStaff} />
      <Route path="/staff/roles" component={() => <Placeholder title="Staff Roles" description="Manage staff roles and permissions" />} />
      <Route path="/staff/users" component={UserManagement} />
      <Route path="/staff/permissions" component={PermissionControl} />
      
      {/* Admissions & Visitors */}
      <Route path="/admissions/new" component={NewAdmission} />
      <Route path="/admissions/all" component={AllAdmissions} />
      <Route path="/admissions/all/print" component={AllAdmissionsPrint} />
      <Route path="/admissions/reports" component={AdmissionReports} />
      <Route path="/admissions/inquiries" component={InquiriesList} />
      <Route path="/admissions/inquiries/print" component={InquiriesListPrint} />
      <Route path="/admissions/inquiries/add" component={() => <Placeholder title="Add Inquiry" description="Create new admission inquiry" />} />
      <Route path="/admissions/custom-form" component={CustomAdmissionForm} />
      <Route path="/visitors" component={VisitorsList} />
      <Route path="/visitors/print" component={VisitorsListPrint} />
      <Route path="/visitors/add" component={() => <Placeholder title="Add Visitor" description="Register new visitor" />} />
      
      {/* Fee Management */}
      <Route path="/fees" component={FeeStructure} />
      <Route path="/fees/structure" component={FeeStructure} />
      <Route path="/fees/vouchers" component={FeeVouchers} />
      <Route path="/fees/vouchers/print" component={FeeVouchersPrint} />
      <Route path="/fees/vouchers/generate" component={GenerateVouchers} />
      <Route path="/fees/receipt/:id" component={FeeReceiptView} />
      <Route path="/fees/voucher/:id" component={FeeVoucherView} />
      <Route path="/fees/collect" component={CollectFees} />
      <Route path="/fees/reports/individual" component={IndividualFeeReport} />
      <Route path="/fees/reports/program" component={ProgramFeeReport} />
      <Route path="/fees/reports/daily" component={DailyFeeReport} />
      <Route path="/fees/reports/comprehensive" component={ComprehensiveReports} />
      <Route path="/fees/reports/defaulters" component={DefaultersReport} />
      <Route path="/fees/my-vouchers" component={MyVouchers} />
      <Route path="/fees/reports/weekly" component={() => <Placeholder title="Weekly Fee Report" description="Week-wise collection" />} />
      <Route path="/fees/reports/monthly" component={() => <Placeholder title="Monthly Fee Report" description="Month-wise collection" />} />
      <Route path="/fees/reports/yearly" component={() => <Placeholder title="Yearly Fee Report" description="Year-wise collection" />} />
      <Route path="/fees/reports/law-dept" component={() => <Placeholder title="Law Department Report" description="Department-wise fee report" />} />
      <Route path="/fees/previous-dues" component={PreviousDues} />
      <Route path="/fees/receipts" component={Receipts} />
      
      {/* Programs & Courses */}
      <Route path="/programs/add" component={AddProgram} />
      <Route path="/programs/manage" component={ManagePrograms} />
      <Route path="/programs/print" component={ManageProgramsPrint} />
      <Route path="/programs/courses" component={CoursesManagement} />
      <Route path="/programs/assign" component={AssignCourses} />
      
      {/* Accounts */}
      <Route path="/accounts/heads" component={ExpenseHeads} />
      <Route path="/accounts/records" component={IncomeExpense} />
      <Route path="/accounts/income-expense/print" component={IncomeExpensePrint} />
      <Route path="/accounts/reports" component={AccountsReports} />
      <Route path="/accounts/summary" component={FinancialSummary} />
      
      {/* Payroll */}
      <Route path="/payroll/types" component={SalaryTypes} />
      <Route path="/payroll/add" component={() => <Placeholder title="Add Salary" description="Create salary structure" />} />
      <Route path="/payroll/slips" component={SalarySlips} />
      <Route path="/payroll/approvals" component={() => <Placeholder title="Payroll Approvals" description="Approve salary slips" />} />
      <Route path="/payroll/reports" component={() => <Placeholder title="Payroll Reports" description="View payroll reports" />} />
      
      {/* Library */}
      <Route path="/library" component={LibraryBooks} />
      <Route path="/library/books" component={LibraryBooks} />
      <Route path="/library/books/print" component={LibraryBooksPrint} />
      <Route path="/library/catalog" component={LibraryBooks} />
      <Route path="/library/issue" component={IssueBooks} />
      <Route path="/library/return" component={() => <Placeholder title="Return Books" description="Return issued books" />} />
      <Route path="/library/fines" component={FineManagement} />
      <Route path="/library/reports/circulation" component={CirculationReport} />
      <Route path="/library/reports" component={LibraryReports} />
      <Route path="/library/sales-stock" component={CopiesSales} />
      <Route path="/library/members" component={() => <Placeholder title="Library Members" description="Manage library memberships" />} />
      
      {/* Student Reports */}
      <Route path="/students/attendance" component={AttendanceReport} />
      <Route path="/students/performance" component={PerformanceReport} />
      <Route path="/students/id-cards" component={GenerateIDCards} />
      
      {/* Attendance */}
      <Route path="/attendance" component={AttendanceTracker} />
      <Route path="/attendance/tracker" component={AttendanceTracker} />
      <Route path="/attendance/staff" component={StaffAttendanceReport} />
      <Route path="/attendance/daily" component={AttendanceTracker} />
      <Route path="/attendance/weekly" component={() => <Placeholder title="Weekly Attendance" description="View weekly attendance" />} />
      <Route path="/attendance/monthly" component={() => <Placeholder title="Monthly Attendance" description="View monthly attendance" />} />
      <Route path="/attendance/reports" component={() => <Placeholder title="Attendance Reports" description="Generate attendance reports" />} />
      <Route path="/classes/attendance" component={AttendanceTracker} />
      
      {/* Academics */}
      <Route path="/courses" component={() => <Placeholder title="Courses" description="Manage courses and programs" />} />
      <Route path="/timetable" component={Timetable} />
      <Route path="/grades" component={Grades} />
      <Route path="/academics/subjects" component={() => <Placeholder title="Subject Management" description="Manage academic subjects and courses" />} />
      <Route path="/academics/exams" component={ExamSchedule} />
      <Route path="/academics/grade-entry" component={GradeEntry} />
      <Route path="/academics/assignments" component={Assignments} />
      <Route path="/academics/quizzes" component={QuizzesManagement} />
      <Route path="/academics/promotion" component={ClassPromotion} />
      <Route path="/classes/grades" component={() => <Placeholder title="Manage Grades" description="Add and update grades" />} />
      <Route path="/classes/assignments" component={Assignments} />
      <Route path="/classes/reports" component={() => <Placeholder title="Class Reports" description="View class performance" />} />
      
      {/* Communication & Personal */}
      <Route path="/notifications" component={Notifications} />
      <Route path="/communication" component={Notifications} />
      <Route path="/messages" component={() => <Placeholder title="Messages" description="Send and receive messages" />} />
      <Route path="/profile" component={() => <Placeholder title="My Profile" description="View and edit your profile" />} />
      <Route path="/salary" component={() => <Placeholder title="My Salary" description="View your salary information" />} />
      
      {/* Settings */}
      <Route path="/settings" component={Settings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Custom sidebar width for professional layout - wider for better readability
  const style = {
    "--sidebar-width": "19rem",       // 304px for better readability on desktop
    "--sidebar-width-icon": "4rem",   // default icon width for mobile collapsed state
  };

  if (isLoading) {
    return (
      <TooltipProvider>
        <Toaster />
        <LoadingScreen />
      </TooltipProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between border-b border-border bg-background px-3 py-2.5 sm:px-4 md:px-6">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9 shrink-0" />
                <div className="flex items-center gap-2 md:hidden min-w-0">
                  <img src="/abbott-law-logo.jpg" alt="Abbott Law College" className="h-7 w-7 object-contain shrink-0" />
                  <span className="text-xs sm:text-sm font-heading font-bold text-foreground truncate">Abbott Law College</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-primary/10 text-primary capitalize">
                  {user?.role?.replace('_', ' ') || 'User'}
                </span>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
