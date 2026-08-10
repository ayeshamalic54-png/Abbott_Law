import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import type { FeeVoucher, Student } from "@shared/schema";

export default function FeeVoucherView() {
  const [, params] = useRoute("/fees/voucher/:id");
  const [, setLocation] = useLocation();
  const voucherId = params?.id;

  const { data: voucher, isLoading: voucherLoading } = useQuery<FeeVoucher>({
    queryKey: [`/api/fees/vouchers/${voucherId}`],
    enabled: !!voucherId,
  });

  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: [`/api/students/${voucher?.studentId}`],
    enabled: !!voucher?.studentId,
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/settings'],
  });

  if (voucherLoading || studentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading voucher...</p>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Voucher not found</p>
          <Button variant="ghost" onClick={() => setLocation('/fees/vouchers')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const grossAmount = parseFloat(voucher.amount);
  const discountAmount = voucher.discountAmount ? parseFloat(voucher.discountAmount) : 0;
  const netAmount = voucher.netAmount ? parseFloat(voucher.netAmount) : grossAmount - discountAmount;

  const voucherData = {
    voucherNumber: voucher.voucherNumber,
    dueDate: voucher.dueDate,
    studentName: student?.fullName || "N/A",
    fatherName: student?.fatherName || "N/A",
    rollNumber: student?.rollNumber || "N/A",
    program: student?.program || "N/A",
    semester: student?.semester || "N/A",
    month: voucher.month || "N/A",
    grossAmount: grossAmount,
    discountAmount: discountAmount,
    netAmount: netAmount,
    status: voucher.status,
  };

  const isLLBProgram = (program: string) => {
    if (!program) return false;
    const p = program.toLowerCase();
    return p.includes('llb') || p.includes('law');
  };

  const isLLB = isLLBProgram(voucherData.program);
  
  const collegeInfo = {
    name: isLLB ? 'ABBOTT LAW COLLEGE' : 'ABBOTT GROUP OF COLLEGES',
    subtitle: isLLB ? 'Affiliated with Hazara University' : 'Excellence in Education',
    address: settings.collegeAddress || 'Mansehra, Khyber Pakhtunkhwa, Pakistan',
    phone: settings.collegePhone || '+92-997-123456',
    themeColor: isLLB ? '#1e3a5f' : '#047857'
  };

  const VoucherCopy = ({ copyType, bgColor }: { copyType: string; bgColor: string }) => (
    <div className="voucher-copy" style={{ borderColor: collegeInfo.themeColor }}>
      <div className="voucher-header print-header" style={{ borderBottomColor: collegeInfo.themeColor }}>
        <h1 style={{ color: collegeInfo.themeColor }}>{collegeInfo.name}</h1>
        <p className="text-muted-foreground text-sm">{collegeInfo.subtitle}</p>
        <p className="text-xs text-muted-foreground">{collegeInfo.address} | Phone: {collegeInfo.phone}</p>
        <p className="font-bold mt-2">FEE VOUCHER</p>
        <div className="copy-label" style={{ backgroundColor: bgColor }}>{copyType}</div>
      </div>

      <div className="voucher-content">
        <div className="voucher-info-row">
          <div className="voucher-field">
            <span className="voucher-label">Voucher No:</span>
            <span className="voucher-value">{voucherData.voucherNumber}</span>
          </div>
          <div className="voucher-field">
            <span className="voucher-label">Due Date:</span>
            <span className="voucher-value">{voucherData.dueDate ? new Date(voucherData.dueDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div className="voucher-details">
          <table className="voucher-table">
            <tbody>
              <tr>
                <td className="label-col">Student Name:</td>
                <td className="value-col">{voucherData.studentName}</td>
                <td className="label-col">Roll Number:</td>
                <td className="value-col">{voucherData.rollNumber}</td>
              </tr>
              <tr>
                <td className="label-col">Father's Name:</td>
                <td className="value-col">{voucherData.fatherName}</td>
                <td className="label-col">Semester:</td>
                <td className="value-col">{voucherData.semester}</td>
              </tr>
              <tr>
                <td className="label-col">Program:</td>
                <td className="value-col">{voucherData.program}</td>
                <td className="label-col">Month:</td>
                <td className="value-col">{voucherData.month}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="amount-section" style={{ borderColor: collegeInfo.themeColor, backgroundColor: '#f0f7ff' }}>
          <div className="amount-row">
            <span>Gross Amount:</span>
            <span>Rs {voucherData.grossAmount.toLocaleString()}</span>
          </div>
          {voucherData.discountAmount > 0 && (
            <div className="amount-row" style={{ color: 'green' }}>
              <span>Discount:</span>
              <span>- Rs {voucherData.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="amount-row total-row" style={{ color: collegeInfo.themeColor }}>
            <span>Amount Payable:</span>
            <span>Rs {voucherData.netAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="notice-section">
          <p>Please pay before the due date to avoid late fee charges.</p>
        </div>

        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line">Student</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Accountant</div>
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
        <div className="text-center">
          <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded border border-amber-200">
            Please select <strong>LANDSCAPE</strong> orientation in print dialog for best results
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          style={{ backgroundColor: collegeInfo.themeColor }}
          className="text-white border-0 shadow-lg"
          data-testid="button-print"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Voucher
        </Button>
      </div>

      <div className="voucher-container">
        <VoucherCopy copyType="COLLEGE COPY" bgColor={collegeInfo.themeColor} />
        <div className="voucher-divider"></div>
        <VoucherCopy copyType="STUDENT COPY" bgColor="#16a34a" />
      </div>

      <style>{`
        @page { size: landscape; margin: 10mm; }
        
        .voucher-container {
          display: flex;
          gap: 20px;
          justify-content: center;
        }
        
        .voucher-copy {
          flex: 1;
          max-width: 45%;
          border: 2px solid;
          border-radius: 8px;
          padding: 16px;
          background: white;
        }
        
        .voucher-header {
          text-align: center;
          border-bottom: 2px solid;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        
        .voucher-header h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        
        .copy-label {
          display: inline-block;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          margin-top: 8px;
        }
        
        .voucher-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 12px;
        }
        
        .voucher-field {
          display: flex;
          flex-direction: column;
        }
        
        .voucher-label {
          font-weight: bold;
          color: #666;
          font-size: 10px;
        }
        
        .voucher-value {
          font-weight: 600;
        }
        
        .voucher-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 16px;
        }
        
        .voucher-table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
        }
        
        .label-col {
          font-weight: bold;
          background: #f5f5f5;
          width: 25%;
        }
        
        .value-col {
          width: 25%;
        }
        
        .amount-section {
          border: 1px solid;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 4px;
        }
        
        .total-row {
          font-size: 14px;
          font-weight: bold;
          border-top: 1px solid;
          padding-top: 8px;
          margin-top: 8px;
        }
        
        .notice-section {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-bottom: 16px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }
        
        .signature-box {
          text-align: center;
          width: 40%;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 4px;
          font-size: 10px;
        }
        
        .voucher-divider {
          width: 2px;
          background: #ddd;
        }
        
        @media print {
          .no-print { display: none !important; }
          
          .voucher-container {
            display: flex;
            gap: 15px;
          }
          
          .voucher-copy {
            max-width: 48%;
            page-break-inside: avoid;
          }
          
          .voucher-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
