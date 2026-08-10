import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Printer, Eye, FileText } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { SalarySlip, InsertSalarySlip, Staff, SalaryType } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const salarySlipFormSchema = z.object({
  staffId: z.string().min(1, "Please select a staff member"),
  month: z.string().min(1, "Please select a month"),
  year: z.string().min(1, "Please enter year"),
  isVisiting: z.boolean().default(false),
  basicSalary: z.string().optional(),
  allowances: z.string().optional(),
  deductions: z.string().optional(),
  lectureCount: z.number().optional(),
  lectureRate: z.string().optional(),
  remarks: z.string().optional(),
});

type SalarySlipFormData = z.infer<typeof salarySlipFormSchema>;

export default function SalarySlips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const { data: salarySlips, isLoading } = useQuery<SalarySlip[]>({
    queryKey: ['/api/payroll/slips'],
  });

  const { data: staffList } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const { data: salaryTypes } = useQuery<SalaryType[]>({
    queryKey: ['/api/payroll/types'],
  });

  const canEdit = user?.role === 'admin';
  const canCreate = user?.role === 'admin' || user?.role === 'accountant';

  const form = useForm<SalarySlipFormData>({
    resolver: zodResolver(salarySlipFormSchema),
    defaultValues: {
      staffId: "",
      month: "",
      year: new Date().getFullYear().toString(),
      isVisiting: false,
      basicSalary: "0",
      allowances: "0",
      deductions: "0",
      lectureCount: 0,
      lectureRate: "0",
      remarks: "",
    },
  });

  const isVisiting = form.watch("isVisiting");

  const createMutation = useMutation({
    mutationFn: async (data: SalarySlipFormData) => {
      const nextNumberRes = await fetch('/api/payroll/slips/next-number', { credentials: 'include' });
      const { slipNumber } = await nextNumberRes.json();
      
      const basicSalary = parseFloat(data.basicSalary || "0");
      const allowances = parseFloat(data.allowances || "0");
      const deductions = parseFloat(data.deductions || "0");
      const lectureCount = data.lectureCount || 0;
      const lectureRate = parseFloat(data.lectureRate || "0");
      const totalLecturePay = lectureCount * lectureRate;
      
      const netSalary = data.isVisiting 
        ? totalLecturePay - deductions
        : basicSalary + allowances - deductions;

      const payload: InsertSalarySlip = {
        slipNumber,
        staffId: data.staffId,
        month: data.month,
        year: data.year,
        basicSalary: basicSalary.toString(),
        allowances: allowances.toString(),
        deductions: deductions.toString(),
        netSalary: netSalary.toString(),
        isVisiting: data.isVisiting,
        lectureCount: data.isVisiting ? lectureCount : null,
        lectureRate: data.isVisiting ? lectureRate.toString() : null,
        totalLecturePay: data.isVisiting ? totalLecturePay.toString() : null,
        remarks: data.remarks || null,
        status: 'pending',
        generatedBy: user?.id,
      };

      return await apiRequest('POST', '/api/payroll/slips', payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salary slip created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/slips'] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SalarySlipFormData) => {
      if (!selectedSlip) throw new Error("No slip selected");
      
      const basicSalary = parseFloat(data.basicSalary || "0");
      const allowances = parseFloat(data.allowances || "0");
      const deductions = parseFloat(data.deductions || "0");
      const lectureCount = data.lectureCount || 0;
      const lectureRate = parseFloat(data.lectureRate || "0");
      const totalLecturePay = lectureCount * lectureRate;
      
      const netSalary = data.isVisiting 
        ? totalLecturePay - deductions
        : basicSalary + allowances - deductions;

      const payload = {
        staffId: data.staffId,
        month: data.month,
        year: data.year,
        basicSalary: basicSalary.toString(),
        allowances: allowances.toString(),
        deductions: deductions.toString(),
        netSalary: netSalary.toString(),
        isVisiting: data.isVisiting,
        lectureCount: data.isVisiting ? lectureCount : null,
        lectureRate: data.isVisiting ? lectureRate.toString() : null,
        totalLecturePay: data.isVisiting ? totalLecturePay.toString() : null,
        remarks: data.remarks || null,
      };

      return await apiRequest('PUT', `/api/payroll/slips/${selectedSlip.id}`, payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salary slip updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/slips'] });
      setEditDialogOpen(false);
      setSelectedSlip(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/payroll/slips/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salary slip deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/slips'] });
      setDeleteDialogOpen(false);
      setSelectedSlip(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    form.reset({
      staffId: "",
      month: "",
      year: new Date().getFullYear().toString(),
      isVisiting: false,
      basicSalary: "0",
      allowances: "0",
      deductions: "0",
      lectureCount: 0,
      lectureRate: "0",
      remarks: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    form.reset({
      staffId: slip.staffId,
      month: slip.month,
      year: slip.year || new Date().getFullYear().toString(),
      isVisiting: slip.isVisiting || false,
      basicSalary: slip.basicSalary,
      allowances: slip.allowances || "0",
      deductions: slip.deductions || "0",
      lectureCount: slip.lectureCount || 0,
      lectureRate: slip.lectureRate || "0",
      remarks: slip.remarks || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setDeleteDialogOpen(true);
  };

  const handlePrint = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setPrintDialogOpen(true);
  };

  const getStaffName = (staffId: string) => {
    const staff = staffList?.find(s => s.id === staffId);
    return staff?.fullName || "Unknown";
  };

  const getStaffDesignation = (staffId: string) => {
    const staff = staffList?.find(s => s.id === staffId);
    return staff?.designation || "";
  };

  const getStaffDepartment = (staffId: string) => {
    const staff = staffList?.find(s => s.id === staffId);
    return staff?.department || "";
  };

  const onSubmit = (data: SalarySlipFormData) => {
    if (editDialogOpen) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const printSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-salary-slips">Salary Slips</h1>
          <p className="text-muted-foreground">Generate and manage salary slips for staff</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} data-testid="button-generate-slip">
            <Plus className="h-4 w-4 mr-2" />
            Generate Salary Slip
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Salary Slips</CardTitle>
          <CardDescription>View and manage salary slips</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : !salarySlips || salarySlips.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No salary slips generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Generate Salary Slip" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slip No.</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salarySlips.map((slip) => (
                    <TableRow key={slip.id} data-testid={`row-slip-${slip.id}`}>
                      <TableCell className="font-mono" data-testid={`text-slipno-${slip.id}`}>
                        {slip.slipNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getStaffName(slip.staffId)}
                      </TableCell>
                      <TableCell>{slip.month} {slip.year}</TableCell>
                      <TableCell>
                        <Badge variant={slip.isVisiting ? 'secondary' : 'default'}>
                          {slip.isVisiting ? 'Visiting' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        Rs {parseFloat(slip.netSalary).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={slip.status === 'paid' ? 'default' : slip.status === 'approved' ? 'secondary' : 'outline'}
                        >
                          {slip.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print"
                            onClick={() => handlePrint(slip)}
                            data-testid={`button-print-${slip.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                onClick={() => handleEdit(slip)}
                                data-testid={`button-edit-${slip.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                onClick={() => handleDelete(slip)}
                                data-testid={`button-delete-${slip.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedSlip(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? "Edit Salary Slip" : "Generate Salary Slip"}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? "Update salary slip details" : "Create a new salary slip for a staff member"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-staff">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffList?.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.fullName} - {staff.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-month">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" data-testid="input-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isVisiting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Visiting Staff</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable for per-lecture payment calculation
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-visiting"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isVisiting ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Lecture Rate Calculation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lectureCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Lectures</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-lecture-count" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lectureRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate per Lecture (Rs)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} data-testid="input-lecture-rate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Lecture Pay: Rs {((form.watch("lectureCount") || 0) * parseFloat(form.watch("lectureRate") || "0")).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="basicSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basic Salary (Rs)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-basic-salary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowances (Rs)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-allowances" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions (Rs)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-deductions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-remarks" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditDialogOpen(false);
                    setSelectedSlip(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editDialogOpen ? "Update Slip" : "Generate Slip"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the salary slip "{selectedSlip?.slipNumber}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSlip && deleteMutation.mutate(selectedSlip.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog - Dual Copy */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Salary Slip Preview</DialogTitle>
            <DialogDescription>Print dual copies - College Record & Teacher Copy</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 print:hidden mb-4">
            <Button onClick={printSlip} data-testid="button-print-slip">
              <Printer className="h-4 w-4 mr-2" />
              Print Dual Copy
            </Button>
          </div>

          {selectedSlip && (
            <div className="print-salary-slip space-y-8">
              {/* College Copy */}
              <SalarySlipCopy
                slip={selectedSlip}
                staffName={getStaffName(selectedSlip.staffId)}
                designation={getStaffDesignation(selectedSlip.staffId)}
                department={getStaffDepartment(selectedSlip.staffId)}
                copyType="COLLEGE RECORD COPY"
              />

              {/* Separator for print */}
              <div className="border-t-2 border-dashed border-gray-400 my-4 print:my-8">
                <p className="text-center text-xs text-gray-400 py-2 print:hidden">--- Cut Here ---</p>
              </div>

              {/* Teacher Copy */}
              <SalarySlipCopy
                slip={selectedSlip}
                staffName={getStaffName(selectedSlip.staffId)}
                designation={getStaffDesignation(selectedSlip.staffId)}
                department={getStaffDepartment(selectedSlip.staffId)}
                copyType="TEACHER COPY"
              />
            </div>
          )}

          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body * {
                visibility: hidden;
              }
              .print-salary-slip, .print-salary-slip * {
                visibility: visible;
              }
              .print-salary-slip {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .salary-slip-copy {
                page-break-inside: avoid;
                margin-bottom: 20px;
              }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SalarySlipCopyProps {
  slip: SalarySlip;
  staffName: string;
  designation: string;
  department: string;
  copyType: string;
}

function SalarySlipCopy({ slip, staffName, designation, department, copyType }: SalarySlipCopyProps) {
  const basicSalary = parseFloat(slip.basicSalary);
  const allowances = parseFloat(slip.allowances || "0");
  const deductions = parseFloat(slip.deductions || "0");
  const netSalary = parseFloat(slip.netSalary);
  const lectureCount = slip.lectureCount || 0;
  const lectureRate = parseFloat(slip.lectureRate || "0");
  const totalLecturePay = parseFloat(slip.totalLecturePay || "0");

  return (
    <div className="salary-slip-copy border-2 border-gray-800 p-6 bg-white">
      {/* Header */}
      <div className="text-center border-b-4 border-double border-[#1e3a5f] pb-4 mb-4">
        <h1 className="text-xl font-bold text-[#1e3a5f]">ABBOTT LAW COLLEGE</h1>
        <p className="text-gray-600 text-sm">Mansehra, Khyber Pakhtunkhwa</p>
        <p className="text-gray-500 text-xs">Affiliated with Hazara University</p>
        <div className="mt-2 inline-block bg-gray-100 px-4 py-1 rounded border">
          <span className="font-semibold text-sm">{copyType}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center bg-slate-100 py-2 mb-4 border">
        <h2 className="font-bold text-lg">SALARY SLIP</h2>
        <p className="text-sm text-gray-600">{slip.month} {slip.year}</p>
      </div>

      {/* Slip Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p><span className="font-semibold">Slip No:</span> {slip.slipNumber}</p>
          <p><span className="font-semibold">Staff Name:</span> {staffName}</p>
          <p><span className="font-semibold">Designation:</span> {designation}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Department:</span> {department}</p>
          <p><span className="font-semibold">Staff Type:</span> {slip.isVisiting ? 'Visiting' : 'Regular'}</p>
          <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Salary Breakdown */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
            <th className="border border-gray-300 px-3 py-2 text-right w-32">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {slip.isVisiting ? (
            <>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Number of Lectures</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{lectureCount}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Rate per Lecture</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{lectureRate.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">Total Lecture Pay</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono font-semibold">{totalLecturePay.toLocaleString()}</td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Basic Salary</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{basicSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Allowances</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{allowances.toLocaleString()}</td>
              </tr>
            </>
          )}
          <tr className="bg-red-50">
            <td className="border border-gray-300 px-3 py-2 text-red-700">Deductions</td>
            <td className="border border-gray-300 px-3 py-2 text-right font-mono text-red-700">-{deductions.toLocaleString()}</td>
          </tr>
          <tr className="bg-green-50 font-bold">
            <td className="border border-gray-300 px-3 py-2 text-green-700">NET SALARY PAYABLE</td>
            <td className="border border-gray-300 px-3 py-2 text-right font-mono text-green-700 text-lg">{netSalary.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {slip.remarks && (
        <div className="mb-4 text-sm">
          <p><span className="font-semibold">Remarks:</span> {slip.remarks}</p>
        </div>
      )}

      {/* Signature Area */}
      <div className="flex justify-between mt-8 pt-4 border-t">
        <div className="text-center min-w-[150px]">
          <div className="border-t border-gray-800 mt-12 pt-2 text-sm">
            Prepared By
          </div>
        </div>
        <div className="text-center min-w-[150px]">
          <div className="border-t border-gray-800 mt-12 pt-2 text-sm">
            Authorized Signatory
          </div>
        </div>
        <div className="text-center min-w-[150px]">
          <div className="border-t border-gray-800 mt-12 pt-2 text-sm">
            Teacher/Staff Signature
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-4 pt-2 border-t">
        This is a computer-generated salary slip. Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}
