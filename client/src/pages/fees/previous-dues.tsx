import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, History, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, StudentPreviousDues } from "@shared/schema";

export default function PreviousDues() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueType, setDueType] = useState<string>("carry_forward");
  const [description, setDescription] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: previousDues, isLoading: duesLoading } = useQuery<StudentPreviousDues[]>({
    queryKey: ['/api/fees/previous-dues'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const addDueMutation = useMutation({
    mutationFn: async (data: { studentId: string; amount: number; dueType: string; description: string }) => {
      const res = await fetch('/api/fees/previous-dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add previous dues');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fees/previous-dues'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Previous dues added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add previous dues", variant: "destructive" });
    },
  });

  const deleteDueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fees/previous-dues/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fees/previous-dues'] });
      toast({ title: "Success", description: "Previous dues deleted" });
    },
  });

  const resolveDueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fees/previous-dues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true, resolvedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to resolve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fees/previous-dues'] });
      toast({ title: "Success", description: "Dues marked as resolved" });
    },
  });

  const resetForm = () => {
    setSelectedStudent("");
    setAmount("");
    setDueType("carry_forward");
    setDescription("");
  };

  const handleAddDue = () => {
    if (!selectedStudent || !amount) {
      toast({ title: "Error", description: "Please select student and enter amount", variant: "destructive" });
      return;
    }
    addDueMutation.mutate({
      studentId: selectedStudent,
      amount: parseFloat(amount),
      dueType,
      description,
    });
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student ? `${student.fullName} (${student.rollNumber})` : studentId;
  };

  const getDueTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      carry_forward: "Carry Forward",
      adjustment: "Adjustment",
      write_off: "Write Off",
      previous_institute: "Previous Institute",
    };
    return types[type] || type;
  };

  const filteredDues = previousDues?.filter(due => {
    if (!searchTerm) return true;
    const student = students?.find(s => s.id === due.studentId);
    return student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalDues = filteredDues?.filter(d => !d.isResolved).reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

  if (duesLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Previous Dues Management</h1>
          <p className="text-muted-foreground">Track and manage student previous dues</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-dues">
              <Plus className="h-4 w-4 mr-2" />
              Add Previous Dues
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Previous Dues</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.rollNumber} - {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (Rs)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  data-testid="input-amount"
                />
              </div>
              <div>
                <Label>Due Type</Label>
                <Select value={dueType} onValueChange={setDueType}>
                  <SelectTrigger data-testid="select-due-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carry_forward">Carry Forward</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="previous_institute">Previous Institute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description or remarks"
                  data-testid="input-description"
                />
              </div>
              <Button onClick={handleAddDue} className="w-full" disabled={addDueMutation.isPending} data-testid="button-submit-dues">
                {addDueMutation.isPending ? "Adding..." : "Add Dues"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-total-outstanding">
              Rs {totalDues.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-entries">
              {filteredDues?.filter(d => !d.isResolved).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-resolved">
              {filteredDues?.filter(d => d.isResolved).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Previous Dues Records
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDues?.map(due => (
                <TableRow key={due.id} data-testid={`row-due-${due.id}`}>
                  <TableCell className="font-medium">{getStudentName(due.studentId)}</TableCell>
                  <TableCell className="font-bold text-red-600">Rs {parseFloat(due.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDueTypeLabel(due.dueType || 'carry_forward')}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{due.description || '-'}</TableCell>
                  <TableCell>
                    {due.isResolved ? (
                      <Badge variant="default" className="bg-green-500">Resolved</Badge>
                    ) : (
                      <Badge variant="destructive">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>{due.recordedAt ? new Date(due.recordedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!due.isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveDueMutation.mutate(due.id)}
                          data-testid={`button-resolve-${due.id}`}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDueMutation.mutate(due.id)}
                        data-testid={`button-delete-${due.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredDues || filteredDues.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No previous dues records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
