import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, FileText, Printer, CheckCircle2, XCircle, Check, X, Minus, Save } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type StaffAttendance = {
  id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
};

type Staff = {
  id: string;
  fullName: string;
  designation?: string;
  department?: string;
  employeeId: string;
};

type AttendanceStatus = 'present' | 'absent' | 'leave';

export default function StaffAttendanceReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [markingDate, setMarkingDate] = useState<string>(today);
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, AttendanceStatus>>({});
  const isAdmin = user?.role === 'admin';

  const { data: allAttendance = [], isLoading: attendanceLoading } = useQuery<StaffAttendance[]>({
    queryKey: ['/api/attendance/staff'],
    queryFn: async () => {
      const res = await fetch('/api/attendance/staff', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
  });

  const attendance = allAttendance.filter(a => {
    const date = a.date;
    return date >= fromDate && date <= toDate;
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const markingDateAttendance = allAttendance.filter(a => a.date === markingDate);
  const attendanceMap = new Map(markingDateAttendance.map(a => [a.staffId, a]));

  const getExistingStatus = (staffId: string): AttendanceStatus | undefined => {
    const existing = attendanceMap.get(staffId);
    return existing?.status as AttendanceStatus | undefined;
  };

  const getStaffStatus = (staffId: string): AttendanceStatus | undefined => {
    return attendanceMarks[staffId] || getExistingStatus(staffId);
  };

  const markAttendance = (staffId: string, status: AttendanceStatus) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [staffId]: status
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(attendanceMarks).map(([staffId, status]) => 
        apiRequest('POST', '/api/attendance/staff', {
          staffId,
          date: markingDate,
          status,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff attendance saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/staff'] });
      setAttendanceMarks({});
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
    staff.forEach(s => {
      marks[s.id] = 'present';
    });
    setAttendanceMarks(marks);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>;
    const variants: Record<string, { bg: string; text: string; icon: any }> = {
      present: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Present', icon: CheckCircle2 },
      absent: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Absent', icon: XCircle },
      leave: { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'Leave', icon: Minus },
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

  const presentCount = staff.filter(s => getStaffStatus(s.id) === 'present').length;
  const absentCount = staff.filter(s => getStaffStatus(s.id) === 'absent').length;
  const leaveCount = staff.filter(s => getStaffStatus(s.id) === 'leave').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-staff-attendance">Staff Attendance</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Mark and manage staff attendance" : "View staff attendance records"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={markAllPresent} data-testid="button-mark-all-present">
              Mark All Present
            </Button>
          )}
          <Button variant="default" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>View attendance report for a date range, or mark attendance for a specific date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-1 block">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                data-testid="input-from-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                data-testid="input-to-date"
              />
            </div>
            {isAdmin && (
              <div>
                <label className="text-sm font-medium mb-1 block">Mark Attendance For</label>
                <input
                  type="date"
                  value={markingDate}
                  onChange={(e) => {
                    setMarkingDate(e.target.value);
                    setAttendanceMarks({});
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  data-testid="input-marking-date"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print header - only visible in print */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Abbott Law College</h1>
        <p className="text-sm text-gray-600">Mansehra, Khyber Pakhtunkhwa</p>
        <div className="border-t-2 border-gray-300 mt-2 mb-2"></div>
        <h2 className="text-lg font-bold">Staff Attendance Report</h2>
        <p className="text-sm">
          {fromDate === toDate 
            ? `Date: ${new Date(fromDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : `From: ${new Date(fromDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })} To: ${new Date(toDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}`
          }
        </p>
      </div>

      {/* Summary - visible in both screen and print */}
      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-2 print:mb-4">
        <div className="border rounded-lg p-3 print:border-black print:p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Present</span>
            <CheckCircle2 className="h-4 w-4 text-green-600 print:hidden" />
          </div>
          <div className="text-2xl font-bold text-green-600 print:text-black print:text-lg">{presentCount}</div>
        </div>
        <div className="border rounded-lg p-3 print:border-black print:p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Absent</span>
            <XCircle className="h-4 w-4 text-red-600 print:hidden" />
          </div>
          <div className="text-2xl font-bold text-red-600 print:text-black print:text-lg">{absentCount}</div>
        </div>
        <div className="border rounded-lg p-3 print:border-black print:p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">On Leave</span>
            <Minus className="h-4 w-4 text-orange-600 print:hidden" />
          </div>
          <div className="text-2xl font-bold text-orange-600 print:text-black print:text-lg">{leaveCount}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Staff Attendance {fromDate === toDate ? `- ${new Date(fromDate).toLocaleDateString()}` : `(${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()})`}</CardTitle>
              <CardDescription>Total Staff: {staff.length}</CardDescription>
            </div>
            {isAdmin && Object.keys(attendanceMarks).length > 0 && (
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Employee ID</th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Designation</th>
                  <th className="text-left p-3 font-semibold">Department</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  {isAdmin && <th className="text-right p-3 font-semibold">Mark/Edit Attendance</th>}
                </tr>
              </thead>
              <tbody>
                {staff.map((member, index) => {
                  const status = getStaffStatus(member.id);
                  return (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-mono text-sm">{member.employeeId}</td>
                      <td className="p-3 font-medium">{member.fullName}</td>
                      <td className="p-3 text-sm">{member.designation || '-'}</td>
                      <td className="p-3 text-sm">{member.department || '-'}</td>
                      <td className="p-3">{getStatusBadge(status)}</td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant={status === 'present' ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-8 w-8 ${status === 'present' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-50 dark:hover:bg-green-950'}`}
                              title="Present"
                              onClick={() => markAttendance(member.id, 'present')}
                              data-testid={`button-present-${member.id}`}
                            >
                              <Check className={`h-4 w-4 ${status === 'present' ? 'text-white' : 'text-green-600'}`} />
                            </Button>
                            <Button
                              variant={status === 'absent' ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-8 w-8 ${status === 'absent' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50 dark:hover:bg-red-950'}`}
                              title="Absent"
                              onClick={() => markAttendance(member.id, 'absent')}
                              data-testid={`button-absent-${member.id}`}
                            >
                              <X className={`h-4 w-4 ${status === 'absent' ? 'text-white' : 'text-red-600'}`} />
                            </Button>
                            <Button
                              variant={status === 'leave' ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-8 w-8 ${status === 'leave' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 dark:hover:bg-orange-950'}`}
                              title="Leave"
                              onClick={() => markAttendance(member.id, 'leave')}
                              data-testid={`button-leave-${member.id}`}
                            >
                              <Minus className={`h-4 w-4 ${status === 'leave' ? 'text-white' : 'text-orange-600'}`} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
