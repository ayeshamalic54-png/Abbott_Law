import { useQuery } from "@tanstack/react-query";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Users, Clock, TrendingUp,
  CheckCircle2, XCircle, RefreshCw, AlertCircle, Search
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import type { Program } from "@shared/schema";

type StudentAttendance = {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  subject?: string;
  remarks?: string;
  student: {
    rollNumber: string;
    fullName: string;
    fatherName?: string;
    program: string;
  };
};

export default function PBCDashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: attendance = [], isLoading } = useQuery<StudentAttendance[]>({
    queryKey: ["/api/attendance/student"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (attendance.length) setLastUpdated(new Date());
  }, [attendance]);

  const filtered = attendance.filter(a => {
    const dateMatch = a.date >= fromDate && a.date <= toDate;
    const programMatch =
      selectedProgram === "all" || a.student.program === selectedProgram;
    const q = searchQuery.toLowerCase();
    return (
      dateMatch &&
      programMatch &&
      (!q ||
        a.student.rollNumber.toLowerCase().includes(q) ||
        a.student.fullName.toLowerCase().includes(q) ||
        a.student.fatherName?.toLowerCase().includes(q))
    );
  });

  const count = (s: string) => filtered.filter(a => a.status === s).length;
  const rate = filtered.length
    ? Math.round((count("present") / filtered.length) * 100)
    : 0;

  const badge = (s: string) => {
    const map: any = {
      present: [CheckCircle2, "Present", "text-green-700"],
      absent: [XCircle, "Absent", "text-red-700"],
      late: [Clock, "Late", "text-yellow-700"],
      leave: [Calendar, "Leave", "text-blue-700"],
    };
    const [Icon, text, cls] = map[s];
    return (
      <Badge variant="outline" className={cls}>
        <Icon className="h-3 w-3 mr-1" /> {text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pakistan Bar Council Portal</h1>
          <p className="text-muted-foreground">
            Student Attendance Monitoring (Read-Only)
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-3 py-2 border rounded-md"
            placeholder="Search Roll No, Name, Father Name"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />

        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs?.map(p => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-5 gap-4">
        {[
          ["Total", filtered.length],
          ["Present", count("present")],
          ["Absent", count("absent")],
          ["Leave", count("leave")],
          ["Attendance %", `${rate}%`],
        ].map(([t, v]) => (
          <Card key={t}>
            <CardHeader>
              <CardTitle className="text-sm">{t}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{v}</CardContent>
          </Card>
        ))}
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {new Date(fromDate).toDateString()} – {new Date(toDate).toDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Clock className="animate-spin mx-auto" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Father</th>
                  <th>Program</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b">
                    <td>{r.student.rollNumber}</td>
                    <td>{r.student.fullName}</td>
                    <td>{r.student.fatherName || "-"}</td>
                    <td>{r.student.program}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{badge(r.status)}</td>
                    <td>{r.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* INFO */}
      <Card className="bg-blue-50">
        <CardContent className="flex gap-3 p-4">
          <AlertCircle className="text-blue-600" />
          <p className="text-sm text-blue-800">
            This is a read-only Pakistan Bar Council monitoring portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
