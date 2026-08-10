import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

type FeeVoucher = {
  id: string;
  voucherNumber: string;
  studentId: string;
  amount: string;
  dueDate: string;
  status: string;
  feeType?: string;
  semester?: number;
  createdAt: string;
};

type Student = {
  id: string;
  userId: string;
  fullName: string;
  rollNumber: string;
  previousDues?: string;
  semester?: number;
  program?: string;
};

export default function MyVouchers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: vouchers, isLoading: vouchersLoading } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fees/vouchers'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const currentStudent = students?.find(s => s.userId === user?.id);
  
  const myVouchers = vouchers?.filter(v => v.studentId === currentStudent?.id) || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? 'Rs 0' : `Rs ${num.toLocaleString()}`;
  };

  const printVoucher = (voucher: FeeVoucher) => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-my-vouchers">
                My Fee Vouchers
              </h1>
              <p className="text-muted-foreground">View your fee vouchers and payment status</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} data-testid="button-print">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {currentStudent && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{currentStudent.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium font-mono">{currentStudent.rollNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vouchers</p>
                <p className="font-medium">{myVouchers.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previous Dues</p>
                <p className="font-medium text-red-600">
                  {formatAmount(currentStudent.previousDues || '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="font-medium text-orange-600">
                  {formatAmount(
                    (myVouchers
                      .filter(v => v.status?.toLowerCase() !== 'paid')
                      .reduce((sum, v) => sum + parseFloat(v.amount || '0'), 0) + 
                      parseFloat(currentStudent.previousDues || '0'))
                      .toString()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStudent && parseFloat(currentStudent.previousDues || '0') > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700 dark:text-red-300">Previous Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Carried forward from previous semester(s)
                </p>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatAmount(currentStudent.previousDues || '0')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Vouchers</CardTitle>
          <CardDescription>Your fee vouchers generated by the accounts department</CardDescription>
        </CardHeader>
        <CardContent>
          {vouchersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : myVouchers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Vouchers Found</h3>
              <p className="text-muted-foreground">
                Fee vouchers will appear here once they are generated by the accounts department.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myVouchers.map((voucher) => (
                    <TableRow key={voucher.id} data-testid={`row-voucher-${voucher.id}`}>
                      <TableCell className="font-mono font-medium">
                        {voucher.voucherNumber}
                      </TableCell>
                      <TableCell>{voucher.feeType || 'Tuition Fee'}</TableCell>
                      <TableCell>{voucher.semester || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(voucher.amount)}
                      </TableCell>
                      <TableCell>{formatDate(voucher.dueDate)}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(voucher.status)} text-white`}>
                          {voucher.status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(voucher.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Please pay your fees before the due date to avoid late fee charges. 
            For any queries regarding fee vouchers, please contact the accounts department.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
