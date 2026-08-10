import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, GraduationCap, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, PromotionRun, Program } from "@shared/schema";

export default function ClassPromotion() {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [fromSemester, setFromSemester] = useState<string>("");
  const [toSemester, setToSemester] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: promotionHistory } = useQuery<PromotionRun[]>({
    queryKey: ['/api/promotion/history'],
  });

  const eligibleStudents = allStudents?.filter(s => 
    s.status === 'active' && 
    s.program === selectedProgram && 
    s.semester === parseInt(fromSemester)
  ) || [];

  const promoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/promotion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: selectedProgram,
          fromSemester: parseInt(fromSemester),
          toSemester: parseInt(toSemester),
          studentIds: selectedStudents,
        }),
      });
      if (!res.ok) throw new Error('Failed to promote students');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/promotion/history'] });
      setSelectedStudents([]);
      toast({ 
        title: "Success", 
        description: `Successfully promoted ${data.promotedCount} students to Semester ${toSemester}` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to promote students", variant: "destructive" });
    },
  });

  const handleSelectAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleStudents.map(s => s.id));
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromote = () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Error", description: "Please select students to promote", variant: "destructive" });
      return;
    }
    if (!toSemester) {
      toast({ title: "Error", description: "Please select target semester", variant: "destructive" });
      return;
    }
    promoteMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Class Promotion</h1>
        <p className="text-muted-foreground">Promote students to next semester</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-students">
              {allStudents?.filter(s => s.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selected for Promotion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-selected-count">
              {selectedStudents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promotion Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-promotion-runs">
              {promotionHistory?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Promotion Settings
          </CardTitle>
          <CardDescription>Select program and semesters to promote students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Program</label>
              <Select value={selectedProgram} onValueChange={(v) => {
                setSelectedProgram(v);
                setSelectedStudents([]);
              }}>
                <SelectTrigger data-testid="select-program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">From Semester</label>
              <Select value={fromSemester} onValueChange={(v) => {
                setFromSemester(v);
                setToSemester((parseInt(v) + 1).toString());
                setSelectedStudents([]);
              }}>
                <SelectTrigger data-testid="select-from-semester">
                  <SelectValue placeholder="Current semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">To Semester</label>
              <Select value={toSemester} onValueChange={setToSemester}>
                <SelectTrigger data-testid="select-to-semester">
                  <SelectValue placeholder="Target semester" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map(s => (
                    <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handlePromote} 
                disabled={selectedStudents.length === 0 || promoteMutation.isPending}
                className="w-full"
                data-testid="button-promote"
              >
                {promoteMutation.isPending ? "Promoting..." : (
                  <>
                    Promote Selected <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProgram && fromSemester && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Eligible Students ({eligibleStudents.length})
              </CardTitle>
              {eligibleStudents.length > 0 && (
                <Button variant="outline" onClick={handleSelectAll} data-testid="button-select-all">
                  {selectedStudents.length === eligibleStudents.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={eligibleStudents.length > 0 && selectedStudents.length === eligibleStudents.length}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Current Semester</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleStudents.map(student => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                        data-testid={`checkbox-student-${student.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{student.rollNumber}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.fatherName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Semester {student.semester}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {eligibleStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students found in {selectedProgram} - Semester {fromSemester}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {promotionHistory && promotionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Promotion History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Students Promoted</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotionHistory.map(run => (
                  <TableRow key={run.id} data-testid={`row-history-${run.id}`}>
                    <TableCell className="font-medium">{run.program}</TableCell>
                    <TableCell>Semester {run.fromSemester}</TableCell>
                    <TableCell>Semester {run.toSemester}</TableCell>
                    <TableCell>
                      <Badge variant="default">{run.promotedCount} students</Badge>
                    </TableCell>
                    <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
