import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Printer, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  feeIncome: number;
  otherIncome: number;
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
    category: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

export default function FinancialSummary() {
  const { data: summary, isLoading } = useQuery<FinancialSummary>({
    queryKey: ['/api/accounts/financial-summary'],
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Summary</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No financial data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Financial Summary</h1>
          <p className="text-muted-foreground">Comprehensive financial overview</p>
        </div>
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Print Header */}
      <div className="print-only text-center mb-6">
        <h1 className="text-2xl font-bold">Abbott Law College</h1>
        <h2 className="text-xl">Financial Summary Report</h2>
        <p className="text-sm text-muted-foreground">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-income">
              Rs {summary.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fees: Rs {summary.feeIncome.toLocaleString()} | Other: Rs {summary.otherIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
              Rs {summary.totalExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All operational costs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-balance">
              Rs {summary.netBalance.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Income - Expenses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList data-testid="tabs-financial-summary">
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Category Breakdown</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        {/* Monthly Breakdown */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Data</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.monthlyData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No monthly data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Month</th>
                        <th className="text-right py-3 px-4 font-medium">Income</th>
                        <th className="text-right py-3 px-4 font-medium">Expenses</th>
                        <th className="text-right py-3 px-4 font-medium">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.monthlyData.map((month, idx) => (
                        <tr key={idx} className="border-b" data-testid={`row-month-${idx}`}>
                          <td className="py-3 px-4">{month.month}</td>
                          <td className="text-right py-3 px-4 text-green-600">Rs {month.income.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-red-600">Rs {month.expenses.toLocaleString()}</td>
                          <td className={`text-right py-3 px-4 font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Rs {month.net.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Breakdown */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.categoryBreakdown.income.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No income categories</p>
                ) : (
                  <div className="space-y-3">
                    {summary.categoryBreakdown.income.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center" data-testid={`income-category-${idx}`}>
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-green-600 font-semibold">Rs {cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.categoryBreakdown.expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No expense categories</p>
                ) : (
                  <div className="space-y-3">
                    {summary.categoryBreakdown.expenses.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center" data-testid={`expense-category-${idx}`}>
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-red-600 font-semibold">Rs {cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent transactions</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b" data-testid={`transaction-${txn.id}`}>
                          <td className="py-3 px-4 text-sm">{format(new Date(txn.date), 'MMM dd, yyyy')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              txn.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{txn.category}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{txn.description || '-'}</td>
                          <td className={`text-right py-3 px-4 font-medium ${
                            txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Rs {txn.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}
