import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { Student, FeeVoucher, FeePayment } from "@shared/schema";

export default function IndividualFeeReport() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const studentFeeData = students?.map(student => {
    const studentVouchers = vouchers?.filter(v => v.studentId === student.id) || [];
    const voucherIds = studentVouchers.map(v => v.id);
    const studentPayments = payments?.filter(p => voucherIds.includes(p.voucherId)) || [];
    
    const totalFee = studentVouchers.reduce((sum, v) => sum + Number(v.netAmount || v.amount || 0), 0);
    const paidAmount = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingAmount = totalFee - paidAmount;
    
    let status: 'Paid' | 'Partial' | 'Pending' = 'Pending';
    if (totalFee > 0 && pendingAmount <= 0) status = 'Paid';
    else if (paidAmount > 0) status = 'Partial';

    return {
      ...student,
      totalFee,
      paidAmount,
      pendingAmount,
      status
    };
  }) || [];

  const filteredData = studentFeeData.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Roll Number", "Student Name", "Program", "Total Fee", "Paid Amount", "Pending Amount", "Status"];
    const csvData = filteredData.map(s => [
      s.rollNumber,
      s.fullName,
      s.program || "",
      s.totalFee.toString(),
      s.paidAmount.toString(),
      s.pendingAmount.toString(),
      s.status
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `individual-fee-report-${new Date().toISOString().split('T')[0]}.csv`;
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
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-individual-fee-report">Individual Fee Report</h1>
            <p className="text-muted-foreground mt-1">Student-wise fee details</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4" />
              <Input placeholder="Search by student name or roll number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" data-testid="input-search" />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No students found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Pending Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell className="text-right">Rs {student.totalFee.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs {student.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600 font-semibold">Rs {student.pendingAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'Paid' ? 'default' : student.status === 'Partial' ? 'secondary' : 'destructive'}>
                          {student.status}
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
