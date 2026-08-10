import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface FeeReportSummary {
  totalFees: number;
  totalGroupFees: number;
  totalLawFees: number;
  totalExpenses: number;
  appliedExpenses: number;
  unappliedExpenses: number;
  expensesAppliedTo: 'group' | 'law' | 'none';
  netIncome: number;
}

interface FeeReportBreakdown {
  programId: string | null;
  programName: string;
  programType: 'group' | 'law' | 'unknown';
  grossCollected: number;
  expensesApplied: number;
  netCollected: number;
}

interface ExpenseData {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
}

interface FeeReportResponse {
  summary: FeeReportSummary;
  breakdown: FeeReportBreakdown[];
  expenses: ExpenseData[];
  dateRange: {
    start: string;
    end: string;
    period: ReportPeriod;
  };
}

export default function ComprehensiveReports() {
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('monthly');

  const { data: report, isLoading, error } = useQuery<FeeReportResponse>({
    queryKey: ['/api/reports/fees', activePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/fees?period=${activePeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fee report');
      }
      return response.json();
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const getProgramTypeColor = (type: string) => {
    if (type === 'group') return 'bg-blue-500';
    if (type === 'law') return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getExpenseApplicationBadge = (appliedTo: string) => {
    if (appliedTo === 'group') {
      return <Badge className="bg-blue-500 text-white">Deducted from Group Programs</Badge>;
    } else if (appliedTo === 'law') {
      return <Badge className="bg-purple-500 text-white">Deducted from Law Programs</Badge>;
    } else {
      return <Badge className="bg-gray-500 text-white">No Deductions (No Fees)</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-comprehensive-reports">
              Comprehensive Fee Reports
            </h1>
            <p className="text-muted-foreground">
              Detailed financial analysis with smart expense deduction
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handlePrint} className="no-print" data-testid="button-print-report">
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs value={activePeriod} onValueChange={(value) => setActivePeriod(value as ReportPeriod)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" data-testid="tab-yearly">Yearly</TabsTrigger>
        </TabsList>

        {/* Report Content */}
        <TabsContent value={activePeriod} className="space-y-6 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading report...</p>
            </div>
          ) : report ? (
            <>
              {/* Date Range Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Report Period</p>
                      <p className="text-lg font-semibold">
                        {format(new Date(report.dateRange.start), 'dd MMM yyyy')} - {format(new Date(report.dateRange.end), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getExpenseApplicationBadge(report.summary.expensesAppliedTo)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-total-fees">
                      Rs {report.summary.totalFees.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Group: Rs {report.summary.totalGroupFees.toLocaleString()} | Law: Rs {report.summary.totalLawFees.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
                      Rs {report.summary.totalExpenses.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied: Rs {report.summary.appliedExpenses.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${report.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-income">
                      Rs {report.summary.netIncome.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      After {report.summary.expensesAppliedTo} expense deduction
                    </p>
                  </CardContent>
                </Card>

                {report.summary.unappliedExpenses > 0 && (
                  <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unapplied Expenses</CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600" data-testid="text-unapplied-expenses">
                        Rs {report.summary.unappliedExpenses.toLocaleString()}
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        Expenses exceeded applicable fees
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Program Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Program-wise Fee Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.breakdown.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No fee collections in this period
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {report.breakdown.map((program, idx) => (
                        <div
                          key={program.programId || idx}
                          className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
                          data-testid={`program-${program.programId}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{program.programName}</h4>
                              <Badge className={`${getProgramTypeColor(program.programType)} text-white`}>
                                {program.programType}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Gross Collected</p>
                                <p className="font-semibold text-green-600">Rs {program.grossCollected.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Expenses Applied</p>
                                <p className="font-semibold text-red-600">Rs {program.expensesApplied.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Net Collected</p>
                                <p className="font-semibold text-blue-600">Rs {program.netCollected.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses List */}
              <Card>
                <CardHeader>
                  <CardTitle>Expenses in this Period</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.expenses.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No expenses recorded in this period
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {report.expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 rounded border hover-elevate"
                          data-testid={`expense-${expense.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{expense.category}</p>
                            {expense.description && (
                              <p className="text-sm text-muted-foreground">{expense.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">Rs {expense.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
