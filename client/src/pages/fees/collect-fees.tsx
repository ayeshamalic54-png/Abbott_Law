import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Search, CheckCircle, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  fatherName: string;
  rollNumber: string;
  program: string;
  semester: number;
  session: string;
};

type FeeVoucher = {
  id: string;
  studentId: string;
  voucherNumber: string;
  month: string;
  amount: string;
  dueDate: string;
  status: string;
  issuedDate: string;
  discountType: string;
  discountValue: string;
  discountAmount: string;
  discountReason: string;
  netAmount: string;
};

type FeePayment = {
  voucherId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  remarks?: string;
};

export default function CollectFees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    totalPaid: string;
    remainingBalance: string;
  } | null>(null);
  const { toast } = useToast();

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: allVouchers = [] } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fees/vouchers'],
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/settings'],
  });

  const filteredStudents = students.filter(s => 
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const studentVouchers = selectedStudent 
    ? allVouchers.filter(v => v.studentId === selectedStudent.id && (v.status === 'pending' || v.status === 'partial'))
    : [];

  const selectedVoucherData = allVouchers.find(v => v.id === selectedVoucher);

  const isLLBProgram = (program: string) => {
    if (!program) return false;
    const programLower = program.toLowerCase();
    return programLower.includes('llb') || programLower.includes('law');
  };

  const getCollegeInfo = (program: string) => {
    const isLLB = isLLBProgram(program);
    return {
      name: isLLB ? 'ABBOTT LAW COLLEGE' : 'ABBOTT GROUP OF COLLEGES',
      subtitle: isLLB ? 'Affiliated with Hazara University' : 'Excellence in Education',
      address: settings.collegeAddress || 'Mansehra, Khyber Pakhtunkhwa, Pakistan',
      phone: settings.collegePhone || '+92-997-123456',
      themeColor: isLLB ? '#1e3a5f' : '#047857'
    };
  };

  const generateBothCopies = (paymentInfo?: { remainingBalance: string; totalPaid: string }) => {
    if (!selectedStudent || !selectedVoucherData) return;

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const college = getCollegeInfo(selectedStudent.program);
    const netAmount = parseFloat(selectedVoucherData.netAmount || selectedVoucherData.amount);
    const paidAmount = parseFloat(amountPaid);
    // Use provided payment info if available, otherwise calculate from state
    const remainingBalance = paymentInfo 
      ? parseFloat(paymentInfo.remainingBalance) 
      : (lastPaymentInfo ? parseFloat(lastPaymentInfo.remainingBalance) : Math.max(0, netAmount - paidAmount));

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${selectedVoucherData.voucherNumber}</title>
        <style>
          @page { 
            size: A4 landscape; 
            margin: 10mm; 
          }
          @media print {
            html, body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            padding: 10px;
          }
          .print-instruction {
            background: #fffbeb;
            border: 1px solid #f59e0b;
            padding: 12px 16px;
            margin-bottom: 15px;
            border-radius: 6px;
            font-size: 14px;
            color: #92400e;
            text-align: center;
          }
          .page-container {
            display: flex;
            flex-direction: row;
            gap: 20px;
            width: 100%;
          }
          .receipt-copy {
            flex: 1;
            border: 2px solid ${college.themeColor};
            padding: 15px;
            border-radius: 6px;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid ${college.themeColor};
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .college-name {
            font-size: 16px;
            font-weight: bold;
            color: ${college.themeColor};
            margin-bottom: 3px;
          }
          .college-subtitle {
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
          }
          .college-address {
            font-size: 9px;
            color: #888;
          }
          .copy-type {
            font-size: 12px;
            font-weight: bold;
            background: ${college.themeColor};
            color: white;
            padding: 4px 16px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 8px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .receipt-info-item {
            text-align: center;
          }
          .receipt-info-label {
            font-size: 9px;
            color: #666;
          }
          .receipt-info-value {
            font-size: 12px;
            font-weight: bold;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .details-table td {
            padding: 5px 8px;
            border: 1px solid #ddd;
            font-size: 10px;
          }
          .details-table td:first-child {
            font-weight: bold;
            width: 40%;
            background: #f9f9f9;
          }
          .amount-box {
            background: #f0f7ff;
            border: 1px solid ${college.themeColor};
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 4px;
          }
          .amount-row.total {
            font-size: 13px;
            font-weight: bold;
            border-top: 2px solid ${college.themeColor};
            padding-top: 6px;
            margin-top: 6px;
            color: ${college.themeColor};
          }
          .amount-row.remaining {
            font-size: 12px;
            font-weight: bold;
            color: #dc2626;
            margin-top: 4px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 10px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            padding-top: 4px;
            font-size: 9px;
          }
          .print-btn {
            background: ${college.themeColor};
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 15px auto;
            display: block;
          }
          .print-btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="print-instruction no-print">
          <strong>Tip:</strong> Select "Landscape" orientation in your print settings for best results. Both copies will print side by side.
        </div>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
        
        <div class="page-container">
          <!-- COLLEGE COPY -->
          <div class="receipt-copy">
            <div class="receipt-header">
              <div class="college-name">${college.name}</div>
              <div class="college-subtitle">${college.subtitle}</div>
              <div class="college-address">${college.address} | Phone: ${college.phone}</div>
              <div class="copy-type">COLLEGE COPY</div>
            </div>
            
            <div class="receipt-info">
              <div class="receipt-info-item">
                <div class="receipt-info-label">Receipt No</div>
                <div class="receipt-info-value">${selectedVoucherData.voucherNumber}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">${format(new Date(), 'dd MMM yyyy')}</div>
              </div>
            </div>
            
            <table class="details-table">
              <tr><td>Student Name</td><td>${selectedStudent.firstName} ${selectedStudent.lastName}</td></tr>
              <tr><td>Father's Name</td><td>${selectedStudent.fatherName || '-'}</td></tr>
              <tr><td>Roll Number</td><td>${selectedStudent.rollNumber}</td></tr>
              <tr><td>Program</td><td>${selectedStudent.program}</td></tr>
              <tr><td>Semester</td><td>${selectedStudent.semester || '-'}</td></tr>
              <tr><td>Payment Method</td><td>${paymentMethod.toUpperCase()}</td></tr>
            </table>
            
            <div class="amount-box">
              <div class="amount-row">
                <span>Total Fee (Net Amount):</span>
                <span>Rs ${netAmount.toLocaleString()}</span>
              </div>
              ${selectedVoucherData.discountAmount && parseFloat(selectedVoucherData.discountAmount) > 0 ? `
              <div class="amount-row" style="color: green;">
                <span>Discount Applied:</span>
                <span>- Rs ${parseFloat(selectedVoucherData.discountAmount).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="amount-row total">
                <span>Amount Paid Now:</span>
                <span>Rs ${paidAmount.toLocaleString()}</span>
              </div>
              ${remainingBalance > 0 ? `
              <div class="amount-row remaining">
                <span>Remaining Balance:</span>
                <span>Rs ${remainingBalance.toLocaleString()}</span>
              </div>
              ` : `
              <div class="amount-row" style="color: green; font-weight: bold;">
                <span>Status:</span>
                <span>FULLY PAID</span>
              </div>
              `}
            </div>
            
            <div class="signatures">
              <div class="signature-box"><div class="signature-line">Student Signature</div></div>
              <div class="signature-box"><div class="signature-line">Authorized Signature</div></div>
            </div>
          </div>
          
          <!-- STUDENT COPY -->
          <div class="receipt-copy">
            <div class="receipt-header">
              <div class="college-name">${college.name}</div>
              <div class="college-subtitle">${college.subtitle}</div>
              <div class="college-address">${college.address} | Phone: ${college.phone}</div>
              <div class="copy-type" style="background: #16a34a;">STUDENT COPY</div>
            </div>
            
            <div class="receipt-info">
              <div class="receipt-info-item">
                <div class="receipt-info-label">Receipt No</div>
                <div class="receipt-info-value">${selectedVoucherData.voucherNumber}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">${format(new Date(), 'dd MMM yyyy')}</div>
              </div>
            </div>
            
            <table class="details-table">
              <tr><td>Student Name</td><td>${selectedStudent.firstName} ${selectedStudent.lastName}</td></tr>
              <tr><td>Father's Name</td><td>${selectedStudent.fatherName || '-'}</td></tr>
              <tr><td>Roll Number</td><td>${selectedStudent.rollNumber}</td></tr>
              <tr><td>Program</td><td>${selectedStudent.program}</td></tr>
              <tr><td>Semester</td><td>${selectedStudent.semester || '-'}</td></tr>
              <tr><td>Payment Method</td><td>${paymentMethod.toUpperCase()}</td></tr>
            </table>
            
            <div class="amount-box">
              <div class="amount-row">
                <span>Total Fee (Net Amount):</span>
                <span>Rs ${netAmount.toLocaleString()}</span>
              </div>
              ${selectedVoucherData.discountAmount && parseFloat(selectedVoucherData.discountAmount) > 0 ? `
              <div class="amount-row" style="color: green;">
                <span>Discount Applied:</span>
                <span>- Rs ${parseFloat(selectedVoucherData.discountAmount).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="amount-row total">
                <span>Amount Paid Now:</span>
                <span>Rs ${paidAmount.toLocaleString()}</span>
              </div>
              ${remainingBalance > 0 ? `
              <div class="amount-row remaining">
                <span>Remaining Balance:</span>
                <span>Rs ${remainingBalance.toLocaleString()}</span>
              </div>
              ` : `
              <div class="amount-row" style="color: green; font-weight: bold;">
                <span>Status:</span>
                <span>FULLY PAID</span>
              </div>
              `}
            </div>
            
            <div class="signatures">
              <div class="signature-box"><div class="signature-line">Student Signature</div></div>
              <div class="signature-box"><div class="signature-line">Authorized Signature</div></div>
            </div>
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

  const collectMutation = useMutation({
    mutationFn: async (data: FeePayment) => {
      const paymentResult = await apiRequest('POST', '/api/fees/payments', data);
      const paymentData = await paymentResult.json();
      
      // Store payment info for receipt generation
      setLastPaymentInfo({
        totalPaid: paymentData.totalPaid || data.amount,
        remainingBalance: paymentData.remainingBalance || '0'
      });
      
      // Save receipt to database
      if (selectedStudent && selectedVoucherData) {
        await apiRequest('POST', '/api/receipts', {
          receiptType: 'fee_collection',
          studentId: selectedStudent.id,
          studentName: selectedStudent.fullName,
          studentRollNumber: selectedStudent.rollNumber,
          fatherName: selectedStudent.fatherName,
          program: selectedStudent.program,
          semester: selectedStudent.semester,
          voucherId: selectedVoucherData.id,
          grossAmount: selectedVoucherData.amount,
          discountType: selectedVoucherData.discountType,
          discountValue: selectedVoucherData.discountValue,
          discountAmount: selectedVoucherData.discountAmount,
          discountReason: selectedVoucherData.discountReason,
          netAmount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentDate: new Date().toISOString().split('T')[0],
          remainingBalance: paymentData.remainingBalance || '0',
        });
      }
      
      return paymentData;
    },
    onSuccess: (paymentData) => {
      toast({
        title: "Success",
        description: "Fee payment collected and receipt saved. Generating print copies...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      
      // Auto-generate both copies on one page with the payment data
      setTimeout(() => {
        generateBothCopies({
          remainingBalance: paymentData.remainingBalance || '0',
          totalPaid: paymentData.totalPaid || '0'
        });
      }, 500);
      
      // Reset form
      setSelectedVoucher("");
      setAmountPaid("");
      setPaymentMethod("cash");
      setLastPaymentInfo(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handleCollect = () => {
    if (!selectedVoucher || !amountPaid) {
      toast({
        title: "Error",
        description: "Please select a voucher and enter amount",
        variant: "destructive",
      });
      return;
    }

    collectMutation.mutate({
      voucherId: selectedVoucher,
      amount: amountPaid,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-collect-fees">Collect Fees</h1>
          <p className="text-muted-foreground">Process student fee payments</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Student */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by roll number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-student"
              />
            </div>

            {searchQuery && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                ) : (
                  filteredStudents.map(student => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-all hover-elevate ${
                        selectedStudent?.id === student.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedStudent(student);
                        setSearchQuery("");
                        setSelectedVoucher("");
                      }}
                      data-testid={`student-card-${student.id}`}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                          </div>
                          <Badge variant="outline">{student.program}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {selectedStudent && !searchQuery && (
              <Card className="border-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.rollNumber}</p>
                        <Badge variant="outline" className="mt-1">{selectedStudent.program}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setSelectedVoucher("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Fee Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedStudent ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Search and select a student first</p>
              </div>
            ) : studentVouchers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                <p>No pending fee vouchers</p>
                <p className="text-sm mt-1">All fees are paid!</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Fee Voucher</label>
                  <Select value={selectedVoucher} onValueChange={setSelectedVoucher}>
                    <SelectTrigger data-testid="select-voucher">
                      <SelectValue placeholder="Choose voucher" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentVouchers.map(voucher => (
                        <SelectItem key={voucher.id} value={voucher.id}>
                          {voucher.voucherNumber} - {voucher.month} (Rs. {voucher.amount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVoucherData && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Voucher:</span>
                      <span className="font-medium">{selectedVoucherData.voucherNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Month:</span>
                      <span className="font-medium">{selectedVoucherData.month}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Due:</span>
                      <span className="font-bold text-lg">Rs. {selectedVoucherData.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className={`font-medium ${new Date(selectedVoucherData.dueDate) < new Date() ? 'text-red-600' : ''}`}>
                        {format(new Date(selectedVoucherData.dueDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Amount Paid (Rs.)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    data-testid="input-amount"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCollect}
                  disabled={!selectedVoucher || !amountPaid || collectMutation.isPending}
                  data-testid="button-collect"
                >
                  {collectMutation.isPending ? "Processing..." : "Collect Payment"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
