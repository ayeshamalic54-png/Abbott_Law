import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Calendar, Users, FileText, Printer, Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import hazaraLogo from "@assets/hazara_1766558722259.png";
import type { Program } from "@shared/schema";

type StudentAttendance = {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
  student: {
    rollNumber: string;
    fullName: string;
    program: string;
  };
};

type Student = {
  id: string;
  rollNumber: string;
  fullName: string;
  program: string;
  className?: string;
};

export default function HazaraAttendanceReport() {
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<StudentAttendance[]>({
    queryKey: ['/api/attendance/student'],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  // Get LLB programs only for Hazara University portal
  const llbPrograms = programs.filter(p => p.category === 'llb');
  const llbProgramNames = llbPrograms.map(p => p.name);

  // Filter students to only LLB programs, then by selected program
  // Only filter when programs have loaded to avoid showing all students
  const llbStudents = programsLoading || llbProgramNames.length === 0
    ? []
    : students.filter(s => llbProgramNames.includes(s.program));
  const filteredStudents = selectedProgram === "all" 
    ? llbStudents 
    : llbStudents.filter(s => s.program === selectedProgram);

  // Filter attendance by selected date and only LLB programs
  const dateAttendance = attendance.filter(a => 
    a.date === selectedDate && llbProgramNames.includes(a.student?.program || '')
  );

  // Create attendance map for quick lookup (only LLB students)
  const attendanceMap = new Map(
    dateAttendance.map(a => [a.studentId, a])
  );

  // Get attendance status for a student
  const getAttendanceStatus = (studentId: string) => {
    return attendanceMap.get(studentId);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Not Marked</Badge>;
    }
    
    const variants: Record<string, { bg: string; text: string; icon: any }> = {
      present: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Present', icon: CheckCircle2 },
      absent: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Absent', icon: XCircle },
      late: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'Late', icon: Clock },
      leave: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Leave', icon: Calendar },
    };
    const variant = variants[status] || variants.present;
    const Icon = variant.icon;
    return (
      <Badge variant="outline" className={variant.bg}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Roll Number', 'Student Name', 'Program', 'Status', 'Remarks'];
    const rows = filteredStudents.map(student => {
      const attendance = getAttendanceStatus(student.id);
      return [
        student.rollNumber,
        student.fullName,
        student.program,
        attendance?.status || 'Not Marked',
        attendance?.remarks || '-'
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${selectedProgram}-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const markedStudents = filteredStudents.filter(s => getAttendanceStatus(s.id)).length;
  const presentCount = filteredStudents.filter(s => getAttendanceStatus(s.id)?.status === 'present').length;
  const absentCount = filteredStudents.filter(s => getAttendanceStatus(s.id)?.status === 'absent').length;
  const attendanceRate = markedStudents > 0 ? Math.round((presentCount / markedStudents) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <img 
            src={hazaraLogo} 
            alt="Hazara University Logo" 
            className="h-16 w-16 object-contain"
            data-testid="img-hazara-logo"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-attendance-report">
              Hazara University - Attendance Report
            </h1>
            <p className="text-muted-foreground">
              View student attendance by program and date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="default" size="default" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>Select program/class and date to view attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program / Class</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger data-testid="select-program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LLB Programs</SelectItem>
                  {llbPrograms.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="input-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4 print:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marked</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{markedStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Print Header (only visible when printing) */}
      <div className="hidden print:block print:mb-6">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">Abbott Law College</h1>
          <h2 className="text-xl font-semibold">Student Attendance Report</h2>
          <p className="text-sm mt-2">
            Program: {selectedProgram === "all" ? "All Programs" : selectedProgram} | 
            Date: {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="print:hidden">
          <CardTitle>
            {selectedProgram === "all" ? "All Students" : selectedProgram} - Attendance Sheet
          </CardTitle>
          <CardDescription>
            Date: {new Date(selectedDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(attendanceLoading || studentsLoading || programsLoading) ? (
            <div className="flex justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No students found for the selected program</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Roll Number</th>
                    <th className="text-left p-3 font-semibold">Student Name</th>
                    <th className="text-left p-3 font-semibold">Program</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const attendance = getAttendanceStatus(student.id);
                    return (
                      <tr key={student.id} className="border-b hover:bg-muted/50 print:hover:bg-transparent">
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3 font-medium" data-testid={`roll-${student.id}`}>
                          {student.rollNumber}
                        </td>
                        <td className="p-3">{student.fullName}</td>
                        <td className="p-3 text-sm text-muted-foreground">{student.program}</td>
                        <td className="p-3">{getStatusBadge(attendance?.status)}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {attendance?.remarks || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read-Only Notice */}
      <Card className="border-blue-200 bg-blue-50/50 print:hidden">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Read-Only Access</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a read-only report. You can view, print, and export attendance data but cannot modify records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
