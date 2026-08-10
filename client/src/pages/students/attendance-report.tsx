import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Calendar, ArrowLeft, List, LayoutGrid, Edit2, Trash2, ClipboardList } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { DetailedStudentReport } from "@/components/detailed-student-report";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Program, Student } from "@shared/schema";

type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  remarks?: string;
};

export default function AttendanceReport() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [program, setProgram] = useState("all");
  const [viewMode, setViewMode] = useState<'table' | 'detailed' | 'daily'>('table');
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'accountant';

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: attendanceRecords, refetch: refetchAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/student'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: string; remarks?: string }) => {
      return apiRequest('PUT', `/api/attendance/students/${id}`, { status, remarks });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Attendance updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/student'] });
      setEditDialogOpen(false);
      setEditingRecord(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/attendance/students/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Attendance record deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/student'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, status: editStatus, remarks: editRemarks });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student ? student.fullName : 'Unknown';
  };

  const getStudentRoll = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student ? student.rollNumber : '';
  };

  const filteredDailyRecords = attendanceRecords?.filter(record => {
    const recordMonth = record.date?.slice(0, 7);
    if (recordMonth !== month) return false;
    if (program !== 'all') {
      const student = students?.find(s => s.id === record.studentId);
      if (student?.program !== program) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  // Calculate real attendance data from database records
  const getMonthAttendance = (studentId: string) => {
    if (!attendanceRecords) return { present: 0, absent: 0, leaves: 0, totalDays: 0 };
    
    const studentRecords = attendanceRecords.filter(record => {
      const recordMonth = record.date?.slice(0, 7);
      return record.studentId === studentId && recordMonth === month;
    });

    const present = studentRecords.filter(r => r.status === 'present').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    const leaves = studentRecords.filter(r => r.status === 'leave').length;
    const totalDays = present + absent + leaves;

    return { present, absent, leaves, totalDays };
  };

  // Build attendance data from real records
  const attendanceData = students?.map((s) => {
    const attendance = getMonthAttendance(s.id);
    return {
      ...s,
      totalDays: attendance.totalDays,
      present: attendance.present,
      absent: attendance.absent,
      leaves: attendance.leaves,
    };
  }) || [];

  const filteredData = program === "all" 
    ? attendanceData 
    : attendanceData.filter((s) => s.program === program);

  const exportToCSV = () => {
    const headers = ["Roll Number", "Student Name", "Program", "Total Days", "Present", "Absent", "Leaves", "Attendance %"];
    const csvData = filteredData.map((s) => [
      s.rollNumber,
      s.fullName,
      s.program || "",
      s.totalDays,
      s.present,
      s.absent,
      s.leaves,
      s.totalDays > 0 ? ((s.present / s.totalDays) * 100).toFixed(1) : "0.0"
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${month}.csv`;
    a.click();
  };

  const saveReport = () => {
    const reportData = {
      reportType: "Student Attendance Report",
      month,
      program,
      generatedAt: new Date().toISOString(),
      data: filteredData
    };
    localStorage.setItem(`attendance-report-${Date.now()}`, JSON.stringify(reportData));
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-attendance-report">
              <Calendar className="h-8 w-8 text-primary" />
              Student Attendance Report
            </h1>
            <p className="text-muted-foreground mt-1">Monthly attendance summary (Real Data)</p>
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
              Summary
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('daily')}
              data-testid="button-daily-view"
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              Daily Records
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

      {/* Filters Section */}
      <Card className="no-print">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Month</label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-48"
                data-testid="input-month"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Program</label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger className="w-56" data-testid="select-program">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="no-print">
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'table' ? 'Attendance Summary' : viewMode === 'daily' ? 'Daily Attendance Records' : 'Detailed Report'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'table' ? 'Monthly attendance summary by student' : 
               viewMode === 'daily' ? 'Individual attendance records with edit options' : 
               'Printable detailed student reports'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Total Days</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Leaves</TableHead>
                      <TableHead className="text-right">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No attendance records found for {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. 
                          Mark attendance first using "Mark Attendance" option.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((student) => {
                        const percentage = student.totalDays > 0 
                          ? ((student.present / student.totalDays) * 100).toFixed(1) 
                          : "0.0";
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.rollNumber}</TableCell>
                            <TableCell>{student.fullName}</TableCell>
                            <TableCell>{student.program}</TableCell>
                            <TableCell className="text-right">{student.totalDays}</TableCell>
                            <TableCell className="text-right text-green-600">{student.present}</TableCell>
                            <TableCell className="text-right text-red-600">{student.absent}</TableCell>
                            <TableCell className="text-right text-blue-600">{student.leaves}</TableCell>
                            <TableCell className="text-right">
                              {student.totalDays > 0 ? (
                                <span className={`font-semibold ${
                                  parseFloat(percentage) >= 75 ? 'text-green-600' : 
                                  parseFloat(percentage) >= 60 ? 'text-orange-600' : 
                                  'text-red-600'
                                }`}>
                                  {percentage}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : viewMode === 'daily' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDailyRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No daily attendance records found for {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDailyRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{getStudentRoll(record.studentId)}</TableCell>
                          <TableCell>{getStudentName(record.studentId)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'present' ? 'bg-green-100 text-green-700' :
                              record.status === 'absent' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.remarks || '-'}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  data-testid={`button-edit-${record.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(record.id)}
                                  data-testid={`button-delete-${record.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <DetailedStudentReport
                students={filteredData}
                reportType="Student Attendance Report"
                reportDate={new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                additionalInfo={(student) => (
                  <>
                    <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                      Attendance Details
                    </h3>
                    <div className="space-y-1">
                      <div className="flex">
                        <span className="font-semibold w-32">Month:</span>
                        <span className="flex-1">{new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Total Days:</span>
                        <span className="flex-1">{student.totalDays} days</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Present:</span>
                        <span className="flex-1 text-green-600 font-bold">{student.present} days</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Absent:</span>
                        <span className="flex-1 text-red-600 font-bold">{student.absent} days</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Leaves:</span>
                        <span className="flex-1 text-blue-600 font-bold">{student.leaves} days</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">Percentage:</span>
                        <span className={`flex-1 font-bold text-lg ${
                          student.totalDays > 0 && ((student.present / student.totalDays) * 100) >= 75 ? 'text-green-600' : 
                          student.totalDays > 0 && ((student.present / student.totalDays) * 100) >= 60 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {student.totalDays > 0 ? ((student.present / student.totalDays) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm">
                          {student.totalDays === 0 
                            ? 'No attendance marked yet for this month.'
                            : ((student.present / student.totalDays) * 100) >= 75 
                            ? '✓ Good attendance record. Student is regular and punctual.' 
                            : ((student.present / student.totalDays) * 100) >= 60 
                            ? '⚠ Attendance needs improvement. Counseling recommended.' 
                            : '✗ Poor attendance. Immediate action required.'}
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

      {/* Print View - Always Detailed */}
      <div className="hidden print:block">
        <DetailedStudentReport
          students={filteredData}
          reportType="Student Attendance Report"
          reportDate={new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          additionalInfo={(student) => (
            <>
              <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                Attendance Details
              </h3>
              <div className="space-y-1">
                <div className="flex">
                  <span className="font-semibold w-32">Month:</span>
                  <span className="flex-1">{new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Total Days:</span>
                  <span className="flex-1">{student.totalDays} days</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Present:</span>
                  <span className="flex-1 text-green-600 font-bold">{student.present} days</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Absent:</span>
                  <span className="flex-1 text-red-600 font-bold">{student.absent} days</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Leaves:</span>
                  <span className="flex-1 text-blue-600 font-bold">{student.leaves} days</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Percentage:</span>
                  <span className={`flex-1 font-bold text-lg ${
                    student.totalDays > 0 && ((student.present / student.totalDays) * 100) >= 75 ? 'text-green-600' : 
                    student.totalDays > 0 && ((student.present / student.totalDays) * 100) >= 60 ? 'text-orange-600' : 
                    'text-red-600'
                  }`}>
                    {student.totalDays > 0 ? ((student.present / student.totalDays) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-sm">
                    {student.totalDays === 0 
                      ? 'No attendance marked yet for this month.'
                      : ((student.present / student.totalDays) * 100) >= 75 
                      ? '✓ Good attendance record. Student is regular and punctual.' 
                      : ((student.present / student.totalDays) * 100) >= 60 
                      ? '⚠ Attendance needs improvement. Counseling recommended.' 
                      : '✗ Poor attendance. Immediate action required.'}
                  </p>
                </div>
              </div>
            </>
          )}
        />
      </div>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Student</Label>
                  <p className="font-medium">{getStudentName(editingRecord.studentId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(editingRecord.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'present' | 'absent' | 'leave')}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Optional remarks..."
                  data-testid="input-edit-remarks"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} data-testid="button-save-edit">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
