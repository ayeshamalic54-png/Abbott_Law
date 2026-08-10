import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Student, Program } from "@shared/schema";
import { Download, FileText, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdmissionReports() {
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const filteredData = students?.filter(s => {
    const programMatch = filterProgram === "all" || s.program === filterProgram;
    const statusMatch = filterStatus === "all" || s.status === filterStatus;
    return programMatch && statusMatch;
  });

  // Stats based on filtered data, not all students
  const stats = {
    total: filteredData?.length || 0,
    active: filteredData?.filter(s => s.status === 'active').length || 0,
  };

  const programStats = programs?.map(p => ({
    name: p.name,
    count: filteredData?.filter(s => s.program === p.name).length || 0
  })) || [];

  const exportToCSV = () => {
    if (!filteredData) return;
    
    const headers = ["Roll Number", "Name", "Program", "Semester", "Enrollment Date", "Status"];
    const csvData = filteredData.map(s => [
      s.rollNumber,
      s.fullName,
      s.program || "",
      s.semester || "",
      s.enrollmentDate || "",
      s.status || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admission-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-admission-reports">
            <TrendingUp className="h-8 w-8 text-primary" />
            Admission Reports
          </h1>
          <p className="text-muted-foreground mt-1">Statistical analysis of admissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => window.print()} variant="outline" data-testid="button-print">
            <FileText className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        {programStats.slice(0, 2).map((ps, idx) => (
          <Card key={ps.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{ps.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${idx === 0 ? 'text-blue-600' : 'text-purple-600'}`}>{ps.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
          <CardDescription>
            <div className="flex gap-3 mt-2">
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="w-48" data-testid="select-program">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48" data-testid="select-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData && filteredData.length > 0 ? (
                    filteredData.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-bold text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.program}</TableCell>
                        <TableCell>{student.semester}</TableCell>
                        <TableCell>{student.enrollmentDate}</TableCell>
                        <TableCell className="capitalize">{student.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
