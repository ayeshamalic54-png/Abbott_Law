import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Printer, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClassTimetable, InsertClassTimetable, Program } from "@shared/schema";
import { insertClassTimetableSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function Timetable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ClassTimetable | null>(null);

  const isAdmin = user?.role === 'admin';

  const { data: timetables, isLoading } = useQuery<ClassTimetable[]>({
    queryKey: ['/api/timetables'],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const form = useForm<InsertClassTimetable>({
    resolver: zodResolver(insertClassTimetableSchema),
    defaultValues: {
      program: "",
      semester: 1,
      section: "",
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "10:30",
      courseName: "",
      teacherName: "",
      room: "",
    },
  });

  const editForm = useForm<Partial<InsertClassTimetable>>({
    resolver: zodResolver(insertClassTimetableSchema.partial()),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClassTimetable) => {
      return await apiRequest('POST', '/api/timetables', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertClassTimetable>) => {
      if (!selectedEntry) throw new Error("No entry selected");
      return await apiRequest('PUT', `/api/timetables/${selectedEntry.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'] });
      setEditDialogOpen(false);
      setSelectedEntry(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/timetables/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'] });
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (entry: ClassTimetable) => {
    setSelectedEntry(entry);
    editForm.reset({
      program: entry.program,
      semester: entry.semester,
      section: entry.section ?? "",
      dayOfWeek: entry.dayOfWeek as any,
      startTime: entry.startTime,
      endTime: entry.endTime,
      courseName: entry.courseName ?? "",
      teacherName: entry.teacherName ?? "",
      room: entry.room ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (entry: ClassTimetable) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const filteredTimetables = timetables?.filter(t => {
    const matchesProgram = filterProgram === "all" || t.program === filterProgram;
    const matchesSemester = filterSemester === "all" || t.semester.toString() === filterSemester;
    return matchesProgram && matchesSemester;
  }) || [];

  const groupedByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = filteredTimetables.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, ClassTimetable[]>);

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const uniquePrograms = Array.from(new Set(timetables?.map(t => t.program) || []));
  const uniqueSemesters = Array.from(new Set(timetables?.map(t => t.semester) || []));

  const printTimetable = () => window.print();

  const renderForm = (formInstance: any, onSubmit: (data: any) => void, isPending: boolean, submitText: string) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="program" render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger></FormControl>
                <SelectContent>
                  {programs?.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={formInstance.control} name="semester" render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                <FormControl><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger></FormControl>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={formInstance.control} name="dayOfWeek" render={({ field }) => (
          <FormItem>
            <FormLabel>Day of Week</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger></FormControl>
              <SelectContent>
                {DAYS_OF_WEEK.map(day => <SelectItem key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="startTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={formInstance.control} name="endTime" render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={formInstance.control} name="courseName" render={({ field }) => (
          <FormItem>
            <FormLabel>Course/Subject</FormLabel>
            <FormControl><Input {...field} placeholder="e.g., Constitutional Law" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={formInstance.control} name="teacherName" render={({ field }) => (
          <FormItem>
            <FormLabel>Teacher</FormLabel>
            <FormControl><Input {...field} placeholder="e.g., Prof. Ahmed" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={formInstance.control} name="room" render={({ field }) => (
            <FormItem>
              <FormLabel>Room</FormLabel>
              <FormControl><Input {...field} placeholder="e.g., Room 101" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={formInstance.control} name="section" render={({ field }) => (
            <FormItem>
              <FormLabel>Section (Optional)</FormLabel>
              <FormControl><Input {...field} placeholder="e.g., A" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end gap-2">
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
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-timetable">Class Timetable</h1>
            <p className="text-muted-foreground">Weekly class schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={printTimetable} className="no-print" data-testid="button-print-timetable">
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-timetable">
              <Plus className="h-4 w-4 mr-2" />Add Entry
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
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {uniqueSemesters.map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : filteredTimetables.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Timetable Entries</h3>
          <p className="text-muted-foreground">
            {isAdmin ? "Click 'Add Entry' to create the class schedule." : "Class schedule will appear here once added."}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const classes = groupedByDay[day];
            if (classes.length === 0) return null;
            return (
              <Card key={day} className={day === currentDay ? 'border-primary border-2' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                      {day === currentDay && <Badge className="bg-green-500 text-white">Today</Badge>}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">{classes.length} Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {classes.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border hover-elevate" data-testid={`timetable-${entry.id}`}>
                        <div className="flex-shrink-0 flex items-center gap-2 text-sm text-muted-foreground min-w-32">
                          <Clock className="h-4 w-4" />
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{entry.courseName || 'N/A'}</h4>
                          <p className="text-sm text-muted-foreground">{entry.teacherName || 'TBA'}</p>
                          <p className="text-xs text-muted-foreground">{entry.program} - Sem {entry.semester}{entry.section ? ` (${entry.section})` : ''}</p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">{entry.room || 'TBA'}</Badge>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} data-testid={`button-edit-${entry.id}`}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)} data-testid={`button-delete-${entry.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Timetable Entry</DialogTitle>
            <DialogDescription>Add a new class to the timetable</DialogDescription>
          </DialogHeader>
          {renderForm(form, (data) => createMutation.mutate(data), createMutation.isPending, "Add Entry")}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>Update class information</DialogDescription>
          </DialogHeader>
          {renderForm(editForm, (data) => updateMutation.mutate(data), updateMutation.isPending, "Save Changes")}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{selectedEntry?.courseName}" on {selectedEntry?.dayOfWeek}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`@media print { .no-print { display: none !important; } @page { size: A4; margin: 15mm; } }`}</style>
    </div>
  );
}
