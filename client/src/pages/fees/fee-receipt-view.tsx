import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import type { FeeVoucher, FeePayment, Student } from "@shared/schema";

export default function FeeReceiptView() {
  const [, params] = useRoute("/fees/receipt/:id");
  const [, setLocation] = useLocation();
  const voucherId = params?.id;

  const { data: voucher, isLoading: voucherLoading } = useQuery<FeeVoucher>({
    queryKey: [`/api/fees/vouchers/${voucherId}`],
    enabled: !!voucherId,
  });

  const { data: payment, isLoading: paymentLoading } = useQuery<FeePayment>({
    queryKey: [`/api/fees/payments/voucher/${voucherId}`],
    enabled: !!voucherId,
  });

  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: [`/api/students/${voucher?.studentId}`],
    enabled: !!voucher?.studentId,
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/settings'],
  });

  if (voucherLoading || paymentLoading || studentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Receipt not found</p>
          <Button variant="ghost" onClick={() => setLocation('/fees/vouchers')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const receiptData = {
    receiptNumber: payment?.receiptNumber || voucher.voucherNumber,
    date: payment?.paymentDate || new Date().toISOString().split('T')[0],
    studentName: student?.fullName || "N/A",
    fatherName: student?.fatherName || "N/A",
    rollNumber: student?.rollNumber || "N/A",
    program: student?.program || "N/A",
    semester: student?.semester || "N/A",
    amount: payment?.amount || voucher.amount,
    paymentMethod: payment?.paymentMethod || "Cash",
    collectedBy: "Admin",
    remarks: payment?.remarks || "Admission Fee",
  };

  const isLLBProgram = (program: string) => {
    if (!program) return false;
    const p = program.toLowerCase();
    return p.includes('llb') || p.includes('law');
  };

  const isLLB = isLLBProgram(receiptData.program);
  
  const collegeInfo = {
    name: isLLB ? 'ABBOTT LAW COLLEGE' : 'ABBOTT GROUP OF COLLEGES',
    subtitle: isLLB ? 'Affiliated with Hazara University' : 'Excellence in Education',
    address: settings.collegeAddress || 'Mansehra, Khyber Pakhtunkhwa, Pakistan',
    phone: settings.collegePhone || '+92-997-123456',
    themeColor: isLLB ? '#1e3a5f' : '#047857'
  };

  const ReceiptCopy = ({ copyType, bgColor }: { copyType: string; bgColor: string }) => (
    <div className="receipt-copy" style={{ borderColor: collegeInfo.themeColor }}>
      <div className="receipt-header print-header" style={{ borderBottomColor: collegeInfo.themeColor }}>
        <h1 style={{ color: collegeInfo.themeColor }}>{collegeInfo.name}</h1>
        <p className="text-muted-foreground text-sm">{collegeInfo.subtitle}</p>
        <p className="text-xs text-muted-foreground">{collegeInfo.address} | Phone: {collegeInfo.phone}</p>
        <div className="copy-label" style={{ backgroundColor: bgColor }}>{copyType}</div>
      </div>

      <div className="receipt-content">
        <div className="receipt-info-row">
          <div className="receipt-field">
            <span className="receipt-label">Receipt No:</span>
            <span className="receipt-value">{receiptData.receiptNumber}</span>
          </div>
          <div className="receipt-field">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{receiptData.date}</span>
          </div>
        </div>

        <div className="receipt-details">
          <table className="receipt-table">
            <tbody>
              <tr>
                <td className="label-col">Student Name:</td>
                <td className="value-col">{receiptData.studentName}</td>
                <td className="label-col">Roll Number:</td>
                <td className="value-col">{receiptData.rollNumber}</td>
              </tr>
              <tr>
                <td className="label-col">Father's Name:</td>
                <td className="value-col">{receiptData.fatherName}</td>
                <td className="label-col">Semester:</td>
                <td className="value-col">{receiptData.semester}</td>
              </tr>
              <tr>
                <td className="label-col">Program:</td>
                <td className="value-col">{receiptData.program}</td>
                <td className="label-col">Payment Method:</td>
                <td className="value-col">{receiptData.paymentMethod}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="amount-section" style={{ borderColor: collegeInfo.themeColor }}>
          <div className="amount-box">
            <span className="amount-label">Amount Paid:</span>
            <span className="amount-value" style={{ color: collegeInfo.themeColor }}>Rs {parseFloat(receiptData.amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="remarks-section">
          <div className="remarks-label">Remarks:</div>
          <div className="remarks-value">{receiptData.remarks}</div>
        </div>

        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line">Student Signature</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="no-print flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/fees/vouchers')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => window.print()}
          style={{ backgroundColor: collegeInfo.themeColor }}
          className="text-white border-0 shadow-lg"
          data-testid="button-print"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <div className="receipt-container">
        <ReceiptCopy copyType="COLLEGE COPY" bgColor={collegeInfo.themeColor} />
        <div className="receipt-divider"></div>
        <ReceiptCopy copyType="STUDENT COPY" bgColor="#16a34a" />
      </div>
    </div>
  );
}
