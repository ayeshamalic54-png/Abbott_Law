import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, TrendingUp, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Student, FeeVoucher, FeePayment, Program } from "@shared/schema";

export default function ProgramFeeReport() {
  const [, setLocation] = useLocation();
  
  const { data: students, isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: vouchers } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fee-vouchers'],
  });

  const { data: payments } = useQuery<FeePayment[]>({
    queryKey: ['/api/fee-payments'],
  });

  const programStats = programs?.map(program => {
    const programStudents = students?.filter(s => s.program === program.name) || [];
    const studentIds = programStudents.map(s => s.id);
    
    const programVouchers = vouchers?.filter(v => studentIds.includes(v.studentId)) || [];
    const voucherIds = programVouchers.map(v => v.id);
    const programPayments = payments?.filter(p => voucherIds.includes(p.voucherId)) || [];
    
    const totalFee = programVouchers.reduce((sum, v) => sum + Number(v.netAmount || v.amount || 0), 0);
    const collected = programPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = totalFee - collected;
    const collectionPercent = totalFee > 0 ? Math.round((collected / totalFee) * 100) : 0;

    return {
      program: program.name,
      totalStudents: programStudents.length,
      totalFee,
      collected,
      pending,
      collectionPercent
    };
  }) || [];

  const totals = programStats.reduce((acc, p) => ({
    totalFee: acc.totalFee + p.totalFee,
    collected: acc.collected + p.collected,
    pending: acc.pending + p.pending,
  }), { totalFee: 0, collected: 0, pending: 0 });

  const overallPercent = totals.totalFee > 0 ? Math.round((totals.collected / totals.totalFee) * 100) : 0;

  const exportToCSV = () => {
    const headers = ["Program", "Total Students", "Total Fee", "Collected", "Pending", "Collection %"];
    const csvData = programStats.map(p => [
      p.program,
      p.totalStudents.toString(),
      p.totalFee.toString(),
      p.collected.toString(),
      p.pending.toString(),
      p.collectionPercent + "%"
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `program-fee-report-${new Date().toISOString().split('T')[0]}.csv`;
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-program-report">
              <TrendingUp className="h-8 w-8 text-primary" />
              Program-wise Fee Report
            </h1>
            <p className="text-muted-foreground mt-1">Fee collection summary by program</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Programs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{programStats.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Fee</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">Rs {totals.totalFee.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Collection</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">Rs {totals.collected.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Pending</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-orange-600">Rs {totals.pending.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Summary</CardTitle>
          <CardDescription>Detailed fee breakdown by program</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : programStats.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No programs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Total Students</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Collection %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stat.program}</TableCell>
                      <TableCell className="text-right">{stat.totalStudents}</TableCell>
                      <TableCell className="text-right">Rs {stat.totalFee.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs {stat.collected.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600">Rs {stat.pending.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${stat.collectionPercent >= 70 ? 'text-green-600' : stat.collectionPercent >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                          {stat.collectionPercent}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{students?.length || 0}</TableCell>
                    <TableCell className="text-right">Rs {totals.totalFee.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">Rs {totals.collected.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-orange-600">Rs {totals.pending.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-primary">{overallPercent}%</TableCell>
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
