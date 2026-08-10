import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Edit, Trash2, BookOpen, Filter } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Grade, InsertGrade, Student } from "@shared/schema";
import { insertGradeSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const EXAM_TYPES = ["Mid-term", "Final", "Quiz", "Assignment", "Practical"];

const calculateGrade = (obtained: number, total: number): string => {
  if (!total || total === 0) return "N/A";
  const percentage = (obtained / total) * 100;
  
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "F";
};

const calculatePercentage = (obtained: number, total: number): number => {
  if (!total || total === 0) return 0;
  return Math.round((obtained / total) * 100 * 100) / 100;
};

const getGradeColor = (grade: string): string => {
  const gradeUpper = grade.toUpperCase();
  if (gradeUpper === "A+" || gradeUpper === "A") return "bg-green-500";
  if (gradeUpper === "B+" || gradeUpper === "B") return "bg-blue-500";
  if (gradeUpper === "C") return "bg-yellow-500";
  if (gradeUpper === "F") return "bg-red-500";
  return "bg-gray-500";
};

export default function GradeEntry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Only admin and teacher can access
  const canManageGrades = user?.role === 'admin' || user?.role === 'teacher';

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ['/api/grades'],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const form = useForm<InsertGrade>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      studentId: "",
      subject: "",
      semester: 1,
      examType: "",
      totalMarks: 100,
      obtainedMarks: 0,
      grade: "",
      teacherId: user?.role === 'teacher' ? user?.id : undefined,
      remarks: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGrade) => {
      const gradeValue = calculateGrade(data.obtainedMarks || 0, data.totalMarks || 100);
      return await apiRequest('POST', '/api/grades', { ...data, grade: gradeValue });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add grade",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertGrade>) => {
      if (!selectedGrade) throw new Error("No grade selected");
      const gradeValue = calculateGrade(
        data.obtainedMarks || selectedGrade.obtainedMarks || 0,
        data.totalMarks || selectedGrade.totalMarks || 100
      );
      return await apiRequest('PUT', `/api/grades/${selectedGrade.id}`, { ...data, grade: gradeValue });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      setEditDialogOpen(false);
      setSelectedGrade(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/grades/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      setDeleteDialogOpen(false);
      setSelectedGrade(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete grade",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    form.reset({
      studentId: "",
      subject: "",
      semester: 1,
      examType: "",
      totalMarks: 100,
      obtainedMarks: 0,
      grade: "",
      teacherId: user?.role === 'teacher' ? user?.id : undefined,
      remarks: "",
    });
    setAddDialogOpen(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    form.reset({
      studentId: grade.studentId,
      subject: grade.subject,
      semester: grade.semester || 1,
      examType: grade.examType || "",
      totalMarks: grade.totalMarks || 100,
      obtainedMarks: grade.obtainedMarks || 0,
      grade: grade.grade || "",
      teacherId: grade.teacherId || (user?.role === 'teacher' ? user?.id : undefined),
      remarks: grade.remarks || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: InsertGrade) => {
    if (editDialogOpen) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (selectedGrade) {
      deleteMutation.mutate(selectedGrade.id);
    }
  };

  // Get unique subjects and semesters for filters
  const uniqueSubjects = Array.from(new Set(grades.map(g => g.subject))).filter(Boolean);
  const uniqueSemesters = Array.from(new Set(grades.map(g => g.semester))).filter(Boolean).sort((a, b) => (a || 0) - (b || 0));

  // Filter grades
  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.studentId);
    const studentName = student?.fullName || "";
    const rollNumber = student?.rollNumber || "";
    
    const matchesSearch = searchTerm === "" ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = filterSemester === "all" || grade.semester?.toString() === filterSemester;
    const matchesSubject = filterSubject === "all" || grade.subject === filterSubject;
    
    return matchesSearch && matchesSemester && matchesSubject;
  });

  const exportToCSV = () => {
    const headers = ["Student Name", "Roll Number", "Subject", "Semester", "Exam Type", "Total Marks", "Obtained Marks", "Percentage", "Grade", "Remarks"];
    const rows = filteredGrades.map(grade => {
      const student = students.find(s => s.id === grade.studentId);
      return [
        student?.fullName || "",
        student?.rollNumber || "",
        grade.subject,
        grade.semester || "",
        grade.examType || "",
        grade.totalMarks || "",
        grade.obtainedMarks || "",
        calculatePercentage(grade.obtainedMarks || 0, grade.totalMarks || 100) + "%",
        grade.grade || "",
        grade.remarks || "",
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grades-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Grades exported to CSV successfully",
    });
  };

  const obtainedMarks = form.watch("obtainedMarks");
  const totalMarks = form.watch("totalMarks");
  const autoGrade = calculateGrade(obtainedMarks || 0, totalMarks || 100);
  const autoPercentage = calculatePercentage(obtainedMarks || 0, totalMarks || 100);

  if (!canManageGrades) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Only administrators and teachers can manage student grades.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-grade-entry">Grade Entry & Management</h1>
            <p className="text-muted-foreground">Enter and manage student examination grades</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAdd} data-testid="button-add-grade">
            <Plus className="h-4 w-4 mr-2" />
            Add Grade
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Grade Records</CardTitle>
              <CardDescription>View and manage all student grades</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-[140px]" data-testid="select-semester-filter">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map(sem => (
                    <SelectItem key={sem} value={sem?.toString() || ""}>{`Semester ${sem}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[140px]" data-testid="select-subject-filter">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {gradesLoading || studentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Grades Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterSemester !== "all" || filterSubject !== "all"
                  ? "Try adjusting your filters"
                  : "Start by adding grades for your students"}
              </p>
              {!searchTerm && filterSemester === "all" && filterSubject === "all" && (
                <Button onClick={handleAdd} data-testid="button-add-first-grade">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Grade
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead className="text-center">Exam Type</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const student = students.find(s => s.id === grade.studentId);
                    const percentage = calculatePercentage(grade.obtainedMarks || 0, grade.totalMarks || 100);
                    
                    return (
                      <TableRow key={grade.id} className="hover-elevate" data-testid={`grade-row-${grade.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student?.fullName || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{student?.rollNumber || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{grade.subject}</TableCell>
                        <TableCell className="text-center">{grade.semester || "N/A"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{grade.examType || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{grade.obtainedMarks || 0}</span>
                          <span className="text-muted-foreground"> / {grade.totalMarks || 100}</span>
                        </TableCell>
                        <TableCell className="text-center font-medium">{percentage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getGradeColor(grade.grade || "")} text-white`}>
                            {grade.grade || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{grade.remarks || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(grade)}
                              data-testid={`button-edit-${grade.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(grade)}
                              data-testid={`button-delete-${grade.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedGrade(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-grade">
              {editDialogOpen ? "Edit Grade" : "Add New Grade"}
            </DialogTitle>
            <DialogDescription>
              {editDialogOpen ? "Update the grade information below" : "Enter the grade details for the student"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-student">
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.fullName} ({student.rollNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject/Course</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Constitutional Law" {...field} data-testid="input-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-semester">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-exam-type">
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXAM_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-total-marks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="obtainedMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obtained Marks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-obtained-marks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Auto-calculated grade display */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calculated Percentage</p>
                    <p className="text-2xl font-bold" data-testid="text-auto-percentage">{autoPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calculated Grade</p>
                    <Badge className={`${getGradeColor(autoGrade)} text-white text-lg px-3 py-1`} data-testid="badge-auto-grade">
                      {autoGrade}
                    </Badge>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional comments or notes..."
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-remarks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setEditDialogOpen(false);
                    setSelectedGrade(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editDialogOpen ? "Update Grade" : "Add Grade")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
