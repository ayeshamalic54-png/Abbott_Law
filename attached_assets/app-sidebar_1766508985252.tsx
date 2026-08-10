import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Wallet, 
  BookOpen, 
  Calculator, 
  Calendar, 
  MessageSquare, 
  Settings,
  UserPlus,
  ClipboardList,
  FileText,
  Clock,
  Library,
  TrendingUp,
  Bell,
  LogOut,
  Building
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface MenuSection {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  url?: string;
  icon: any;
  subItems?: { title: string; url: string }[];
  gradient: string;
}

const roleMenus: Record<string, MenuSection[]> = {
  admin: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Admissions",
      items: [
        { 
          title: "Admissions", 
          icon: UserPlus,
          gradient: "from-purple-500 to-pink-600",
          subItems: [
            { title: "New Admission", url: "/admissions/new" },
            { title: "Custom Admission Form", url: "/admissions/custom-form" },
            { title: "All Admissions", url: "/admissions/all" },
            { title: "Admission Reports", url: "/admissions/reports" },
          ]
        },
        { 
          title: "Programs & Courses", 
          icon: BookOpen,
          gradient: "from-indigo-500 to-purple-600",
          subItems: [
            { title: "Add Program", url: "/programs/add" },
            { title: "Manage Programs", url: "/programs/manage" },
            { title: "Add Courses/Subjects", url: "/programs/courses" },
            { title: "Assign Courses to Programs", url: "/programs/assign" },
          ]
        },
      ]
    },
    {
      label: "Academic Management",
      items: [
        { 
          title: "Students", 
          icon: GraduationCap,
          gradient: "from-green-500 to-emerald-600",
          subItems: [
            { title: "Student List", url: "/students" },
            { title: "Mark Attendance", url: "/attendance/tracker" },
            { title: "Attendance Report", url: "/students/attendance" },
            { title: "Grades / Exam Results", url: "/grades" },
            { title: "Academic Performance Reports", url: "/students/performance" },
            { title: "Generate ID Cards", url: "/students/id-cards" },
          ]
        },
        { 
          title: "Staff", 
          icon: Users,
          gradient: "from-blue-600 to-indigo-600",
          subItems: [
            { title: "Add Staff", url: "/staff/add" },
            { title: "Manage Staff", url: "/staff" },
            { title: "Attendance Reports", url: "/attendance/staff" },
            { title: "User Management", url: "/staff/users" },
            { title: "Permission Control", url: "/staff/permissions" },
          ]
        },
        { 
          title: "Academics", 
          icon: Calendar,
          gradient: "from-teal-500 to-cyan-600",
          subItems: [
            { title: "Class Timetable", url: "/timetable" },
            { title: "Exam Schedule", url: "/academics/exams" },
            { title: "Assignments", url: "/academics/assignments" },
            { title: "Quizzes", url: "/academics/quizzes" },
            { title: "Grade Entry", url: "/academics/grade-entry" },
            { title: "Class Promotion", url: "/academics/promotion" },
          ]
        },
      ]
    },
    {
      label: "Financial Management",
      items: [
        { 
          title: "Fees", 
          icon: DollarSign,
          gradient: "from-orange-500 to-red-600",
          subItems: [
            { title: "Define Fee Structure", url: "/fees/structure" },
            { title: "Fee Vouchers", url: "/fees/vouchers" },
            { title: "Collect Fees", url: "/fees/collect" },
            { title: "Fee Receipts", url: "/fees/receipts" },
            { title: "Previous Dues", url: "/fees/previous-dues" },
            { title: "Comprehensive Report", url: "/fees/reports/comprehensive" },
            { title: "Individual Report", url: "/fees/reports/individual" },
            { title: "Program Report", url: "/fees/reports/program" },
            { title: "Daily Report", url: "/fees/reports/daily" },
            { title: "Defaulters Report", url: "/fees/reports/defaulters" },
          ]
        },
        { 
          title: "Accounts", 
          icon: Calculator,
          gradient: "from-yellow-500 to-orange-600",
          subItems: [
            { title: "Record Income & Expenses", url: "/accounts/records" },
            { title: "Define Expense Heads", url: "/accounts/heads" },
            { title: "Payroll Management", url: "/payroll/types" },
            { title: "Income & Expense Reports", url: "/accounts/reports" },
            { title: "Financial Summary", url: "/accounts/summary" },
          ]
        },
      ]
    },
    {
      label: "Library & Resources",
      items: [
        { 
          title: "Library", 
          icon: Library,
          gradient: "from-rose-500 to-pink-600",
          subItems: [
            { title: "Book Management", url: "/library/books" },
            { title: "Issue Books", url: "/library/issue" },
            { title: "Circulation Report", url: "/library/reports/circulation" },
            { title: "Fine Management", url: "/library/fines" },
            { title: "Library Reports", url: "/library/reports" },
            { title: "Sales & Stock", url: "/library/sales-stock" },
          ]
        },
      ]
    },
    {
      label: "University Portal",
      items: [
        { title: "Hazara University Dashboard", url: "/hazara-dashboard", icon: Building, gradient: "from-cyan-500 to-blue-600" },
        { title: "Attendance Report", url: "/hazara/attendance-report", icon: FileText, gradient: "from-purple-500 to-pink-600" },
      ]
    },
    {
      label: "System",
      items: [
        { 
          title: "Communication", 
          icon: MessageSquare,
          gradient: "from-violet-500 to-purple-600",
          subItems: [
            { title: "Send Notifications", url: "/notifications" },
            { title: "Message Center", url: "/messages" },
            { title: "Visitor Management", url: "/visitors" },
            { title: "Inquiries", url: "/inquiries" },
          ]
        },
        { title: "Settings", url: "/settings", icon: Settings, gradient: "from-slate-500 to-gray-600" },
      ]
    },
  ],
  // Add similar colorful gradients for other roles...
  accountant: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Admissions",
      items: [
        { title: "New Admission", url: "/admissions/new", icon: UserPlus, gradient: "from-purple-500 to-pink-600" },
        { title: "All Admissions", url: "/admissions/all", icon: ClipboardList, gradient: "from-green-500 to-emerald-600" },
      ]
    },
    {
      label: "Fee Management",
      items: [
        { title: "Fee Structure", url: "/fees/structure", icon: FileText, gradient: "from-green-500 to-emerald-600" },
        { title: "Generate Vouchers", url: "/fees/generate", icon: FileText, gradient: "from-blue-500 to-cyan-600" },
        { title: "Fee Vouchers", url: "/fees/vouchers", icon: ClipboardList, gradient: "from-purple-500 to-pink-600" },
        { title: "Collect Fees", url: "/fees/collect", icon: DollarSign, gradient: "from-orange-500 to-red-600" },
        { title: "Fee Receipts", url: "/fees/receipts", icon: FileText, gradient: "from-cyan-500 to-blue-600" },
        { title: "Previous Dues", url: "/fees/previous-dues", icon: Clock, gradient: "from-red-500 to-rose-600" },
        { 
          title: "Fee Reports", 
          icon: TrendingUp,
          gradient: "from-indigo-500 to-purple-600",
          subItems: [
            { title: "Comprehensive Report", url: "/fees/reports/comprehensive" },
            { title: "Individual Report", url: "/fees/reports/individual" },
            { title: "Program Report", url: "/fees/reports/program" },
            { title: "Daily Report", url: "/fees/reports/daily" },
            { title: "Defaulters Report", url: "/fees/reports/defaulters" },
          ]
        },
      ]
    },
    {
      label: "Accounts & Payroll",
      items: [
        { title: "Income & Expense", url: "/accounts/records", icon: Calculator, gradient: "from-teal-500 to-cyan-600" },
        { title: "Expense Heads", url: "/accounts/heads", icon: FileText, gradient: "from-blue-600 to-indigo-600" },
        { title: "Financial Summary", url: "/accounts/summary", icon: DollarSign, gradient: "from-green-500 to-emerald-600" },
        { title: "Salary Types", url: "/payroll/types", icon: Wallet, gradient: "from-yellow-500 to-orange-600" },
        { title: "Salary Slips", url: "/payroll/slips", icon: FileText, gradient: "from-rose-500 to-pink-600" },
        { title: "Payroll Reports", url: "/payroll/reports", icon: TrendingUp, gradient: "from-violet-500 to-purple-600" },
      ]
    },
  ],
  receptionist: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Student Management",
      items: [
        { title: "New Admission", url: "/admissions/new", icon: UserPlus, gradient: "from-purple-500 to-pink-600" },
        { title: "All Admissions", url: "/admissions/all", icon: ClipboardList, gradient: "from-green-500 to-emerald-600" },
        { title: "Student List", url: "/students", icon: GraduationCap, gradient: "from-indigo-500 to-purple-600" },
        { title: "Admission Reports", url: "/admissions/reports", icon: TrendingUp, gradient: "from-orange-500 to-red-600" },
      ]
    },
    {
      label: "Communication",
      items: [
        { title: "Visitor Management", url: "/visitors", icon: Users, gradient: "from-teal-500 to-cyan-600" },
        { title: "Send Notifications", url: "/notifications", icon: Bell, gradient: "from-violet-500 to-purple-600" },
        { title: "Inquiries", url: "/inquiries", icon: MessageSquare, gradient: "from-rose-500 to-pink-600" },
      ]
    },
  ],
  teacher: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Academic",
      items: [
        { title: "My Students", url: "/students", icon: GraduationCap, gradient: "from-green-500 to-emerald-600" },
        { title: "Attendance", url: "/students/attendance", icon: Clock, gradient: "from-purple-500 to-pink-600" },
        { title: "Grade Entry", url: "/academics/grade-entry", icon: FileText, gradient: "from-indigo-500 to-purple-600" },
        { title: "Class Timetable", url: "/timetable", icon: Calendar, gradient: "from-teal-500 to-cyan-600" },
        { title: "Exam Schedule", url: "/academics/exams", icon: ClipboardList, gradient: "from-orange-500 to-red-600" },
      ]
    },
    {
      label: "Reports",
      items: [
        { title: "Performance Reports", url: "/students/performance", icon: TrendingUp, gradient: "from-yellow-500 to-orange-600" },
        { title: "Attendance Reports", url: "/students/attendance", icon: FileText, gradient: "from-rose-500 to-pink-600" },
      ]
    },
  ],
  library_staff: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Library Management",
      items: [
        { title: "Book Management", url: "/library/books", icon: BookOpen, gradient: "from-purple-500 to-pink-600" },
        { title: "Issue Books", url: "/library/issue", icon: Library, gradient: "from-green-500 to-emerald-600" },
        { title: "Circulation Report", url: "/library/reports/circulation", icon: TrendingUp, gradient: "from-indigo-500 to-purple-600" },
        { title: "Fine Management", url: "/library/fines", icon: DollarSign, gradient: "from-orange-500 to-red-600" },
        { title: "Library Reports", url: "/library/reports", icon: FileText, gradient: "from-teal-500 to-cyan-600" },
      ]
    },
    {
      label: "Sales & Stock",
      items: [
        { title: "Sales & Stock", url: "/library/sales-stock", icon: Wallet, gradient: "from-yellow-500 to-orange-600" },
        { title: "Stock Reports", url: "/library/stock-reports", icon: ClipboardList, gradient: "from-rose-500 to-pink-600" },
      ]
    },
  ],
  student: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "My Account",
      items: [
        { title: "My Profile", url: "/profile", icon: Users, gradient: "from-purple-500 to-pink-600" },
        { title: "My Fee Vouchers", url: "/fees/my-vouchers", icon: FileText, gradient: "from-orange-500 to-red-600" },
        { title: "My Attendance", url: "/students/attendance", icon: Clock, gradient: "from-green-500 to-emerald-600" },
        { title: "My Grades", url: "/grades", icon: FileText, gradient: "from-indigo-500 to-purple-600" },
      ]
    },
    {
      label: "Academic",
      items: [
        { title: "Class Timetable", url: "/timetable", icon: Calendar, gradient: "from-teal-500 to-cyan-600" },
        { title: "Exam Schedule", url: "/academics/exams", icon: ClipboardList, gradient: "from-yellow-500 to-orange-600" },
        { title: "Library", url: "/library/books", icon: Library, gradient: "from-rose-500 to-pink-600" },
      ]
    },
  ],
  hazara_university: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard, gradient: "from-blue-500 to-cyan-600" },
      ]
    },
    {
      label: "Student Attendance",
      items: [
        { title: "Attendance Records", url: "/students/attendance", icon: Clock, gradient: "from-green-500 to-emerald-600" },
        { title: "Attendance Report", url: "/hazara/attendance-report", icon: FileText, gradient: "from-purple-500 to-pink-600" },
      ]
    },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  
  const menuSections = roleMenus[role] || roleMenus.student;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeText = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      accountant: 'Accountant',
      receptionist: 'Receptionist',
      teacher: 'Teacher',
      library_staff: 'Library Staff',
      student: 'Student',
      hazara_university: 'University'
    };
    return roleMap[role] || 'User';
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center shrink-0">
            <img 
              src="/abbott-law-logo.svg" 
              alt="Abbott Law College" 
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base md:text-lg font-heading font-extrabold text-sidebar-foreground truncate tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Abbott Law College</h1>
            <p className="text-xs sm:text-sm font-body font-medium text-sidebar-foreground/80" style={{ fontFamily: 'Poppins, sans-serif' }}>Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {menuSections.map((section) => (
          <SidebarGroup key={`${role}-${section.label}`}>
            <SidebarGroupLabel className="text-xs font-heading font-bold text-sidebar-foreground/60 uppercase tracking-wider px-3 py-2">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.subItems ? (
                      <Collapsible defaultOpen className="group/collapsible">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            className={`w-full bg-gradient-to-r ${item.gradient} text-white hover:opacity-90 hover:shadow-lg rounded-lg min-h-11 text-sm font-medium shadow-md transition-all px-3 py-2.5`}
                            data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className="font-heading font-semibold text-base flex-1 text-left">{item.title}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-3 mt-1 pl-3 space-y-1">
                            {item.subItems.map((subItem, subIdx) => {
                              // Create different gradient for each submenu item
                              const subGradients = [
                                'from-purple-500 to-pink-500',
                                'from-blue-500 to-indigo-500',
                                'from-green-500 to-teal-500',
                                'from-orange-500 to-red-500',
                                'from-cyan-500 to-blue-500',
                                'from-pink-500 to-rose-500',
                                'from-indigo-500 to-purple-500',
                                'from-teal-500 to-emerald-500',
                                'from-amber-500 to-orange-500',
                                'from-violet-500 to-purple-500',
                              ];
                              const subGradient = subGradients[subIdx % subGradients.length];
                              
                              return (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton asChild className={`bg-gradient-to-r ${subGradient} text-white hover:opacity-90 hover:shadow-md rounded-md min-h-10 text-sm px-3 py-2 shadow-sm transition-all`}>
                                    <Link href={subItem.url} className="font-body font-medium" data-testid={`submenu-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                      {subItem.title}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild className={`bg-gradient-to-r ${item.gradient} text-white hover:opacity-90 hover:shadow-lg rounded-lg min-h-11 text-sm font-medium shadow-md transition-all px-3 py-2.5`}>
                        <Link href={item.url!} data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="font-heading font-semibold text-base">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'User'} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm font-bold">
              {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-sidebar-foreground truncate leading-tight" data-testid="text-user-name">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
            </p>
            <Badge className="text-xs font-body h-6 mt-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 font-semibold" data-testid="badge-user-role">
              {getRoleBadgeText(role)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/api/logout'}
            className="h-9 w-9 shrink-0 hover-elevate text-sidebar-foreground"
            title="Logout"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
