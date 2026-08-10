import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Edit, Trash2, Calendar, Clock, Award } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Quiz, InsertQuiz } from "@shared/schema";
import { insertQuizSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, isPast, isFuture, isToday } from "date-fns";

export default function QuizzesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });

  const { data: staff } = useQuery<any[]>({
    queryKey: ['/api/staff'],
  });

  const canEditDelete = user?.role === 'admin' || user?.role === 'teacher';

  const getQuizStatus = (quizDate: string | Date): 'upcoming' | 'in-progress' | 'completed' => {
    const date = new Date(quizDate);
    if (isFuture(date)) return 'upcoming';
    if (isToday(date)) return 'in-progress';
    return 'completed';
  };

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const colors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      upcoming: 'default',
      'in-progress': 'secondary',
      completed: 'outline',
    };
    return colors[status] || 'secondary';
  };

  const filteredQuizzes = quizzes?.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === "all" || quiz.subject === filterSubject;
    const matchesSemester = filterSemester === "all" || quiz.semester?.toString() === filterSemester;
    const status = getQuizStatus(quiz.quizDate);
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesSubject && matchesSemester && matchesStatus;
  }) || [];

  const uniqueSubjects = Array.from(new Set(quizzes?.map(q => q.subject) || []));
  const uniqueSemesters = Array.from(new Set(quizzes?.map(q => q.semester).filter((sem): sem is number => sem !== null && sem !== undefined) || []));

  const form = useForm<InsertQuiz>({
    resolver: zodResolver(insertQuizSchema),
    defaultValues: {
      title: "",
      subject: "",
      semester: 1,
      quizDate: new Date() as any,
      duration: 60,
      totalMarks: 100,
      totalQuestions: 10,
      createdBy: "",
    },
  });

  const editForm = useForm<Partial<InsertQuiz>>({
    resolver: zodResolver(insertQuizSchema.partial()),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuiz) => {
      return await apiRequest('POST', '/api/quizzes', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertQuiz>) => {
      if (!selectedQuiz) throw new Error("No quiz selected");
      return await apiRequest('PUT', `/api/quizzes/${selectedQuiz.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setEditDialogOpen(false);
      setSelectedQuiz(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiz",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/quizzes/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setDeleteDialogOpen(false);
      setSelectedQuiz(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    editForm.reset({
      title: quiz.title,
      subject: quiz.subject,
      semester: quiz.semester ?? 1,
      quizDate: quiz.quizDate,
      duration: quiz.duration,
      totalMarks: quiz.totalMarks,
      totalQuestions: quiz.totalQuestions,
      createdBy: quiz.createdBy,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setDeleteDialogOpen(true);
  };

  const onSubmitCreate = (data: InsertQuiz) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: Partial<InsertQuiz>) => {
    updateMutation.mutate(data);
  };

  const confirmDelete = () => {
    if (selectedQuiz) {
      deleteMutation.mutate(selectedQuiz.id);
    }
  };

  const exportToCSV = () => {
    if (!filteredQuizzes.length) return;

    const headers = ["Title", "Subject", "Semester", "Quiz Date", "Duration (min)", "Total Marks", "Total Questions", "Status"];
    const rows = filteredQuizzes.map(quiz => [
      quiz.title,
      quiz.subject,
      quiz.semester ?? "",
      format(new Date(quiz.quizDate), "PPP"),
      quiz.duration,
      quiz.totalMarks,
      quiz.totalQuestions,
      getQuizStatus(quiz.quizDate),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizzes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-quizzes">Quiz Management</h1>
          <p className="text-muted-foreground">Create and manage quizzes for students</p>
        </div>
        {canEditDelete && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-quiz">
                <Plus className="h-4 w-4 mr-2" />
                Add Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>Add a new quiz for students</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Constitutional Law Quiz 1" {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Constitutional Law" {...field} data-testid="input-subject" />
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
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-semester">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                                <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quizDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                              data-testid="input-quiz-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-duration"
                            />
                          </FormControl>
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
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-total-marks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Questions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-total-questions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="createdBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Created By (Teacher)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-teacher">
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {staff?.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.fullName} ({teacher.designation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                      {createMutation.isPending ? "Creating..." : "Create Quiz"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Quizzes</CardTitle>
              <CardDescription>View and manage all scheduled quizzes</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40" data-testid="select-filter-subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-40" data-testid="select-filter-semester">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map((sem: number) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={exportToCSV} title="Export to CSV" data-testid="button-export">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading quizzes...</div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No quizzes found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => {
                    const status = getQuizStatus(quiz.quizDate);
                    return (
                      <TableRow key={quiz.id} data-testid={`row-quiz-${quiz.id}`}>
                        <TableCell className="font-medium" data-testid={`text-title-${quiz.id}`}>{quiz.title}</TableCell>
                        <TableCell data-testid={`text-subject-${quiz.id}`}>{quiz.subject}</TableCell>
                        <TableCell data-testid={`text-semester-${quiz.id}`}>{quiz.semester ? `Semester ${quiz.semester}` : '-'}</TableCell>
                        <TableCell data-testid={`text-date-${quiz.id}`}>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(quiz.quizDate), "PPp")}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-duration-${quiz.id}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {quiz.duration} min
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-marks-${quiz.id}`}>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            {quiz.totalMarks}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-questions-${quiz.id}`}>{quiz.totalQuestions}</TableCell>
                        <TableCell data-testid={`badge-status-${quiz.id}`}>
                          <Badge variant={getStatusColor(status)} className="capitalize">
                            {status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        {canEditDelete && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(quiz)}
                                data-testid={`button-edit-${quiz.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(quiz)}
                                data-testid={`button-delete-${quiz.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>Update quiz details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} data-testid="input-edit-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-semester">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="quizDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                          data-testid="input-edit-quiz-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-edit-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-edit-total-marks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="totalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Questions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-edit-total-questions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="createdBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created By (Teacher)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-teacher">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staff?.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.fullName} ({teacher.designation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-edit-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-edit-submit">
                  {updateMutation.isPending ? "Updating..." : "Update Quiz"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz "{selectedQuiz?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
