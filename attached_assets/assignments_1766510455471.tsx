import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Edit, Trash2, Search, Calendar } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Assignment, InsertAssignment, Program } from "@shared/schema";
import { insertAssignmentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AssignmentsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const isAdmin = user?.role === 'admin';

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const form = useForm<InsertAssignment>({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      program: "",
      semester: 1,
      section: "",
      dueDate: new Date().toISOString().split('T')[0],
      totalMarks: 100,
      status: "active",
      assignedBy: "",
    },
  });

  const editForm = useForm<InsertAssignment>({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      return await apiRequest('POST', '/api/assignments', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      if (!selectedAssignment) throw new Error("No assignment selected");
      return await apiRequest('PUT', `/api/assignments/${selectedAssignment.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setEditDialogOpen(false);
      setSelectedAssignment(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/assignments/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    editForm.reset({
      title: assignment.title,
      description: assignment.description ?? "",
      program: assignment.program ?? "",
      semester: assignment.semester ?? 1,
      section: assignment.section ?? "",
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks ?? 100,
      status: (assignment.status as "active" | "completed" | "cancelled") ?? "active",
      assignedBy: assignment.assignedBy ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string | null, dueDate: string) => {
    if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    if (status === 'completed') return <Badge className="bg-green-500 text-white">Completed</Badge>;
    if (isPast(parseISO(dueDate))) return <Badge variant="outline" className="text-orange-600 border-orange-600">Overdue</Badge>;
    return <Badge className="bg-blue-500 text-white">Active</Badge>;
  };

  const filteredAssignments = assignments?.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProgram = filterProgram === "all" || a.program === filterProgram;
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesProgram && matchesStatus;
  }) || [];

  const uniquePrograms = Array.from(new Set(assignments?.map(a => a.program).filter(Boolean) || []));

  const renderForm = (formInstance: typeof form, onSubmit: (data: InsertAssignment) => void, isPending: boolean, submitText: string) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={formInstance.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="Assignment title" data-testid="input-title" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={formInstance.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder="Assignment description" data-testid="input-description" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="program" render={({ field }) => (
            <FormItem><FormLabel>Program</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl><SelectTrigger data-testid="select-program"><SelectValue placeholder="Select program" /></SelectTrigger></FormControl>
                <SelectContent>{programs?.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="semester" render={({ field }) => (
            <FormItem><FormLabel>Semester</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() ?? "1"}>
                <FormControl><SelectTrigger data-testid="select-semester"><SelectValue placeholder="Semester" /></SelectTrigger></FormControl>
                <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="section" render={({ field }) => (
            <FormItem><FormLabel>Section (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g., A" data-testid="input-section" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="dueDate" render={({ field }) => (
            <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-due-date" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="totalMarks" render={({ field }) => (
            <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 100} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-total-marks" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={formInstance.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "active"}>
                <FormControl><SelectTrigger data-testid="select-status"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={formInstance.control} name="assignedBy" render={({ field }) => (
          <FormItem><FormLabel>Assigned By</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="Teacher name" data-testid="input-assigned-by" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => { setAddDialogOpen(false); setEditDialogOpen(false); }}>Cancel</Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit">{isPending ? "Saving..." : submitText}</Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-assignments">Assignments</h1>
            <p className="text-muted-foreground">Manage course assignments</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-assignment">
            <Plus className="h-4 w-4 mr-2" />Add Assignment
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assignments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search" />
            </div>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-48" data-testid="filter-program"><SelectValue placeholder="Filter by Program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {uniquePrograms.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="filter-status"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Assignments</h3>
              <p className="text-muted-foreground">
                {isAdmin ? "Click 'Add Assignment' to create one." : "Assignments will appear here once created."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        {assignment.description && <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.program || '-'}</TableCell>
                    <TableCell>{assignment.semester ? `Sem ${assignment.semester}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(parseISO(assignment.dueDate), 'dd MMM yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.totalMarks || '-'}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status, assignment.dueDate)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)} data-testid={`button-edit-${assignment.id}`}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment)} data-testid={`button-delete-${assignment.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
            <DialogDescription>Create a new assignment</DialogDescription>
          </DialogHeader>
          {renderForm(form, (data) => createMutation.mutate(data), createMutation.isPending, "Create Assignment")}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update assignment details</DialogDescription>
          </DialogHeader>
          {renderForm(editForm, (data) => updateMutation.mutate(data), updateMutation.isPending, "Save Changes")}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>This will remove "{selectedAssignment?.title}". This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedAssignment && deleteMutation.mutate(selectedAssignment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
