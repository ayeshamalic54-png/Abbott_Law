import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, DollarSign, AlertCircle, TrendingUp, Calendar, FileText, BookOpen, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  monthlyRevenue: number;
  dailyBalance: number;
  activeStudents: number;
  todayAttendance: number;
  // Separate LLB and Group data
  llbStudents: number;
  groupStudents: number;
  llbMonthlyRevenue: number;
  groupMonthlyRevenue: number;
  llbDailyBalance: number;
  groupDailyBalance: number;
  todayLlbIncome: number;
  todayGroupIncome: number;
  todayExpenses: number;
  unallocatedExpenses: number;
}

interface ProgramFeeData {
  programName: string;
  totalStudents: number;
  collectedFees: number;
  pendingFees: number;
  totalFees: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/admin'],
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: feeData = [] } = useQuery<ProgramFeeData[]>({
    queryKey: ['/api/dashboard/program-fees'],
  });

  // Calculate LLB student counts by year
  const llbStudents = students.filter((s: any) => s.program?.toLowerCase().includes('llb'));
  const llbByYear = {
    total: llbStudents.length,
    first: llbStudents.filter((s: any) => s.currentYear === 1).length,
    second: llbStudents.filter((s: any) => s.currentYear === 2).length,
    third: llbStudents.filter((s: any) => s.currentYear === 3).length,
    final: llbStudents.filter((s: any) => s.currentYear === 4 || s.currentYear === 5).length,
  };

  // Calculate Abbott Group student counts (non-LLB programs)
  const groupStudents = students.filter((s: any) => !s.program?.toLowerCase().includes('llb'));
  const groupByProgram = {
    total: groupStudents.length,
    education: groupStudents.filter((s: any) => 
      s.program?.toLowerCase().includes('education') || 
      s.program?.toLowerCase().includes('b.ed') ||
      s.program?.toLowerCase().includes('ddm')
    ).length,
    physical: groupStudents.filter((s: any) => 
      s.program?.toLowerCase().includes('physical') || 
      s.program?.toLowerCase().includes('jdpe') ||
      s.program?.toLowerCase().includes('adpe')
    ).length,
  };

  // Get fee summary
  const llbFees = feeData.find(p => p.programName?.toLowerCase().includes('llb'));
  const otherFees = feeData.filter(p => !p.programName?.toLowerCase().includes('llb'));
  const totalOtherCollected = otherFees.reduce((sum, p) => sum + p.collectedFees, 0);
  const totalOtherPending = otherFees.reduce((sum, p) => sum + p.pendingFees, 0);

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      description: `${stats?.activeStudents || 0} active`,
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "Total Staff",
      value: stats?.totalStaff || 0,
      icon: Users,
      description: "Faculty & Staff",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Monthly Revenue",
      value: `Rs ${stats?.monthlyRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      description: "Current month",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Daily Balance",
      value: `Rs ${stats?.dailyBalance?.toLocaleString() || 0}`,
      icon: Wallet,
      description: "Today's income - expenses",
      color: stats?.dailyBalance && stats.dailyBalance >= 0 ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600",
    },
  ];

  const quickActions = [
    { label: "Add Student", href: "/students/add", icon: GraduationCap, color: "from-blue-500 to-cyan-600" },
    { label: "Add Staff", href: "/staff/add", icon: Users, color: "from-purple-500 to-pink-600" },
    { label: "Generate Vouchers", href: "/fees/vouchers", icon: FileText, color: "from-green-500 to-emerald-600" },
    { label: "View Reports", href: "/accounts/reports", icon: TrendingUp, color: "from-orange-500 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <img 
              src="/abbott-law-logo.svg" 
              alt="Abbott Law College" 
              className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" data-testid="heading-dashboard" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Welcome back! Here's your system overview.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-700 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card 
                key={card.title} 
                className="group relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-heading font-semibold text-slate-700 dark:text-slate-200">{card.title}</CardTitle>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-1" data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {card.value}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* LLB & Abbott Group Student Widgets */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* LLB Program Widget */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                LLB Program
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Bachelor of Laws - Hazara University</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total LLB Students</p>
                    <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1" data-testid="stat-llb-students">{llbByYear.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">1st Year</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{llbByYear.first}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">2nd Year</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{llbByYear.second}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">3rd Year</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{llbByYear.third}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Final Year</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{llbByYear.final}</p>
                  </div>
                </div>
                <Link href="/students?category=llb">
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                    data-testid="button-view-llb-students"
                  >
                    View LLB Students
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Abbott Group Widget */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Abbott Group
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Education & Physical Education Programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Group Students</p>
                    <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1" data-testid="stat-group-students">{groupByProgram.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Education Programs</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{groupByProgram.education}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Physical Education</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{groupByProgram.physical}</p>
                  </div>
                </div>
                <Link href="/students?category=group">
                  <Button 
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-0 shadow-lg"
                    data-testid="button-view-group-students"
                  >
                    View Group Students
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Summary Widgets */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* LLB Fee Widget */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                LLB Fee Summary
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Law program fee collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">LLB Program</p>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    {llbByYear.total > 0 ? 'Active' : 'No Students'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Collected</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      Rs {(llbFees?.collectedFees || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      Rs {(llbFees?.pendingFees || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Fee Widget */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Abbott Group Fee Summary
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Education programs fee collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Group Programs</p>
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
                    {otherFees.length > 0 ? 'Active' : 'No Programs'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Collected</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      Rs {totalOtherCollected.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      Rs {totalOtherPending.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/fees/reports/program">
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
                  data-testid="button-view-fee-details"
                >
                  View Full Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Daily Financial Balances - LLB vs Group */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* LLB Daily Balance */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                LLB Daily Balance
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Today's LLB fee income (expenses not deducted from LLB if Group has income)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Today's LLB Income</p>
                    <p className="text-2xl font-heading font-bold text-indigo-600 dark:text-indigo-400" data-testid="stat-llb-daily-income">
                      Rs {(stats?.todayLlbIncome || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Balance</p>
                    <p className={`text-2xl font-heading font-bold ${(stats?.llbDailyBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="stat-llb-daily-balance">
                      Rs {(stats?.llbDailyBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Monthly Revenue</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    Rs {(stats?.llbMonthlyRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Abbott Group Daily Balance */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal-600" />
                Abbott Group Daily Balance
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Today's Group income minus expenses (expenses deducted from Group first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Today's Group Income</p>
                    <p className="text-2xl font-heading font-bold text-teal-600 dark:text-teal-400" data-testid="stat-group-daily-income">
                      Rs {(stats?.todayGroupIncome || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Balance</p>
                    <p className={`text-2xl font-heading font-bold ${(stats?.groupDailyBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="stat-group-daily-balance">
                      Rs {(stats?.groupDailyBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Monthly Revenue</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      Rs {(stats?.groupMonthlyRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Today's Expenses</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      Rs {(stats?.todayExpenses || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className={`group h-auto w-full flex-col gap-2 py-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${action.color} bg-clip-padding border-transparent text-white hover:opacity-90`}
                    data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
              No recent activities to display
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
