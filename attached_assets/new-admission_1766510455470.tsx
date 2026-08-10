import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStudentSchema, type Program } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, Upload, X, Printer } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export default function NewAdmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [receiptNumberMode, setReceiptNumberMode] = useState<'automatic' | 'manual'>('automatic');
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [admittedStudent, setAdmittedStudent] = useState<any>(null);
  
  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
    staleTime: 0,
    refetchOnMount: true,
  });

  const form = useForm({
    resolver: zodResolver(insertStudentSchema.extend({
      rollNumber: insertStudentSchema.shape.rollNumber,
      fullName: insertStudentSchema.shape.fullName,
    })),
    defaultValues: {
      rollNumber: "",
      fullName: "",
      fatherName: "",
      dateOfBirth: "",
      gender: "male",
      phone: "",
      email: "",
      address: "",
      photoUrl: "",
      program: "",
      semester: 1,
      section: "",
      status: "active",
      // Fee collection fields
      admissionFee: "",
      prospectusFee: "",
      admissionFeePayingNow: "",
      prospectusFeePayingNow: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: "",
      // Discount fields
      discountType: "",
      discountValue: "",
      discountReason: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Photo size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        form.setValue('photoUrl', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue('photoUrl', '');
  };

  const generateAdmissionReceipt = (copyType: 'COLLEGE' | 'STUDENT') => {
    if (!admittedStudent || !feePayments.length) return;

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const totalAmount = feePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const today = new Date().toLocaleDateString('en-PK');

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Receipt - ${copyType} Copy</title>
        <style>
          @media print {
            @page { size: A4; margin: 15mm; }
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            max-width: 210mm;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .college-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .college-address {
            font-size: 12px;
            color: #666;
          }
          .copy-type {
            font-size: 18px;
            font-weight: bold;
            background: ${copyType === 'COLLEGE' ? '#3b82f6' : '#16a34a'};
            color: white;
            padding: 8px 20px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            text-decoration: underline;
          }
          .receipt-body {
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: bold;
            width: 40%;
          }
          .info-value {
            width: 60%;
            text-align: right;
          }
          .fee-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .fee-table th, .fee-table td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }
          .fee-table th {
            background: #f3f4f6;
          }
          .amount-section {
            background: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 2px solid #000;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            font-weight: bold;
          }
          .receipt-footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            padding-top: 20px;
            border-top: 2px solid #000;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            width: 150px;
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
          }
          .print-btn {
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px auto;
            display: block;
          }
          .print-btn:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
        
        <div class="receipt-header">
          <div class="college-name">Abbott Law College / Abbott Group of Colleges</div>
          <div class="college-address">Mansehra, Pakistan</div>
          <div class="copy-type">${copyType} COPY</div>
        </div>

        <div class="receipt-title">ADMISSION FEE RECEIPT</div>

        <div class="receipt-body">
          <div class="info-row">
            <span class="info-label">Receipt Date:</span>
            <span class="info-value">${today}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${admittedStudent.fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Father's Name:</span>
            <span class="info-value">${admittedStudent.fatherName || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${admittedStudent.rollNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Program:</span>
            <span class="info-value">${admittedStudent.program}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Semester:</span>
            <span class="info-value">${admittedStudent.semester}</span>
          </div>
        </div>

        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th>Amount (Rs)</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${feePayments.map((p: any) => `
              <tr>
                <td>${p.type}</td>
                <td>${parseFloat(p.amount).toLocaleString()}</td>
                <td>${p.receipt?.paymentMethod || 'Cash'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="amount-section">
          <div class="amount-row">
            <span>Total Amount Paid:</span>
            <span>Rs ${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div class="receipt-footer">
          <div class="signature-box">
            <div class="signature-line">Student Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Accountant</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Principal</div>
          </div>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();

    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  const printBothReceipts = () => {
    generateAdmissionReceipt('COLLEGE');
    setTimeout(() => {
      generateAdmissionReceipt('STUDENT');
    }, 1000);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/students", data);
    },
    onSuccess: async (response: any) => {
      setGeneratedCredentials(response.credentials);
      setFeePayments(response.feePayments || []);
      setAdmittedStudent(response.student);
      setShowCredentialsDialog(true);
      
      // Save admission receipt to database if fees were paid
      if (response.feePayments && response.feePayments.length > 0 && response.student) {
        try {
          for (const payment of response.feePayments) {
            await apiRequest("POST", "/api/receipts", {
              receiptType: 'admission',
              studentId: response.student.id,
              studentName: `${response.student.firstName} ${response.student.lastName}`,
              studentRollNumber: response.student.rollNumber,
              fatherName: response.student.fatherName,
              program: response.student.program,
              semester: 1,
              grossAmount: payment.feeAmount,
              discountType: payment.discountType || 'none',
              discountValue: payment.discountValue || '0',
              discountAmount: payment.discountAmount || '0',
              discountReason: payment.discountReason || '',
              netAmount: payment.amountPaid,
              paymentMethod: payment.receipt?.paymentMethod || 'cash',
              paymentDate: new Date().toISOString().split('T')[0],
            });
          }
        } catch (err) {
          console.error('Failed to save admission receipt:', err);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      form.reset();
      setPhotoPreview(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create admission",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-new-admission">
            <UserPlus className="h-8 w-8 text-primary" />
            New Student Admission
          </h1>
          <p className="text-muted-foreground mt-1">Register a new student</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Enter the details of the new student</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo on Left, Form Fields on Right - Traditional Paper Format */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo Section - Left Side */}
                <div className="flex-shrink-0">
                  <Label className="mb-2 block text-sm font-semibold">Student Photo *</Label>
                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center w-40 h-48 border-2 border-dashed rounded-md cursor-pointer bg-muted/30 hover-elevate">
                      <div className="flex flex-col items-center justify-center p-3">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-xs text-center text-muted-foreground">
                          <span className="font-semibold">Upload Photo</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Passport Size</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        data-testid="input-photo"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Student"
                        className="w-40 h-48 object-cover rounded-md border-2"
                        data-testid="img-photo-preview"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-background border-2 rounded-full hover-elevate"
                        data-testid="button-remove-photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Form Fields - Right Side */}
                <div className="flex-1 space-y-5">
                  <FormField
                    control={form.control}
                    name="rollNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2025-LLB-001" {...field} data-testid="input-roll-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Student's full name" {...field} data-testid="input-full-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Father's name" {...field} data-testid="input-father-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-dob" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="03XX-XXXXXXX" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="student@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="program"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={programsLoading}>
                            <FormControl>
                              <SelectTrigger data-testid="select-program">
                                <SelectValue placeholder={programsLoading ? "Loading programs..." : "Select program"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {programs?.map((program) => (
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
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-semester" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A, B" {...field} data-testid="input-section" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Complete address" {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Fee Collection Section */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Fee Collection</CardTitle>
                  <CardDescription>Collect admission and prospectus fees at the time of admission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Type Selection */}
                  <div className="space-y-3 pb-4 border-b">
                    <Label className="text-sm font-semibold">Payment Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="full"
                          checked={paymentType === 'full'}
                          onChange={() => {
                            setPaymentType('full');
                            form.setValue('admissionFeePayingNow', '');
                            form.setValue('prospectusFeePayingNow', '');
                          }}
                          className="w-4 h-4"
                          data-testid="radio-full-payment"
                        />
                        <span className="text-sm font-medium">Full Payment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="partial"
                          checked={paymentType === 'partial'}
                          onChange={() => setPaymentType('partial')}
                          className="w-4 h-4"
                          data-testid="radio-partial-payment"
                        />
                        <span className="text-sm font-medium">Partial Payment</span>
                      </label>
                    </div>
                    {paymentType === 'partial' && (
                      <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        💡 You can pay half or any partial amount now, remaining balance can be paid later.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="admissionFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Fee Total (Rs) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5000" 
                              {...field}
                              data-testid="input-admission-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prospectusFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prospectus Fee Total (Rs) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              {...field}
                              data-testid="input-prospectus-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Partial Payment Fields */}
                    {paymentType === 'partial' && (
                      <>
                        <FormField
                          control={form.control}
                          name="admissionFeePayingNow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admission Fee - Paying Now (Rs) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="2500" 
                                  {...field}
                                  data-testid="input-admission-fee-paying"
                                />
                              </FormControl>
                              <FormMessage />
                              {field.value && form.watch("admissionFee") && (
                                <p className="text-xs text-muted-foreground">
                                  Remaining: Rs {(parseFloat(form.watch("admissionFee") || "0") - parseFloat(field.value || "0")).toLocaleString()}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="prospectusFeePayingNow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prospectus Fee - Paying Now (Rs) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="500" 
                                  {...field}
                                  data-testid="input-prospectus-fee-paying"
                                />
                              </FormControl>
                              <FormMessage />
                              {field.value && form.watch("prospectusFee") && (
                                <p className="text-xs text-muted-foreground">
                                  Remaining: Rs {(parseFloat(form.watch("prospectusFee") || "0") - parseFloat(field.value || "0")).toLocaleString()}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="online">Online Payment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              data-testid="input-payment-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Receipt Number</Label>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="receiptMode"
                            value="automatic"
                            checked={receiptNumberMode === 'automatic'}
                            onChange={() => {
                              setReceiptNumberMode('automatic');
                              form.setValue('receiptNumber', '');
                            }}
                            className="w-4 h-4"
                            data-testid="radio-automatic-receipt"
                          />
                          <span className="text-sm">Automatic</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="receiptMode"
                            value="manual"
                            checked={receiptNumberMode === 'manual'}
                            onChange={() => setReceiptNumberMode('manual')}
                            className="w-4 h-4"
                            data-testid="radio-manual-receipt"
                          />
                          <span className="text-sm">Manual</span>
                        </label>
                      </div>
                      {receiptNumberMode === 'manual' && (
                        <FormField
                          control={form.control}
                          name="receiptNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="Enter receipt number (e.g., REC-2025-001)" 
                                  {...field}
                                  data-testid="input-receipt-number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {receiptNumberMode === 'automatic' && (
                        <p className="text-xs text-muted-foreground">System will auto-generate receipt number</p>
                      )}
                    </div>
                  </div>

                  {/* Discount Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Discount (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Discount Value {form.watch('discountType') === 'percentage' ? '(%)' : '(Rs)'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={form.watch('discountType') === 'percentage' ? "e.g., 10" : "e.g., 5000"}
                                {...field}
                                data-testid="input-discount-value"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discountReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Reason</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Merit scholarship, Staff child"
                                {...field}
                                data-testid="input-discount-reason"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('discountType') && form.watch('discountValue') && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                        <span className="text-green-700 dark:text-green-400">
                          Discount Applied: {form.watch('discountType') === 'percentage' 
                            ? `${form.watch('discountValue')}%` 
                            : `Rs ${parseFloat(form.watch('discountValue') || '0').toLocaleString()}`}
                          {form.watch('discountReason') && ` - ${form.watch('discountReason')}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-background/50 p-4 rounded-md border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Total Fee Amount:</span>
                      <span className="text-lg font-bold text-foreground" data-testid="text-total-fee">
                        Rs {((parseFloat(form.watch("admissionFee") || "0") + parseFloat(form.watch("prospectusFee") || "0"))).toLocaleString()}
                      </span>
                    </div>
                    {paymentType === 'partial' && (
                      <>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold text-sm text-green-700 dark:text-green-400">Paying Now:</span>
                          <span className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-paying-now">
                            Rs {((parseFloat(form.watch("admissionFeePayingNow") || "0") + parseFloat(form.watch("prospectusFeePayingNow") || "0"))).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-orange-700 dark:text-orange-400">Remaining Balance:</span>
                          <span className="text-lg font-bold text-orange-700 dark:text-orange-400" data-testid="text-remaining-balance">
                            Rs {((parseFloat(form.watch("admissionFee") || "0") + parseFloat(form.watch("prospectusFee") || "0")) - (parseFloat(form.watch("admissionFeePayingNow") || "0") + parseFloat(form.watch("prospectusFeePayingNow") || "0"))).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                    {paymentType === 'full' && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold text-sm text-green-700 dark:text-green-400">Collecting Now:</span>
                        <span className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-total-amount">
                          Rs {((parseFloat(form.watch("admissionFee") || "0") + parseFloat(form.watch("prospectusFee") || "0"))).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending} 
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Creating..." : "Create Admission"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()} 
                  className="border-2"
                  data-testid="button-reset"
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Admission Successful!
            </DialogTitle>
            <DialogDescription>
              Student account has been created with the following login credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {generatedCredentials && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <AlertTitle className="text-green-800 dark:text-green-200 font-bold mb-3">Login Credentials</AlertTitle>
                <AlertDescription className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Username</p>
                        <p className="font-mono font-bold text-lg" data-testid="text-generated-username">{generatedCredentials.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Password</p>
                        <p className="font-mono font-bold text-lg" data-testid="text-generated-password">{generatedCredentials.password}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Please save these credentials and share them with the student. They can use these to login to their account.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {feePayments && feePayments.length > 0 && (
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <AlertTitle className="text-blue-800 dark:text-blue-200 font-bold mb-3">Fees Collected</AlertTitle>
                <AlertDescription className="space-y-2">
                  {feePayments.map((payment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div>
                        <p className="font-semibold">{payment.type}</p>
                        <p className="text-xs text-muted-foreground">{payment.receipt?.paymentMethod || 'Cash'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-lg text-primary">Rs {parseFloat(payment.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 mt-3">
                    <p className="font-bold">Total Collected:</p>
                    <p className="font-mono font-bold text-xl text-primary" data-testid="text-total-collected">
                      Rs {feePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0).toLocaleString()}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-4">
            {feePayments && feePayments.length > 0 && (
              <Button
                onClick={printBothReceipts}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                data-testid="button-print-receipts"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipts (2 Copies)
              </Button>
            )}
            <Button
              onClick={() => {
                if (generatedCredentials) {
                  const text = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  toast({
                    title: "Copied!",
                    description: "Credentials copied to clipboard",
                  });
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
              data-testid="button-copy-credentials"
            >
              Copy Credentials
            </Button>
            <Button
              onClick={() => setShowCredentialsDialog(false)}
              variant="outline"
              className="border-2"
              data-testid="button-close-credentials"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
