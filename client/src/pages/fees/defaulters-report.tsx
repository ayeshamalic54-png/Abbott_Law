import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, AlertCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { differenceInDays, parseISO } from "date-fns";
import type { Student, FeeVoucher, FeePayment } from "@shared/schema";

export default function DefaultersReport() {
  const [, setLocation] = useLocation();
  
  const { data: students, isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: vouchers } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fee-vouchers'],
  });

  const { data: payments } = useQuery<FeePayment[]>({
    queryKey: ['/api/fee-payments'],
  });

  const defaulters = students?.map(student => {
    const studentVouchers = vouchers?.filter(v => v.studentId === student.id) || [];
    const studentVoucherIds = studentVouchers.map(v => v.id);
    const studentPayments = payments?.filter(p => studentVoucherIds.includes(p.voucherId)) || [];
    
    const totalFee = studentVouchers.reduce((sum, v) => sum + Number(v.netAmount || v.amount || 0), 0);
    const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = totalFee - totalPaid;
    
    const unpaidVouchers = studentVouchers.filter(v => v.status === 'pending' || v.status === 'overdue' || v.status === 'partial');
    const oldestUnpaidDate = unpaidVouchers.length > 0 
      ? unpaidVouchers.reduce((oldest, v) => {
          const vDate = v.dueDate ? parseISO(v.dueDate) : new Date();
          return vDate < oldest ? vDate : oldest;
        }, new Date())
      : new Date();
    
    const daysOverdue = differenceInDays(new Date(), oldestUnpaidDate);

    return {
      ...student,
      totalFee,
      paid: totalPaid,
      pending,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0
    };
  }).filter(s => s.pending > 0) || [];

  const totalPending = defaulters.reduce((sum, d) => sum + d.pending, 0);

  const exportToCSV = () => {
    const headers = ["Roll Number", "Student Name", "Program", "Total Fee", "Paid", "Pending", "Days Overdue"];
    const csvData = defaulters.map(d => [
      d.rollNumber,
      d.fullName,
      d.program || "",
      d.totalFee.toString(),
      d.paid.toString(),
      d.pending.toString(),
      d.daysOverdue.toString()
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulters-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isLoading = loadingStudents;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="hover-elevate" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-defaulters-report">
              <AlertCircle className="h-8 w-8 text-red-600" />
              Fee Defaulters Report
            </h1>
            <p className="text-muted-foreground mt-1">Students with outstanding fee payments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg" data-testid="button-print">
            <FileText className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Defaulters</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{defaulters.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Outstanding</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-orange-600">Rs {totalPending.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Critical Cases</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{defaulters.filter(d => d.daysOverdue > 30).length}</div>
            <p className="text-xs text-muted-foreground">Over 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defaulter Details</CardTitle>
          <CardDescription>Students with pending fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : defaulters.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No defaulters found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((defaulter) => (
                    <TableRow key={defaulter.id}>
                      <TableCell className="font-medium">{defaulter.rollNumber}</TableCell>
                      <TableCell>{defaulter.fullName}</TableCell>
                      <TableCell>{defaulter.program}</TableCell>
                      <TableCell className="text-right">Rs {defaulter.totalFee.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs {defaulter.paid.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">Rs {defaulter.pending.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{defaulter.daysOverdue} days</TableCell>
                      <TableCell>
                        <Badge variant={defaulter.daysOverdue > 30 ? "destructive" : "default"}>
                          {defaulter.daysOverdue > 30 ? "Critical" : "Follow-up"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
