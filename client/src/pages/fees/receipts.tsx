import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Receipt, Eye, Printer, Search, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReceiptData {
  id: string;
  receiptNumber: string;
  receiptType: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  fatherName: string;
  program: string;
  semester: number;
  grossAmount: string;
  discountType: string;
  discountValue: string;
  discountAmount: string;
  discountReason: string;
  netAmount: string;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
}

export default function ReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const { data: receipts = [], isLoading } = useQuery<ReceiptData[]>({
    queryKey: ['/api/receipts'],
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/settings'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/receipts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Receipt deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete receipt", variant: "destructive" });
    },
  });

  const filteredReceipts = receipts.filter(r =>
    r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentRollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      email: settings.collegeEmail || 'info@abbottlaw.edu.pk',
      themeColor: isLLB ? '#1e3a5f' : '#047857'
    };
  };

  const printBothCopies = (receipt: ReceiptData) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const college = getCollegeInfo(receipt.program);

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receiptNumber}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          @media print {
            html, body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print, .print-instruction { display: none !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 9px;
          }
          .print-instruction {
            background: #fffbeb;
            border: 1px solid #f59e0b;
            padding: 8px 12px;
            margin: 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #92400e;
          }
          .print-wrapper {
            padding: 5mm;
            width: 100%;
            max-width: 277mm;
            margin: 0 auto;
          }
          .page-container {
            display: flex;
            flex-direction: row;
            gap: 10mm;
            width: 100%;
          }
          .receipt-copy {
            flex: 1;
            border: 2px solid ${college.themeColor};
            padding: 8px;
            border-radius: 4px;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px solid ${college.themeColor};
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .college-name {
            font-size: 10px;
            font-weight: bold;
            color: ${college.themeColor};
            margin-bottom: 1px;
          }
          .college-subtitle {
            font-size: 7px;
            color: #666;
            margin-bottom: 1px;
          }
          .college-address {
            font-size: 6px;
            color: #888;
          }
          .copy-type {
            font-size: 8px;
            font-weight: bold;
            background: ${college.themeColor};
            color: white;
            padding: 2px 8px;
            border-radius: 2px;
            display: inline-block;
            margin-top: 3px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            padding: 3px;
            background: #f5f5f5;
            border-radius: 2px;
          }
          .receipt-info-item {
            text-align: center;
          }
          .receipt-info-label {
            font-size: 6px;
            color: #666;
          }
          .receipt-info-value {
            font-size: 7px;
            font-weight: bold;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
          }
          .details-table td {
            padding: 2px 3px;
            border: 1px solid #ddd;
            font-size: 7px;
          }
          .details-table td:first-child {
            font-weight: bold;
            width: 40%;
            background: #f9f9f9;
          }
          .amount-box {
            background: #f0f7ff;
            border: 1px solid ${college.themeColor};
            padding: 4px;
            border-radius: 2px;
            margin-bottom: 4px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            margin-bottom: 2px;
          }
          .amount-row.total {
            font-size: 9px;
            font-weight: bold;
            border-top: 1px solid ${college.themeColor};
            padding-top: 3px;
            margin-top: 3px;
            color: ${college.themeColor};
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            padding-top: 5px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            padding-top: 2px;
            font-size: 6px;
          }
          .print-btn {
            background: ${college.themeColor};
            color: white;
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin: 10px auto;
            display: block;
          }
          .print-btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="print-instruction">Please select LANDSCAPE orientation in print settings for best results. Both copies will print side-by-side.</div>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
        
        <div class="print-wrapper">
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
                <div class="receipt-info-value">${receipt.receiptNumber}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">${receipt.paymentDate}</div>
              </div>
            </div>
            
            <table class="details-table">
              <tr><td>Student Name</td><td>${receipt.studentName}</td></tr>
              <tr><td>Father's Name</td><td>${receipt.fatherName || '-'}</td></tr>
              <tr><td>Roll Number</td><td>${receipt.studentRollNumber || '-'}</td></tr>
              <tr><td>Program</td><td>${receipt.program || '-'}</td></tr>
              <tr><td>Semester</td><td>${receipt.semester || '-'}</td></tr>
              <tr><td>Payment Method</td><td>${receipt.paymentMethod || 'Cash'}</td></tr>
            </table>
            
            <div class="amount-box">
              <div class="amount-row">
                <span>Gross Amount:</span>
                <span>Rs ${parseFloat(receipt.grossAmount).toLocaleString()}</span>
              </div>
              ${receipt.discountAmount && parseFloat(receipt.discountAmount) > 0 ? `
              <div class="amount-row" style="color: green;">
                <span>Discount:</span>
                <span>- Rs ${parseFloat(receipt.discountAmount).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="amount-row total">
                <span>Amount Paid:</span>
                <span>Rs ${parseFloat(receipt.netAmount).toLocaleString()}</span>
              </div>
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
                <div class="receipt-info-value">${receipt.receiptNumber}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">${receipt.paymentDate}</div>
              </div>
            </div>
            
            <table class="details-table">
              <tr><td>Student Name</td><td>${receipt.studentName}</td></tr>
              <tr><td>Father's Name</td><td>${receipt.fatherName || '-'}</td></tr>
              <tr><td>Roll Number</td><td>${receipt.studentRollNumber || '-'}</td></tr>
              <tr><td>Program</td><td>${receipt.program || '-'}</td></tr>
              <tr><td>Semester</td><td>${receipt.semester || '-'}</td></tr>
              <tr><td>Payment Method</td><td>${receipt.paymentMethod || 'Cash'}</td></tr>
            </table>
            
            <div class="amount-box">
              <div class="amount-row">
                <span>Gross Amount:</span>
                <span>Rs ${parseFloat(receipt.grossAmount).toLocaleString()}</span>
              </div>
              ${receipt.discountAmount && parseFloat(receipt.discountAmount) > 0 ? `
              <div class="amount-row" style="color: green;">
                <span>Discount:</span>
                <span>- Rs ${parseFloat(receipt.discountAmount).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="amount-row total">
                <span>Amount Paid:</span>
                <span>Rs ${parseFloat(receipt.netAmount).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature-box"><div class="signature-line">Student Signature</div></div>
              <div class="signature-box"><div class="signature-line">Authorized Signature</div></div>
            </div>
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

  const printSingleCopy = (receipt: ReceiptData, copyType: 'COLLEGE' | 'STUDENT') => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const college = getCollegeInfo(receipt.program);

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receiptNumber} - ${copyType} Copy</title>
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
            border-bottom: 3px solid ${college.themeColor};
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .college-name {
            font-size: 24px;
            font-weight: bold;
            color: ${college.themeColor};
            margin-bottom: 5px;
          }
          .college-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .college-address {
            font-size: 12px;
            color: #888;
          }
          .copy-type {
            font-size: 18px;
            font-weight: bold;
            background: ${copyType === 'COLLEGE' ? college.themeColor : '#16a34a'};
            color: white;
            padding: 8px 20px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
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
          .amount-section {
            background: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 2px solid ${college.themeColor};
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            margin-bottom: 10px;
          }
          .amount-row.total {
            font-size: 22px;
            font-weight: bold;
            border-top: 2px solid ${college.themeColor};
            padding-top: 10px;
            margin-top: 10px;
            color: ${college.themeColor};
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
            background: ${college.themeColor};
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
        
        <div class="receipt-header">
          <div class="college-name">${college.name}</div>
          <div class="college-subtitle">${college.subtitle}</div>
          <div class="college-address">${college.address} | Phone: ${college.phone}</div>
          <div class="copy-type">${copyType} COPY</div>
        </div>

        <div class="receipt-body">
          <div class="info-row">
            <span class="info-label">Receipt Number:</span>
            <span class="info-value">${receipt.receiptNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Receipt Date:</span>
            <span class="info-value">${receipt.paymentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${receipt.studentName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Father's Name:</span>
            <span class="info-value">${receipt.fatherName || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${receipt.studentRollNumber || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Program:</span>
            <span class="info-value">${receipt.program || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Semester:</span>
            <span class="info-value">${receipt.semester || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${receipt.paymentMethod || 'Cash'}</span>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-row">
            <span>Gross Amount:</span>
            <span>Rs ${parseFloat(receipt.grossAmount).toLocaleString()}</span>
          </div>
          ${receipt.discountAmount && parseFloat(receipt.discountAmount) > 0 ? `
          <div class="amount-row" style="color: green;">
            <span>Discount (${receipt.discountType === 'percentage' ? receipt.discountValue + '%' : 'Fixed'}):</span>
            <span>- Rs ${parseFloat(receipt.discountAmount).toLocaleString()}</span>
          </div>
          ${receipt.discountReason ? `<div style="font-size: 12px; color: #666; margin-bottom: 10px;">Reason: ${receipt.discountReason}</div>` : ''}
          ` : ''}
          <div class="amount-row total">
            <span>Net Amount Paid:</span>
            <span>Rs ${parseFloat(receipt.netAmount).toLocaleString()}</span>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-receipts">
            Fee Receipts
          </h1>
          <p className="text-muted-foreground mt-1">View and print all fee receipts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Receipts ({filteredReceipts.length})
          </CardTitle>
          <CardDescription>Complete record of all fee receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number, or receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-receipts"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading receipts...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No receipts found. Receipts will appear here after fee collection.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id} data-testid={`row-receipt-${receipt.id}`}>
                      <TableCell className="font-mono font-semibold">
                        {receipt.receiptNumber}
                      </TableCell>
                      <TableCell>
                        {receipt.paymentDate}
                      </TableCell>
                      <TableCell>
                        <Badge variant={receipt.receiptType === 'admission' ? 'default' : 'secondary'}>
                          {receipt.receiptType === 'admission' ? 'Admission' : 'Fee'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{receipt.studentName}</TableCell>
                      <TableCell>{receipt.studentRollNumber || '-'}</TableCell>
                      <TableCell>{receipt.program || '-'}</TableCell>
                      <TableCell className="text-right">
                        Rs {parseFloat(receipt.grossAmount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {receipt.discountAmount && parseFloat(receipt.discountAmount) > 0
                          ? `Rs ${parseFloat(receipt.discountAmount).toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        Rs {parseFloat(receipt.netAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printSingleCopy(receipt, 'COLLEGE')}
                            title="Print College Copy"
                            data-testid={`button-print-college-${receipt.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            onClick={() => printBothCopies(receipt)}
                            title="Print Both Copies (1 Page)"
                            data-testid={`button-print-both-${receipt.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Both
                          </Button>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Delete Receipt"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-receipt-${receipt.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete receipt {receipt.receiptNumber}? This will permanently remove the payment record. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(receipt.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </div>
  );
}
