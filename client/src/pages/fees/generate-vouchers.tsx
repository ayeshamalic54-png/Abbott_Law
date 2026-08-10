import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, User, ArrowLeft, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import type { Program, FeeStructure, Student } from "@shared/schema";

const bulkVoucherSchema = z.object({
  program: z.string().min(1, "Program is required"),
  semester: z.number().min(1).max(10),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  month: z.string().optional(),
  semesterPeriod: z.string().optional(),
  year: z.number().min(2025),
  dueDate: z.string().min(1, "Due date is required"),
});

const individualVoucherSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  month: z.string().optional(),
  semesterPeriod: z.string().optional(),
  year: z.number().min(2025),
  dueDate: z.string().min(1, "Due date is required"),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  discountReason: z.string().optional(),
});

type GeneratedVoucher = {
  id: string;
  voucherNumber: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  program?: string;
  semester?: number;
  amount: string;
  netAmount?: string;
  month: string;
  dueDate: string;
  status: string;
  discountType?: string;
  discountValue?: string;
  discountAmount?: string;
};

export default function GenerateVouchers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'bulk' | 'individual'>('bulk');
  const [generatedVouchers, setGeneratedVouchers] = useState<GeneratedVoucher[]>([]);

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: feeStructures } = useQuery<FeeStructure[]>({
    queryKey: ['/api/fees/structures'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const bulkForm = useForm({
    resolver: zodResolver(bulkVoucherSchema),
    defaultValues: {
      program: "",
      semester: 1,
      feeStructureId: "",
      month: new Date().toLocaleString('default', { month: 'long' }),
      semesterPeriod: "Fall",
      year: new Date().getFullYear(),
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const individualForm = useForm({
    resolver: zodResolver(individualVoucherSchema),
    defaultValues: {
      studentId: "",
      feeStructureId: "",
      month: new Date().toLocaleString('default', { month: 'long' }),
      semesterPeriod: "Fall",
      year: new Date().getFullYear(),
      dueDate: new Date().toISOString().split('T')[0],
      discountType: undefined as 'percentage' | 'fixed' | undefined,
      discountValue: 0,
      discountReason: "",
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/fees/vouchers/bulk", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success",
        description: `Generated ${response.count} vouchers successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/vouchers"] });
      if (response.vouchers && response.vouchers.length > 0) {
        setGeneratedVouchers(response.vouchers);
      }
      bulkForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate vouchers",
        variant: "destructive",
      });
    },
  });

  const individualMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/fees/vouchers/individual", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success",
        description: "Voucher generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/vouchers"] });
      if (response.voucher) {
        setGeneratedVouchers([response.voucher]);
      }
      individualForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate voucher",
        variant: "destructive",
      });
    },
  });

  const printVoucher = (voucher: GeneratedVoucher) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const student = students?.find(s => s.id === voucher.studentId);
    const netAmount = voucher.netAmount || voucher.amount;
    
    // Determine college branding based on program
    const programName = student?.program || voucher.program || '';
    const isLLB = programName.toLowerCase().includes('llb') || programName.toLowerCase().includes('law');
    const collegeName = isLLB ? 'ABBOTT LAW COLLEGE' : 'ABBOTT GROUP OF COLLEGES';
    const collegeSubtitle = isLLB ? 'Affiliated with Hazara University' : 'Excellence in Education';
    const themeColor = isLLB ? '#1e3a5f' : '#047857';

    const voucherHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Voucher - ${voucher.voucherNumber}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          @media print {
            html, body { 
              margin: 0; 
              padding: 0;
              width: 100%;
            }
            .no-print { display: none !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; padding: 10px; }
          .page-container {
            display: flex;
            gap: 15px;
            width: 100%;
            page-break-inside: avoid;
          }
          .voucher-copy { 
            flex: 1;
            border: 2px solid ${themeColor}; 
            padding: 10px; 
            border-radius: 4px;
            page-break-inside: avoid;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid ${themeColor}; 
            padding-bottom: 6px; 
            margin-bottom: 8px; 
          }
          .header h1 { font-size: 12px; color: ${themeColor}; margin-bottom: 2px; }
          .header h2 { font-size: 8px; color: #666; }
          .copy-type {
            display: inline-block;
            background: ${themeColor};
            color: white;
            padding: 2px 10px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            margin-top: 4px;
          }
          .voucher-number { text-align: right; font-weight: bold; margin-bottom: 8px; font-size: 9px; }
          .details { margin-bottom: 8px; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 3px 5px; border: 1px solid #ddd; font-size: 8px; }
          .details td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }
          .amount-section { background: #f0f7ff; padding: 8px; border-radius: 4px; border: 1px solid ${themeColor}; }
          .amount-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 8px; }
          .total-row { font-size: 10px; font-weight: bold; border-top: 1px solid ${themeColor}; padding-top: 5px; margin-top: 5px; color: ${themeColor}; }
          .footer { margin-top: 8px; text-align: center; font-size: 7px; color: #666; }
          .signatures { display: flex; justify-content: space-between; margin-top: 15px; }
          .signature-box { text-align: center; width: 30%; }
          .signature-line { border-top: 1px solid #333; padding-top: 3px; font-size: 7px; }
          .print-btn {
            display: block;
            margin: 10px auto;
            padding: 10px 30px;
            background: ${themeColor};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fffbeb; border: 1px solid #f59e0b; padding: 8px 12px; margin: 8px; border-radius: 4px; font-size: 14px; color: #92400e; text-align: center;">
          <strong>IMPORTANT:</strong> In the print dialog, please select <strong>LANDSCAPE</strong> orientation for both copies to fit on one page.
        </div>
        <button class="print-btn no-print" onclick="window.print();">Print Voucher</button>
        
        <div class="page-container">
            <!-- COLLEGE COPY -->
            <div class="voucher-copy">
              <div class="header">
                <h1>${collegeName}</h1>
                <h2>${collegeSubtitle}</h2>
                <p style="margin-top: 5px; font-weight: bold; font-size: 10px;">FEE VOUCHER</p>
                <div class="copy-type">COLLEGE COPY</div>
              </div>
              
              <div class="voucher-number">Voucher #: ${voucher.voucherNumber}</div>
              
              <div class="details">
                <table>
                  <tr><td>Student Name</td><td>${student?.fullName || '-'}</td></tr>
                  <tr><td>Father's Name</td><td>${student?.fatherName || '-'}</td></tr>
                  <tr><td>Roll Number</td><td>${student?.rollNumber || '-'}</td></tr>
                  <tr><td>Program</td><td>${programName || '-'}</td></tr>
                  <tr><td>Semester</td><td>${student?.semester || voucher.semester || '-'}</td></tr>
                  <tr><td>Month</td><td>${voucher.month}</td></tr>
                  <tr><td>Due Date</td><td>${new Date(voucher.dueDate).toLocaleDateString()}</td></tr>
                </table>
              </div>

              <div class="amount-section">
                <div class="amount-row">
                  <span>Gross Amount:</span>
                  <span>Rs ${parseFloat(voucher.amount).toLocaleString()}</span>
                </div>
                ${voucher.discountAmount && parseFloat(voucher.discountAmount) > 0 ? `
                <div class="amount-row" style="color: green;">
                  <span>Discount:</span>
                  <span>- Rs ${parseFloat(voucher.discountAmount).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="amount-row total-row">
                  <span>Net Amount:</span>
                  <span>Rs ${parseFloat(netAmount).toLocaleString()}</span>
                </div>
              </div>

              <div class="signatures">
                <div class="signature-box"><div class="signature-line">Student</div></div>
                <div class="signature-box"><div class="signature-line">Accountant</div></div>
              </div>

              <div class="footer">
                <p>Please pay before the due date to avoid late fee charges.</p>
              </div>
            </div>
            
            <!-- STUDENT COPY -->
            <div class="voucher-copy">
              <div class="header">
                <h1>${collegeName}</h1>
                <h2>${collegeSubtitle}</h2>
                <p style="margin-top: 5px; font-weight: bold; font-size: 10px;">FEE VOUCHER</p>
                <div class="copy-type">STUDENT COPY</div>
              </div>
              
              <div class="voucher-number">Voucher #: ${voucher.voucherNumber}</div>
              
              <div class="details">
                <table>
                  <tr><td>Student Name</td><td>${student?.fullName || '-'}</td></tr>
                  <tr><td>Father's Name</td><td>${student?.fatherName || '-'}</td></tr>
                  <tr><td>Roll Number</td><td>${student?.rollNumber || '-'}</td></tr>
                  <tr><td>Program</td><td>${programName || '-'}</td></tr>
                  <tr><td>Semester</td><td>${student?.semester || voucher.semester || '-'}</td></tr>
                  <tr><td>Month</td><td>${voucher.month}</td></tr>
                  <tr><td>Due Date</td><td>${new Date(voucher.dueDate).toLocaleDateString()}</td></tr>
                </table>
              </div>

              <div class="amount-section">
                <div class="amount-row">
                  <span>Gross Amount:</span>
                  <span>Rs ${parseFloat(voucher.amount).toLocaleString()}</span>
                </div>
                ${voucher.discountAmount && parseFloat(voucher.discountAmount) > 0 ? `
                <div class="amount-row" style="color: green;">
                  <span>Discount:</span>
                  <span>- Rs ${parseFloat(voucher.discountAmount).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="amount-row total-row">
                  <span>Net Amount:</span>
                  <span>Rs ${parseFloat(netAmount).toLocaleString()}</span>
                </div>
              </div>

              <div class="signatures">
                <div class="signature-box"><div class="signature-line">Student</div></div>
                <div class="signature-box"><div class="signature-line">Accountant</div></div>
              </div>

              <div class="footer">
                <p>Please pay before the due date to avoid late fee charges.</p>
              </div>
            </div>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(voucherHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const printAllVouchers = () => {
    generatedVouchers.forEach((voucher, index) => {
      setTimeout(() => printVoucher(voucher), index * 1500);
    });
  };

  const filteredFeeStructures = feeStructures?.filter(fs => {
    if (selectedTab === 'bulk') {
      const selectedProgram = bulkForm.watch('program');
      // Match by program only, or show structures without specific program (general fees)
      return fs.program === selectedProgram || !fs.program;
    } else {
      const selectedStudent = students?.find(s => s.id === individualForm.watch('studentId'));
      if (!selectedStudent) return false;
      // Match by student's program, or show structures without specific program (general fees)
      return fs.program === selectedStudent.program || !fs.program;
    }
  }) || [];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const semesterPeriods = [
    "Fall", // September - December
    "Spring", // January - May
  ];

  // Check if selected program is a Group program (B.Ed, DM)
  const isGroupProgram = (programName: string) => {
    return programName.toLowerCase().includes('b.ed') || 
           programName.toLowerCase().includes('dm') ||
           programName.toLowerCase().includes('bachelor of education') ||
           programName.toLowerCase().includes('diploma');
  };

  const selectedBulkProgram = bulkForm.watch('program');
  const isGroupProgramBulk = selectedBulkProgram ? isGroupProgram(selectedBulkProgram) : false;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/fees/vouchers')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-generate-vouchers">
            <FileText className="h-8 w-8 text-primary" />
            Generate Fee Vouchers
          </h1>
          <p className="text-muted-foreground mt-1">Create tuition fee vouchers for students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voucher Generation</CardTitle>
          <CardDescription>Generate monthly fee vouchers for entire class or individual students</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'bulk' | 'individual')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="bulk" data-testid="tab-bulk">
                <Users className="h-4 w-4 mr-2" />
                Bulk (Entire Class)
              </TabsTrigger>
              <TabsTrigger value="individual" data-testid="tab-individual">
                <User className="h-4 w-4 mr-2" />
                Individual Student
              </TabsTrigger>
            </TabsList>

            {/* Bulk Generation Tab */}
            <TabsContent value="bulk" className="mt-6">
              <Form {...bulkForm}>
                <form onSubmit={bulkForm.handleSubmit((data) => bulkMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={bulkForm.control}
                      name="program"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-program">
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {programs?.filter(p => p.isActive).map((program) => (
                                <SelectItem key={program.id} value={program.name}>
                                  {program.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bulkForm.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester *</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-semester">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
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
                      control={bulkForm.control}
                      name="feeStructureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Structure *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-fee-structure">
                                <SelectValue placeholder="Select fee structure" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredFeeStructures.map((structure) => (
                                <SelectItem key={structure.id} value={structure.id}>
                                  {structure.name} - Rs {parseFloat(structure.amount).toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select program and semester first to see matching fee structures
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!isGroupProgramBulk ? (
                      <FormField
                        control={bulkForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Month *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-month">
                                  <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month} value={month}>
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For LLB monthly fee collection
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={bulkForm.control}
                        name="semesterPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester Period *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-semester-period">
                                  <SelectValue placeholder="Select semester period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {semesterPeriods.map((period) => (
                                  <SelectItem key={period} value={period}>
                                    {period} Semester
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For Group programs (6-month semester fee)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={bulkForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2025" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-year"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bulkForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              data-testid="input-due-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={bulkMutation.isPending}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
                      data-testid="button-submit-bulk"
                    >
                      {bulkMutation.isPending ? "Generating..." : "Generate Vouchers for Class"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => bulkForm.reset()}
                      data-testid="button-reset"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Individual Generation Tab */}
            <TabsContent value="individual" className="mt-6">
              <Form {...individualForm}>
                <form onSubmit={individualForm.handleSubmit((data) => individualMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={individualForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-student">
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students?.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.rollNumber} - {student.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={individualForm.control}
                      name="feeStructureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Structure *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-fee-structure-individual">
                                <SelectValue placeholder="Select fee structure" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredFeeStructures.map((structure) => (
                                <SelectItem key={structure.id} value={structure.id}>
                                  {structure.name} - Rs {parseFloat(structure.amount).toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select student first to see matching fee structures
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(() => {
                      const selectedStudent = students?.find(s => s.id === individualForm.watch('studentId'));
                      const isGroupStudent = selectedStudent ? isGroupProgram(selectedStudent.program || '') : false;
                      
                      return !isGroupStudent ? (
                        <FormField
                          control={individualForm.control}
                          name="month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Month *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-month-individual">
                                    <SelectValue placeholder="Select month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {months.map((month) => (
                                    <SelectItem key={month} value={month}>
                                      {month}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                For LLB monthly fee collection
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={individualForm.control}
                          name="semesterPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semester Period *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-semester-period-individual">
                                    <SelectValue placeholder="Select semester period" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {semesterPeriods.map((period) => (
                                    <SelectItem key={period} value={period}>
                                      {period} Semester
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                For Group programs (6-month semester fee)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })()}

                    <FormField
                      control={individualForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2025" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-year-individual"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={individualForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              data-testid="input-due-date-individual"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">Discount (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={individualForm.control}
                        name="discountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-discount-type">
                                  <SelectValue placeholder="No discount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount (Rs)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={individualForm.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Discount Value {individualForm.watch('discountType') === 'percentage' ? '(%)' : '(Rs)'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={individualForm.watch('discountType') === 'percentage' ? "e.g., 10" : "e.g., 5000"}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-discount-value"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={individualForm.control}
                        name="discountReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Reason</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Merit scholarship"
                                {...field}
                                data-testid="input-discount-reason"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={individualMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg"
                      data-testid="button-submit-individual"
                    >
                      {individualMutation.isPending ? "Generating..." : "Generate Voucher"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => individualForm.reset()}
                      data-testid="button-reset-individual"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generated Vouchers Section */}
      {generatedVouchers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-600">Generated Vouchers</CardTitle>
                <CardDescription>{generatedVouchers.length} voucher(s) generated successfully</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={printAllVouchers}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                  data-testid="button-print-all-vouchers"
                >
                  Print All Vouchers
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setGeneratedVouchers([])}
                  data-testid="button-clear-vouchers"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-3 text-left">Voucher #</th>
                    <th className="border p-3 text-left">Student</th>
                    <th className="border p-3 text-left">Roll Number</th>
                    <th className="border p-3 text-left">Month</th>
                    <th className="border p-3 text-right">Amount</th>
                    <th className="border p-3 text-right">Discount</th>
                    <th className="border p-3 text-right">Net Amount</th>
                    <th className="border p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedVouchers.map((voucher) => {
                    const student = students?.find(s => s.id === voucher.studentId);
                    const netAmount = voucher.netAmount || voucher.amount;
                    const discountAmt = voucher.discountAmount ? parseFloat(voucher.discountAmount) : 0;
                    return (
                      <tr key={voucher.id} className="hover:bg-muted/50">
                        <td className="border p-3 font-mono">{voucher.voucherNumber}</td>
                        <td className="border p-3">{student?.fullName || '-'}</td>
                        <td className="border p-3">{student?.rollNumber || '-'}</td>
                        <td className="border p-3">{voucher.month}</td>
                        <td className="border p-3 text-right">Rs {parseFloat(voucher.amount).toLocaleString()}</td>
                        <td className="border p-3 text-right text-green-600">
                          {discountAmt > 0 ? `- Rs ${discountAmt.toLocaleString()}` : '-'}
                        </td>
                        <td className="border p-3 text-right font-semibold">Rs {parseFloat(netAmount).toLocaleString()}</td>
                        <td className="border p-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => printVoucher(voucher)}
                            data-testid={`button-print-voucher-${voucher.id}`}
                          >
                            Print
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
