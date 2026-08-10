import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintView } from "@/components/print-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Transaction {
  id: number;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: string;
  reference: string;
}

export default function IncomeExpensePrint() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/accounts/transactions'],
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const incomeTransactions = transactions?.filter(t => t.type === "Income") || [];
  const expenseTransactions = transactions?.filter(t => t.type === "Expense") || [];
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseInt(t.amount), 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + parseInt(t.amount), 0);

  return (
    <div className="p-8">
      <PrintView
        title="Income & Expense Report"
        subtitle="Financial Transactions Summary"
        reportType="Income & Expense Report"
        reportData={transactions}
        college="group"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-6 print-summary">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rs {totalIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  Rs {totalExpense.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs {(totalIncome - totalExpense).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount (Rs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString('en-PK')}</TableCell>
                  <TableCell>
                    <span className={transaction.type === 'Income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="text-sm">{transaction.description}</TableCell>
                  <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                  <TableCell className="text-right font-medium">
                    {parseInt(transaction.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PrintView>
    </div>
  );
}
