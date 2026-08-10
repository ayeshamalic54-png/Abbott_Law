import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Calendar, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { FeePayment, Student, FeeVoucher } from "@shared/schema";

export default function DailyFeeReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [, setLocation] = useLocation();

  const { data: payments, isLoading } = useQuery<FeePayment[]>({
    queryKey: ['/api/fee-payments'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: vouchers } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fee-vouchers'],
  });

  const dailyTransactions = payments?.filter(p => {
    const paymentDate = p.paymentDate ? p.paymentDate.split('T')[0] : '';
    return paymentDate === selectedDate;
  }).map(p => {
    const voucher = vouchers?.find(v => v.id === p.voucherId);
    const student = students?.find(s => s.id === voucher?.studentId);
    return {
      id: p.id,
      time: p.paymentDate ? format(parseISO(p.paymentDate), 'hh:mm a') : 'N/A',
      rollNumber: student?.rollNumber || 'N/A',
      studentName: student?.fullName || 'Unknown',
      voucherNo: voucher?.voucherNumber || p.receiptNumber || 'N/A',
      amount: p.amount || 0,
    };
  }) || [];

  const totalCollection = dailyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const exportToCSV = () => {
    const headers = ["Time", "Roll Number", "Student Name", "Voucher No", "Amount"];
    const csvData = dailyTransactions.map(t => [
      t.time,
      t.rollNumber,
      t.studentName,
      t.voucherNo,
      t.amount.toString()
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-fee-report-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="hover-elevate" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-daily-report">
              <Calendar className="h-8 w-8 text-primary" />
              Daily Fee Collection Report
            </h1>
            <p className="text-muted-foreground mt-1">Day-wise fee collection details</p>
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
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Select Date</CardTitle></CardHeader>
          <CardContent>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} data-testid="input-date" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Transactions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{dailyTransactions.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Collection</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">Rs {totalCollection.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>All fee payments received on {selectedDate}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : dailyTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No transactions found for this date</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.time}</TableCell>
                      <TableCell className="font-medium">{transaction.rollNumber}</TableCell>
                      <TableCell>{transaction.studentName}</TableCell>
                      <TableCell>{transaction.voucherNo}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">Rs {Number(transaction.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-semibold">
                    <TableCell colSpan={4} className="text-right">Total Collection:</TableCell>
                    <TableCell className="text-right text-green-600">Rs {totalCollection.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
