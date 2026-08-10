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
  color?: string;
}

const roleMenus: Record<string, MenuSection[]> = {
  admin: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: "Admissions",
      items: [
        { 
          title: "Admissions", 
          icon: UserPlus,
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
          subItems: [
            { title: "Add Program", url: "/programs/add" },
            { title: "Manage Programs", url: "/programs" },
            { title: "Add Courses/Subjects", url: "/courses/add" },
            { title: "Assign Courses to Programs", url: "/programs/assign-courses" },
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
          subItems: [
            { title: "Student List", url: "/students" },
            { title: "Attendance Records", url: "/students/attendance" },
            { title: "Grades / Exam Results", url: "/students/grades" },
            { title: "Academic Performance Reports", url: "/students/performance" },
            { title: "Generate ID Cards", url: "/students/id-cards" },
          ]
        },
        { 
          title: "Staff", 
          icon: Users,
          subItems: [
            { title: "Add Staff", url: "/staff/add" },
            { title: "Manage Staff", url: "/staff" },
            { title: "Attendance Reports", url: "/staff/attendance" },
            { title: "User Management", url: "/staff/users" },
            { title: "Permission Control", url: "/staff/permissions" },
          ]
        },
        { 
          title: "Academics", 
          icon: Calendar,
          subItems: [
            { title: "Class Timetable", url: "/academics/timetable" },
            { title: "Subject Management", url: "/academics/subjects" },
            { title: "Exam Schedule", url: "/academics/exams" },
            { title: "Grade Entry", url: "/academics/grade-entry" },
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
          subItems: [
            { title: "Define Fee Structure", url: "/fees/structure" },
            { title: "Fee Vouchers", url: "/fees/vouchers" },
            { title: "Collect Fees", url: "/fees/collect" },
            { title: "Fee Reports", url: "/fees/reports" },
          ]
        },
        { 
          title: "Accounts", 
          icon: Calculator,
          subItems: [
            { title: "Record Income & Expenses", url: "/accounts/records" },
            { title: "Define Expense Heads", url: "/accounts/expense-heads" },
            { title: "Payroll Management", url: "/accounts/payroll" },
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
          subItems: [
            { title: "Book Management", url: "/library/books" },
            { title: "Circulation", url: "/library/circulation" },
            { title: "Fine Management", url: "/library/fines" },
            { title: "Sales & Stock", url: "/library/sales-stock" },
            { title: "Library Reports", url: "/library/reports" },
          ]
        },
      ]
    },
    {
      label: "System",
      items: [
        { 
          title: "Communication", 
          icon: MessageSquare,
          subItems: [
            { title: "Send Announcements", url: "/communication/announcements" },
            { title: "Message Center", url: "/communication/messages" },
          ]
        },
        { 
          title: "Settings", 
          icon: Settings,
          subItems: [
            { title: "Backup / Restore", url: "/settings/backup" },
            { title: "Define Categories", url: "/settings/categories" },
            { title: "Database Settings", url: "/settings/database" },
          ]
        },
      ]
    }
  ],
  accountant: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: "Fees Management",
      items: [
        { 
          title: "Fees", 
          icon: DollarSign,
          subItems: [
            { title: "Fee Vouchers", url: "/fees/vouchers" },
            { title: "Collect Fees", url: "/fees/collect" },
            { title: "Individual Student Report", url: "/fees/reports/individual" },
            { title: "Group / Program Report", url: "/fees/reports/program" },
            { title: "Law Department Report", url: "/fees/reports/law-department" },
            { title: "Daily Fee Report", url: "/fees/reports/daily" },
            { title: "Weekly Fee Report", url: "/fees/reports/weekly" },
            { title: "Monthly Fee Report", url: "/fees/reports/monthly" },
            { title: "Yearly Fee Report", url: "/fees/reports/yearly" },
            { title: "Fee Defaulters", url: "/fees/reports/defaulters" },
          ]
        },
      ]
    },
    {
      label: "Accounts & Payroll",
      items: [
        { 
          title: "Accounts", 
          icon: Calculator,
          subItems: [
            { title: "Add Income / Expense", url: "/accounts/records" },
            { title: "Define Expense Heads", url: "/accounts/expense-heads" },
            { title: "Daily Income Report", url: "/accounts/reports/daily" },
            { title: "Weekly Income Report", url: "/accounts/reports/weekly" },
            { title: "Monthly Income Report", url: "/accounts/reports/monthly" },
            { title: "Yearly Income Report", url: "/accounts/reports/yearly" },
          ]
        },
        { 
          title: "Payroll", 
          icon: Wallet,
          subItems: [
            { title: "Add Salary", url: "/payroll/add" },
            { title: "Generate Salary Slips", url: "/payroll/slips" },
            { title: "Salary Reports", url: "/payroll/reports" },
          ]
        },
        { 
          title: "Library Income", 
          icon: BookOpen,
          subItems: [
            { title: "Record Library Fines", url: "/library/fines" },
            { title: "Record Library Sales", url: "/library/sales" },
            { title: "Library Income Reports", url: "/library/income-reports" },
          ]
        },
      ]
    },
    {
      label: "Reports & Other",
      items: [
        { 
          title: "Reports", 
          icon: FileText,
          subItems: [
            { title: "Staff Attendance Report", url: "/reports/staff-attendance" },
            { title: "Financial Summary", url: "/reports/financial-summary" },
          ]
        },
        { 
          title: "Communication", 
          icon: MessageSquare,
          subItems: [
            { title: "Send Reminders", url: "/communication/reminders" },
            { title: "Notifications", url: "/communication/notifications" },
          ]
        },
      ]
    }
  ],
  receptionist: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: "Admissions & Front Desk",
      items: [
        { 
          title: "Admissions", 
          icon: UserPlus,
          subItems: [
            { title: "New Admission", url: "/admissions/new" },
            { title: "Custom Admission Form", url: "/admissions/custom-form" },
            { title: "View Admissions", url: "/admissions/all" },
          ]
        },
        { title: "Student Info", icon: GraduationCap, url: "/students" },
        { 
          title: "Visitors", 
          icon: ClipboardList,
          subItems: [
            { title: "Add Visitor", url: "/visitors/add" },
            { title: "View Visitors", url: "/visitors" },
          ]
        },
        { title: "Notifications", icon: Bell, url: "/communication/notifications" },
      ]
    }
  ],
  teacher: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "My Profile", icon: Users, url: "/profile" },
      ]
    },
    {
      label: "My Classes",
      items: [
        { 
          title: "Classes", 
          icon: GraduationCap,
          subItems: [
            { title: "Take Attendance", url: "/classes/attendance" },
            { title: "Add Grades", url: "/classes/grades" },
            { title: "Add Assignments", url: "/classes/assignments" },
            { title: "View Reports", url: "/classes/reports" },
          ]
        },
        { title: "My Salary", icon: Wallet, url: "/salary" },
        { title: "Library", icon: BookOpen, url: "/library" },
        { 
          title: "Communication", 
          icon: MessageSquare,
          subItems: [
            { title: "Send Messages", url: "/communication/send" },
            { title: "View Messages", url: "/communication/inbox" },
          ]
        },
      ]
    }
  ],
  library_staff: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: "Library Management",
      items: [
        { title: "Book Management", icon: BookOpen, url: "/library/books" },
        { 
          title: "Circulation", 
          icon: Library,
          subItems: [
            { title: "Issue Book", url: "/library/issue" },
            { title: "Return Book", url: "/library/return" },
          ]
        },
        { 
          title: "Fine Management", 
          icon: DollarSign,
          subItems: [
            { title: "Add Fine", url: "/library/fines/add" },
            { title: "View Fines", url: "/library/fines" },
          ]
        },
      ]
    },
    {
      label: "Sales & Stock",
      items: [
        { 
          title: "Sales & Stock Management", 
          icon: TrendingUp,
          subItems: [
            { title: "Add Stock", url: "/library/stock/add" },
            { title: "Manage Prices", url: "/library/stock/prices" },
            { title: "Record Sales", url: "/library/sales" },
            { title: "View Inventory", url: "/library/stock/inventory" },
          ]
        },
        { 
          title: "Sales Reports", 
          icon: FileText,
          subItems: [
            { title: "Daily Sales Report", url: "/library/sales/reports/daily" },
            { title: "Weekly Sales Report", url: "/library/sales/reports/weekly" },
            { title: "Monthly Sales Report", url: "/library/sales/reports/monthly" },
            { title: "Yearly Sales Report", url: "/library/sales/reports/yearly" },
          ]
        },
        { title: "Library Reports", icon: FileText, url: "/library/reports" },
        { title: "Library Members List", icon: Users, url: "/library/members" },
      ]
    }
  ],
  student: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "My Profile", icon: Users, url: "/profile" },
      ]
    },
    {
      label: "Academics",
      items: [
        { title: "My Courses", icon: GraduationCap, url: "/courses" },
        { title: "My Timetable", icon: Calendar, url: "/timetable" },
        { title: "My Grades", icon: FileText, url: "/grades" },
        { title: "Attendance", icon: Clock, url: "/attendance" },
      ]
    },
    {
      label: "Finance & Library",
      items: [
        { title: "Fee Details", icon: DollarSign, url: "/fees" },
        { 
          title: "Library", 
          icon: BookOpen,
          subItems: [
            { title: "Books", url: "/library/books" },
            { title: "Fines", url: "/library/fines" },
            { title: "Purchases", url: "/library/purchases" },
          ]
        },
        { title: "Notifications", icon: Bell, url: "/notifications" },
      ]
    }
  ],
  hazara_university: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ]
    },
    {
      label: "Attendance Monitoring",
      items: [
        { 
          title: "Student Attendance", 
          icon: Calendar,
          subItems: [
            { title: "Daily Attendance", url: "/attendance/daily" },
            { title: "Weekly Attendance", url: "/attendance/weekly" },
            { title: "Monthly Summary", url: "/attendance/monthly" },
          ]
        },
        { title: "Attendance Reports", icon: FileText, url: "/attendance/reports" },
      ]
    }
  ]
};

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const menuSections = roleMenus[role] || roleMenus.student;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
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
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary">
            <Building className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-heading font-semibold text-sidebar-foreground">Abbott Law College</h1>
            <p className="text-xs font-body text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.subItems ? (
                      <Collapsible defaultOpen className="group/collapsible">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full" data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            <item.icon className="h-4 w-4" />
                            <span className="font-heading">{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url} className="font-body" data-testid={`submenu-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {subItem.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild>
                        <Link href={item.url!} data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-heading">{item.title}</span>
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
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'User'} className="object-cover" />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold text-sidebar-foreground truncate" data-testid="text-user-name">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
            </p>
            <Badge variant="secondary" className="text-xs font-body h-5" data-testid="badge-user-role">
              {getRoleBadgeText(role)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/api/logout'}
            className="h-8 w-8"
            title="Logout"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
