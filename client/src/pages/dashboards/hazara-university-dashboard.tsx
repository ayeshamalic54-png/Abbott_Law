import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, TrendingUp, CheckCircle2, XCircle, RefreshCw, AlertCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import type { Program } from "@shared/schema";
import hazaraLogo from "@assets/hazara_1766558722259.png";

type StudentAttendance = {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  subject?: string;
  remarks?: string;
  student: {
    rollNumber: string;
    fullName: string;
    fatherName?: string;
    program: string;
  };
};

export default function HazaraUniversityDashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: attendance = [], isLoading: attendanceLoading, refetch } = useQuery<StudentAttendance[]>({
    queryKey: ['/api/attendance/student'],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (attendance.length > 0) {
      setLastUpdated(new Date());
    }
  }, [attendance]);

  // Get LLB program names for filtering - only when programs have loaded
  const llbProgramNames = programs?.filter(p => p.category === 'llb').map(p => p.name) || [];

  // Filter attendance - only show LLB programs, and only when programs have loaded
  const filteredAttendance = programsLoading || llbProgramNames.length === 0
    ? []
    : attendance.filter(a => {
        const dateMatch = a.date >= fromDate && a.date <= toDate;
        // Only show LLB program students in Hazara portal
        const isLlbProgram = llbProgramNames.includes(a.student?.program || '');
        const programMatch = selectedProgram === 'all' ? isLlbProgram : a.student?.program === selectedProgram;
        const searchLower = searchQuery.toLowerCase().trim();
        const searchMatch = !searchLower || 
          a.student?.rollNumber?.toLowerCase().includes(searchLower) ||
          a.student?.fullName?.toLowerCase().includes(searchLower) ||
          a.student?.fatherName?.toLowerCase().includes(searchLower);
        return dateMatch && programMatch && searchMatch;
      });
  
  const isLoading = attendanceLoading || programsLoading;
  
  const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
  const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
  const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
  const leaveCount = filteredAttendance.filter(a => a.status === 'leave').length;
  
  const attendancePercentage = filteredAttendance.length > 0 
    ? Math.round((presentCount / filteredAttendance.length) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img 
            src={hazaraLogo} 
            alt="Hazara University Logo" 
            className="h-16 w-16 object-contain"
            data-testid="img-hazara-logo"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-hazara-dashboard">
              Hazara University Portal
            </h1>
            <p className="text-muted-foreground">
              Student Attendance Monitoring (Read-Only)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Auto-updating every 5 seconds
          <span className="ml-2">Last: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Roll No, Name, or Father Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm"
            data-testid="input-from-date"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm"
            data-testid="input-to-date"
          />
        </div>
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-56" data-testid="select-program">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All LLB Programs</SelectItem>
            {programs && programs.filter(p => p.category === 'llb').map(p => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAttendance.length}</div>
            <p className="text-xs text-muted-foreground">Students marked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">Students present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground">Students absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{leaveCount}</div>
            <p className="text-xs text-muted-foreground">On leave</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground">Present rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Real-time student attendance data from {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Roll Number</th>
                    <th className="text-left p-3 font-semibold">Student Name</th>
                    <th className="text-left p-3 font-semibold">Father Name</th>
                    <th className="text-left p-3 font-semibold">Program</th>
                    <th className="text-left p-3 font-semibold">Subject</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium" data-testid={`roll-${record.id}`}>
                        {record.student?.rollNumber || 'N/A'}
                      </td>
                      <td className="p-3">{record.student?.fullName || 'Unknown'}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {record.student?.fatherName || '-'}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {record.student?.program || 'N/A'}
                      </td>
                      <td className="p-3 text-sm font-medium text-blue-600">
                        {record.subject || '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">{getStatusBadge(record.status)}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Read-Only Access</h3>
              <p className="text-sm text-blue-700 mt-1">
                This portal provides read-only access to student attendance records for monitoring and reporting purposes. 
                You cannot modify or delete any records from this interface. Data updates automatically every 5 seconds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
