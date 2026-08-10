import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, TrendingUp, ArrowLeft, List, LayoutGrid, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { DetailedStudentReport } from "@/components/detailed-student-report";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PerformanceReport() {
  const [semester, setSemester] = useState("1");
  const [viewMode, setViewMode] = useState<'table' | 'detailed'>('table');
  const [, setLocation] = useLocation();
  
  const { data: students } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: grades } = useQuery<any[]>({
    queryKey: ['/api/grades'],
  });

  // Calculate actual performance from grades data
  const performanceData = students?.map((s: any) => {
    const studentGrades = grades?.filter((g: any) => g.studentId === s.id) || [];
    const totalMarks = studentGrades.reduce((sum: number, g: any) => sum + (g.totalMarks || 100), 0);
    const obtainedMarks = studentGrades.reduce((sum: number, g: any) => sum + (g.obtainedMarks || 0), 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    
    let grade = '-';
    if (studentGrades.length > 0) {
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else grade = 'F';
    }
    
    return {
      ...s,
      totalMarks: totalMarks || 0,
      obtainedMarks: obtainedMarks || 0,
      grade,
      cgpa: studentGrades.length > 0 ? (percentage / 25).toFixed(2) : '-',
      hasGrades: studentGrades.length > 0,
    };
  }) || [];

  const hasAnyGrades = performanceData.some(s => s.hasGrades);

  const exportToCSV = () => {
    const headers = ["Roll Number", "Student Name", "Program", "Semester", "Total Marks", "Obtained Marks", "Percentage", "Grade", "CGPA"];
    const csvData = performanceData.map((s: any) => [
      s.rollNumber,
      s.fullName,
      s.program || "",
      semester,
      s.totalMarks || 0,
      s.obtainedMarks || 0,
      s.totalMarks > 0 ? ((s.obtainedMarks / s.totalMarks) * 100).toFixed(1) : '0.0',
      s.grade,
      s.cgpa
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-semester-${semester}.csv`;
    a.click();
  };

  const saveReport = () => {
    const reportData = {
      reportType: "Student Performance Report",
      semester,
      generatedAt: new Date().toISOString(),
      data: performanceData
    };
    localStorage.setItem(`performance-report-${Date.now()}`, JSON.stringify(reportData));
    alert("Report saved successfully!");
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
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-performance-report">
              <TrendingUp className="h-8 w-8 text-primary" />
              Student Performance Report
            </h1>
            <p className="text-muted-foreground mt-1">Academic performance analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md p-1 no-print">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              data-testid="button-table-view"
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('detailed')}
              data-testid="button-detailed-view"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Detailed
            </Button>
          </div>
          <Button 
            onClick={saveReport} 
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
            data-testid="button-save"
          >
            Save Report
          </Button>
          <Button 
            onClick={exportToCSV} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => window.print()} 
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg"
            data-testid="button-print"
          >
            <FileText className="h-4 w-4 mr-2" />
            Print Detailed
          </Button>
        </div>
      </div>

      <div className="no-print">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              <div className="flex gap-3 mt-2">
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger className="w-48" data-testid="select-semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                    <SelectItem value="5">Semester 5</SelectItem>
                    <SelectItem value="6">Semester 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasAnyGrades && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Grade Data Available</AlertTitle>
                <AlertDescription>
                  Performance data will be displayed once grades are entered for students. Please go to the Grades section to enter student marks.
                </AlertDescription>
              </Alert>
            )}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Total Marks</TableHead>
                      <TableHead className="text-right">Obtained</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-right">CGPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((student: any) => {
                      const percentage = student.totalMarks > 0 ? ((student.obtainedMarks / student.totalMarks) * 100).toFixed(1) : '0.0';
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.rollNumber}</TableCell>
                          <TableCell>{student.fullName}</TableCell>
                          <TableCell>{student.program}</TableCell>
                          <TableCell className="text-right">{student.totalMarks || '-'}</TableCell>
                          <TableCell className="text-right">{student.obtainedMarks || '-'}</TableCell>
                          <TableCell className="text-right font-semibold">{student.hasGrades ? `${percentage}%` : '-'}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${
                              student.grade === 'A+' ? 'text-green-600' : 
                              student.grade === 'A' ? 'text-blue-600' : 
                              student.grade === 'B+' ? 'text-orange-600' : 
                              student.grade === '-' ? 'text-gray-400' :
                              'text-red-600'
                            }`}>
                              {student.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">{student.cgpa}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <DetailedStudentReport
                students={performanceData}
                reportType="Student Performance Report"
                reportDate={`Semester ${semester}`}
                additionalInfo={(student) => (
                  <>
                    <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                      Academic Performance
                    </h3>
                    <div className="space-y-1">
                      <div className="flex">
                        <span className="font-semibold w-32">Semester:</span>
                        <span className="flex-1">Semester {semester}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Total Marks:</span>
                        <span className="flex-1 font-bold">{student.totalMarks}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Obtained:</span>
                        <span className="flex-1 text-blue-600 font-bold">{student.obtainedMarks}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Percentage:</span>
                        <span className="flex-1 font-bold text-lg">
                          {((student.obtainedMarks / student.totalMarks) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Grade:</span>
                        <span className={`flex-1 font-bold text-2xl ${
                          student.grade === 'A+' ? 'text-green-600' : 
                          student.grade === 'A' ? 'text-blue-600' : 
                          student.grade === 'B+' ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {student.grade}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">CGPA:</span>
                        <span className="flex-1 font-bold text-lg text-primary">{student.cgpa}</span>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm font-semibold">Academic Remarks:</p>
                        <p className="text-sm mt-1">
                          {student.grade === 'A+' || student.grade === 'A'
                            ? '⭐ Excellent performance! Student demonstrates outstanding academic ability and consistent effort.' 
                            : student.grade === 'B+' 
                            ? '✓ Good performance. Student shows strong understanding of course material.' 
                            : '⚠ Satisfactory performance. Student should focus on improvement in next semester.'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Print View - Professional Table Layout */}
      <div className="hidden print:block print-performance-report">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            .print-performance-report {
              font-size: 10pt;
            }
            .print-header {
              text-align: center;
              border-bottom: 3px double #1e3a5f;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .print-header h1 {
              font-size: 18pt;
              font-weight: bold;
              color: #1e3a5f;
              margin: 0;
            }
            .print-header p {
              margin: 3px 0;
              color: #444;
            }
            .print-title {
              text-align: center;
              font-size: 14pt;
              font-weight: bold;
              margin: 15px 0;
              padding: 8px;
              background: #f0f4f8;
              border: 1px solid #ddd;
            }
            .print-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 9pt;
              color: #666;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .print-table th {
              background: #1e3a5f;
              color: white;
              padding: 8px 6px;
              text-align: left;
              font-size: 9pt;
              border: 1px solid #1e3a5f;
            }
            .print-table td {
              padding: 6px;
              border: 1px solid #ddd;
              font-size: 9pt;
            }
            .print-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .print-table .text-center {
              text-align: center;
            }
            .print-table .text-right {
              text-align: right;
            }
            .grade-a-plus { color: #16a34a; font-weight: bold; }
            .grade-a { color: #2563eb; font-weight: bold; }
            .grade-b-plus { color: #ea580c; font-weight: bold; }
            .grade-other { color: #dc2626; font-weight: bold; }
            .print-footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
              font-size: 9pt;
            }
            .signature-block {
              text-align: center;
              min-width: 150px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 40px;
              padding-top: 5px;
            }
          }
        `}</style>
        
        <div className="print-header">
          <h1>ABBOTT LAW COLLEGE</h1>
          <p>Mansehra, Khyber Pakhtunkhwa</p>
          <p style={{ fontSize: '9pt' }}>Affiliated with Hazara University</p>
        </div>

        <div className="print-title">
          STUDENT ACADEMIC PERFORMANCE REPORT - SEMESTER {semester}
        </div>

        <div className="print-meta">
          <span>Report Date: {new Date().toLocaleDateString()}</span>
          <span>Total Students: {performanceData.length}</span>
          <span>Academic Session: {new Date().getFullYear()}</span>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>S#</th>
              <th style={{ width: '12%' }}>Roll Number</th>
              <th style={{ width: '22%' }}>Student Name</th>
              <th style={{ width: '18%' }}>Program</th>
              <th style={{ width: '10%' }} className="text-right">Total</th>
              <th style={{ width: '10%' }} className="text-right">Obtained</th>
              <th style={{ width: '10%' }} className="text-right">%age</th>
              <th style={{ width: '7%' }} className="text-center">Grade</th>
              <th style={{ width: '6%' }} className="text-center">CGPA</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map((student: any, index: number) => {
              const percentage = student.totalMarks > 0 
                ? ((student.obtainedMarks / student.totalMarks) * 100).toFixed(1) 
                : '0.0';
              return (
                <tr key={student.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>{student.rollNumber}</td>
                  <td>{student.fullName}</td>
                  <td>{student.program || '-'}</td>
                  <td className="text-right">{student.totalMarks || '-'}</td>
                  <td className="text-right">{student.obtainedMarks || '-'}</td>
                  <td className="text-right">{student.hasGrades ? `${percentage}%` : '-'}</td>
                  <td className={`text-center ${
                    student.grade === 'A+' ? 'grade-a-plus' : 
                    student.grade === 'A' ? 'grade-a' : 
                    student.grade === 'B+' ? 'grade-b-plus' : 
                    'grade-other'
                  }`}>
                    {student.grade}
                  </td>
                  <td className="text-center">{student.cgpa}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="print-footer">
          <div className="signature-block">
            <div className="signature-line">Prepared By</div>
          </div>
          <div className="signature-block">
            <div className="signature-line">Verified By</div>
          </div>
          <div className="signature-block">
            <div className="signature-line">Principal</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '8pt', color: '#666' }}>
          <p>This is a computer-generated report. Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
