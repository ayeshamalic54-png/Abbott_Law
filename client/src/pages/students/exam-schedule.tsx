import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Calendar, Clock, Printer, Plus, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExamSchedule, InsertExamSchedule, Program } from "@shared/schema";
import { insertExamScheduleSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const EXAM_TYPES = ['midterm', 'final', 'quiz', 'practical', 'internal'] as const;

export default function ExamSchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamSchedule | null>(null);

  const isAdmin = user?.role === 'admin';

  const { data: exams, isLoading } = useQuery<ExamSchedule[]>({
    queryKey: ['/api/exam-schedules'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const form = useForm<InsertExamSchedule>({
    resolver: zodResolver(insertExamScheduleSchema),
    defaultValues: {
      title: "",
      examType: "midterm",
      program: "",
      semester: 1,
      courseName: "",
      examDate: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "12:00",
      room: "",
      invigilatorName: "",
      totalMarks: 100,
      passingMarks: 40,
      instructions: "",
      status: "scheduled",
    },
  });

  const editForm = useForm<Partial<InsertExamSchedule>>({
    resolver: zodResolver(insertExamScheduleSchema.partial()),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExamSchedule) => {
      return await apiRequest('POST', '/api/exam-schedules', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam scheduled successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-schedules'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertExamSchedule>) => {
      if (!selectedExam) throw new Error("No exam selected");
      return await apiRequest('PUT', `/api/exam-schedules/${selectedExam.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-schedules'] });
      setEditDialogOpen(false);
      setSelectedExam(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/exam-schedules/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Exam deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-schedules'] });
      setDeleteDialogOpen(false);
      setSelectedExam(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (exam: ExamSchedule) => {
    setSelectedExam(exam);
    editForm.reset({
      title: exam.title,
      examType: exam.examType as any,
      program: exam.program,
      semester: exam.semester ?? 1,
      courseName: exam.courseName ?? "",
      examDate: exam.examDate,
      startTime: exam.startTime ?? "",
      endTime: exam.endTime ?? "",
      room: exam.room ?? "",
      invigilatorName: exam.invigilatorName ?? "",
      totalMarks: exam.totalMarks ?? 100,
      passingMarks: exam.passingMarks ?? 40,
      instructions: exam.instructions ?? "",
      status: exam.status as any ?? "scheduled",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (exam: ExamSchedule) => {
    setSelectedExam(exam);
    setDeleteDialogOpen(true);
  };

  const filteredExams = exams?.filter(e => {
    const matchesProgram = filterProgram === "all" || e.program === filterProgram;
    const matchesType = filterType === "all" || e.examType === filterType;
    return matchesProgram && matchesType;
  }) || [];

  const groupedExams = filteredExams.reduce((acc, exam) => {
    const type = exam.examType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(exam);
    return acc;
  }, {} as Record<string, ExamSchedule[]>);

  const getExamTypeColor = (type: string) => {
    const colors: Record<string, string> = { midterm: 'bg-blue-500', final: 'bg-red-500', quiz: 'bg-green-500', practical: 'bg-purple-500', internal: 'bg-orange-500' };
    return colors[type] || 'bg-gray-500';
  };

  const getExamStatus = (dateStr: string) => {
    const examDate = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate < today) return { label: 'Completed', color: 'bg-green-500' };
    if (examDate.toDateString() === today.toDateString()) return { label: 'Today', color: 'bg-orange-500' };
    return { label: 'Upcoming', color: 'bg-blue-500' };
  };

  const printSchedule = () => window.print();
  const uniquePrograms = Array.from(new Set(exams?.map(e => e.program) || []));

  const renderForm = (formInstance: any, onSubmit: (data: any) => void, isPending: boolean, submitText: string) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={formInstance.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Exam Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Mid-Term Examination 2025" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="examType" render={({ field }) => (
            <FormItem><FormLabel>Exam Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="program" render={({ field }) => (
            <FormItem><FormLabel>Program</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger></FormControl>
                <SelectContent>{programs?.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="semester" render={({ field }) => (
            <FormItem><FormLabel>Semester</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                <FormControl><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger></FormControl>
                <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={formInstance.control} name="courseName" render={({ field }) => (
          <FormItem><FormLabel>Course/Subject</FormLabel><FormControl><Input {...field} placeholder="e.g., Constitutional Law" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-3 gap-4">
          <FormField control={formInstance.control} name="examDate" render={({ field }) => (
            <FormItem><FormLabel>Exam Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="startTime" render={({ field }) => (
            <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="endTime" render={({ field }) => (
            <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="room" render={({ field }) => (
            <FormItem><FormLabel>Room/Venue</FormLabel><FormControl><Input {...field} placeholder="e.g., Examination Hall A" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="invigilatorName" render={({ field }) => (
            <FormItem><FormLabel>Invigilator</FormLabel><FormControl><Input {...field} placeholder="e.g., Prof. Ahmed" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="totalMarks" render={({ field }) => (
            <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="passingMarks" render={({ field }) => (
            <FormItem><FormLabel>Passing Marks</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={formInstance.control} name="instructions" render={({ field }) => (
          <FormItem><FormLabel>Instructions (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="Any special instructions for students" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => { setAddDialogOpen(false); setEditDialogOpen(false); }}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitText}</Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-exam-schedule">Exam Schedule</h1>
            <p className="text-muted-foreground">View examination dates and details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={printSchedule} className="no-print" data-testid="button-print-exam-schedule">
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-exam">
              <Plus className="h-4 w-4 mr-2" />Add Exam
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {uniquePrograms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : filteredExams.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Exams Scheduled</h3>
          <p className="text-muted-foreground">
            {isAdmin ? "Click 'Add Exam' to schedule examinations." : "Examination schedules will appear here once announced."}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExams).map(([examType, typeExams]) => (
            <Card key={examType}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {examType.charAt(0).toUpperCase() + examType.slice(1)} Examinations
                    <Badge className={`${getExamTypeColor(examType)} text-white`}>{typeExams.length} Exams</Badge>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typeExams.map((exam) => {
                    const status = getExamStatus(exam.examDate);
                    return (
                      <div key={exam.id} className="p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 hover-elevate" data-testid={`exam-${exam.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{exam.title}</h4>
                              <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                              {exam.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{exam.courseName || 'N/A'} - {exam.program} (Semester {exam.semester})</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{format(parseISO(exam.examDate), 'dd MMM yyyy')}</p></div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div><p className="text-xs text-muted-foreground">Time</p><p className="font-medium">{exam.startTime || 'TBA'} - {exam.endTime || 'TBA'}</p></div>
                              </div>
                              <div className="text-sm"><p className="text-xs text-muted-foreground">Venue</p><p className="font-medium">{exam.room || 'TBA'}</p></div>
                              <Badge variant="outline" className="px-3 py-1 h-fit">{exam.totalMarks || 0} Marks</Badge>
                            </div>
                            {exam.invigilatorName && <p className="text-sm text-muted-foreground mt-2">Invigilator: {exam.invigilatorName}</p>}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} data-testid={`button-edit-${exam.id}`}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(exam)} data-testid={`button-delete-${exam.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Exam</DialogTitle>
            <DialogDescription>Add a new examination to the schedule</DialogDescription>
          </DialogHeader>
          {renderForm(form, (data) => createMutation.mutate(data), createMutation.isPending, "Schedule Exam")}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update examination details</DialogDescription>
          </DialogHeader>
          {renderForm(editForm, (data) => updateMutation.mutate(data), updateMutation.isPending, "Save Changes")}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>This will remove "{selectedExam?.title}". This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedExam && deleteMutation.mutate(selectedExam.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`@media print { .no-print { display: none !important; } @page { size: A4; margin: 15mm; } }`}</style>
    </div>
  );
}
