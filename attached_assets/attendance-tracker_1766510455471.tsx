import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Minus, Save, ArrowLeft, Edit } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student, Program } from "@shared/schema";

type AttendanceStatus = 'present' | 'absent' | 'leave';

type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  subject?: string;
  remarks?: string;
};

type Course = {
  id: number;
  name: string;
  code: string;
};

export default function AttendanceTracker() {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, AttendanceStatus>>({});

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch existing attendance for the selected from date
  const { data: existingAttendance, refetch: refetchAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/student', fromDate],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/student?date=${fromDate}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
    enabled: !!fromDate,
  });

  // Load existing attendance when date changes or data loads
  useEffect(() => {
    if (existingAttendance) {
      const existingMarks: Record<string, AttendanceStatus> = {};
      existingAttendance.forEach(record => {
        if (record.date === fromDate) {
          existingMarks[record.studentId] = record.status;
        }
      });
      setAttendanceMarks(existingMarks);
    } else {
      setAttendanceMarks({});
    }
  }, [existingAttendance, fromDate]);

  const filteredStudents = students?.filter(s => 
    !selectedProgram || selectedProgram === 'all' || s.program === selectedProgram
  ) || [];

  const getExistingStatus = (studentId: string): AttendanceStatus | undefined => {
    const existing = existingAttendance?.find(a => a.studentId === studentId && a.date === fromDate);
    return existing?.status;
  };

  const getStudentStatus = (studentId: string): AttendanceStatus | undefined => {
    return attendanceMarks[studentId] || getExistingStatus(studentId);
  };

  const markAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Generate all dates between fromDate and toDate
  const getDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate > endDate) return [start];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dates = getDateRange(fromDate, toDate);
      const promises: Promise<any>[] = [];
      
      // For each student with marked attendance, save for all dates in range
      Object.entries(attendanceMarks).forEach(([studentId, status]) => {
        dates.forEach(date => {
          promises.push(
            apiRequest('POST', '/api/attendance/students', {
              studentId,
              date,
              status,
              subject: selectedSubject || undefined,
            })
          );
        });
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      const dates = getDateRange(fromDate, toDate);
      toast({
        title: "Success",
        description: `Attendance saved for ${dates.length} day(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/student'] });
      refetchAttendance();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAllPresent = () => {
    const marks: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => {
      marks[s.id] = 'present';
    });
    setAttendanceMarks(marks);
  };

  const markAllAbsent = () => {
    const marks: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => {
      marks[s.id] = 'absent';
    });
    setAttendanceMarks(marks);
  };

  const presentCount = filteredStudents.filter(s => getStudentStatus(s.id) === 'present').length;
  const absentCount = filteredStudents.filter(s => getStudentStatus(s.id) === 'absent').length;
  const leaveCount = filteredStudents.filter(s => getStudentStatus(s.id) === 'leave').length;

  const dateRangeCount = getDateRange(fromDate, toDate).length;
  const hasExistingRecords = existingAttendance && existingAttendance.filter(a => a.date === fromDate).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-attendance">Mark Attendance</h1>
          <p className="text-muted-foreground">Record and manage student attendance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Take Attendance
              </CardTitle>
              <CardDescription>Mark students as present, absent, or on leave</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Program</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-56" data-testid="select-program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectGroup>
                    <SelectLabel className="font-bold text-indigo-600">LLB Programs</SelectLabel>
                    <SelectItem value="LLB (1 Year)">LLB 1st Year</SelectItem>
                    <SelectItem value="LLB (2 Years)">LLB 2nd Year</SelectItem>
                    <SelectItem value="LLB (3 Years)">LLB 3rd Year</SelectItem>
                    <SelectItem value="LLB (4 Years)">LLB 4th Year</SelectItem>
                    <SelectItem value="LLB (5 Years)">LLB 5th Year</SelectItem>
                    <SelectItem value="LLM">LLM</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="font-bold text-green-600">Abbott Group Programs</SelectLabel>
                    <SelectItem value="B.ED (1.5 Years)">B.Ed (1.5 Years)</SelectItem>
                    <SelectItem value="B.ED (2.5 Years)">B.Ed (2.5 Years)</SelectItem>
                    <SelectItem value="BS Education (4 Years)">BS Education</SelectItem>
                    <SelectItem value="BS Physical Education (4 Years)">BS Physical Education</SelectItem>
                    <SelectItem value="JDPE">JDPE</SelectItem>
                    <SelectItem value="ADPE">ADPE</SelectItem>
                    <SelectItem value="DDM">DDM</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-56" data-testid="select-subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.name}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background h-10"
                data-testid="input-from-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background h-10"
                data-testid="input-to-date"
              />
            </div>
            <div className="flex items-center gap-2 h-10">
              {dateRangeCount > 1 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {dateRangeCount} days
                </Badge>
              )}
              {hasExistingRecords && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Records exist
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" onClick={markAllPresent} data-testid="button-mark-all-present">
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Mark All Present
            </Button>
            <Button variant="outline" onClick={markAllAbsent} data-testid="button-mark-all-absent">
              <X className="h-4 w-4 mr-2 text-red-600" />
              Mark All Absent
            </Button>
            {hasExistingRecords && (
              <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1">
                <Edit className="h-3 w-3 mr-1" />
                EDITING MODE - Records loaded
              </Badge>
            )}
            <Button variant="outline" onClick={() => setAttendanceMarks({})} data-testid="button-clear">
              Clear All
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students found. Select a program or add students first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead className="text-right">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const status = getStudentStatus(student.id);
                      const existingStatus = getExistingStatus(student.id);
                      return (
                        <TableRow key={student.id} className="hover-elevate">
                          <TableCell className="font-mono text-sm">{student.rollNumber}</TableCell>
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{student.program}</TableCell>
                          <TableCell>
                            {status ? (
                              <Badge variant={
                                status === 'present' ? 'default' :
                                status === 'absent' ? 'destructive' : 'secondary'
                              } className={
                                status === 'present' ? 'bg-green-500' :
                                status === 'absent' ? 'bg-red-500' : 'bg-orange-500'
                              }>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {existingStatus && existingStatus !== attendanceMarks[student.id] && attendanceMarks[student.id] && (
                                  <span className="ml-1 text-xs">(edited)</span>
                                )}
                              </Badge>
                            ) : existingStatus ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                {existingStatus.charAt(0).toUpperCase() + existingStatus.slice(1)} (saved)
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not marked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant={status === 'present' ? 'default' : 'ghost'}
                                size="icon"
                                className={`h-8 w-8 ${status === 'present' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-50 dark:hover:bg-green-950'}`}
                                title="Present"
                                onClick={() => markAttendance(student.id, 'present')}
                                data-testid={`button-present-${student.id}`}
                              >
                                <Check className={`h-4 w-4 ${status === 'present' ? 'text-white' : 'text-green-600'}`} />
                              </Button>
                              <Button
                                variant={status === 'absent' ? 'default' : 'ghost'}
                                size="icon"
                                className={`h-8 w-8 ${status === 'absent' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50 dark:hover:bg-red-950'}`}
                                title="Absent"
                                onClick={() => markAttendance(student.id, 'absent')}
                                data-testid={`button-absent-${student.id}`}
                              >
                                <X className={`h-4 w-4 ${status === 'absent' ? 'text-white' : 'text-red-600'}`} />
                              </Button>
                              <Button
                                variant={status === 'leave' ? 'default' : 'ghost'}
                                size="icon"
                                className={`h-8 w-8 ${status === 'leave' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 dark:hover:bg-orange-950'}`}
                                title="Leave"
                                onClick={() => markAttendance(student.id, 'leave')}
                                data-testid={`button-leave-${student.id}`}
                              >
                                <Minus className={`h-4 w-4 ${status === 'leave' ? 'text-white' : 'text-orange-600'}`} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setAttendanceMarks({})} data-testid="button-cancel">
                  Reset
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={Object.keys(attendanceMarks).length === 0 || saveMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : `Save Attendance${dateRangeCount > 1 ? ` (${dateRangeCount} days)` : ''}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{leaveCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
