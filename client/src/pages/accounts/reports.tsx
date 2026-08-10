import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Wallet, DollarSign, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import abbottLawLogo from "@assets/WhatsApp_Image_2025-12-24_at_4.28.53_PM_1766577021051.jpeg";
import abbottGroupLogo from "@assets/WhatsApp_Image_2025-12-24_at_2.17.34_PM_1766577021052.jpeg";

interface PaymentDetail {
  id: string;
  receiptNumber: string;
  studentName: string;
  fatherName: string;
  rollNumber: string;
  program: string;
  semester: number;
  amount: number;
  paymentMethod: string;
}

interface IncomeDetail {
  id: string;
  description: string;
  category: string;
  amount: number;
  referenceNumber: string;
}

interface ExpenseDetail {
  id: string;
  description: string;
  category: string;
  amount: number;
  referenceNumber: string;
}

interface DailyReportData {
  date: string;
  llbPayments: PaymentDetail[];
  groupPayments: PaymentDetail[];
  otherIncome: IncomeDetail[];
  expenses: ExpenseDetail[];
  totals: {
    llbTotal: number;
    groupTotal: number;
    otherIncomeTotal: number;
    expenseTotal: number;
    combinedTotalIncome: number;
    combinedBalance: number;
    groupTotalIncome: number;
    groupBalance: number;
  };
}

export default function AccountsReports() {
  const [printingReport, setPrintingReport] = useState<'combined' | 'group' | null>(null);

  const { data: report, isLoading } = useQuery<DailyReportData>({
    queryKey: ['/api/reports/daily'],
  });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const printCombinedReport = () => {
    setPrintingReport('combined');
    setTimeout(() => {
      window.print();
      setPrintingReport(null);
    }, 200);
  };

  const printGroupReport = () => {
    setPrintingReport('group');
    setTimeout(() => {
      window.print();
      setPrintingReport(null);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = report?.totals || {
    llbTotal: 0,
    groupTotal: 0,
    otherIncomeTotal: 0,
    expenseTotal: 0,
    combinedTotalIncome: 0,
    combinedBalance: 0,
    groupTotalIncome: 0,
    groupBalance: 0,
  };

  return (
    <>
      {/* Screen View */}
      <div className={`min-h-screen bg-background ${printingReport ? 'print:hidden' : ''}`}>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Daily Financial Reports</h1>
              <p className="text-muted-foreground mt-1">{today}</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Combined Report Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  Combined Daily Report
                </CardTitle>
                <p className="text-sm text-muted-foreground">LLB + Group + Other Income - Expenses</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LLB Fee Payments ({report?.llbPayments?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.llbTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Fee Payments ({report?.groupPayments?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.groupTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Income ({report?.otherIncome?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.otherIncomeTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-green-600">
                    <span className="font-medium">Total Income</span>
                    <span className="font-bold">Rs {totals.combinedTotalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>(-) Expenses ({report?.expenses?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.expenseTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-green-500 pt-3 mt-2">
                    <span className="text-lg font-bold">NET BALANCE</span>
                    <span className={`text-xl font-bold ${totals.combinedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs {totals.combinedBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={printCombinedReport}
                  data-testid="button-print-combined"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Combined Report
                </Button>
              </CardContent>
            </Card>

            {/* Group Report Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                  Group Daily Report
                </CardTitle>
                <p className="text-sm text-muted-foreground">Group + Other Income - Expenses (LLB Excluded)</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Fee Payments ({report?.groupPayments?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.groupTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Income ({report?.otherIncome?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.otherIncomeTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-teal-600">
                    <span className="font-medium">Total Income</span>
                    <span className="font-bold">Rs {totals.groupTotalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>(-) Expenses ({report?.expenses?.length || 0})</span>
                    <span className="font-semibold">Rs {totals.expenseTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-teal-500 pt-3 mt-2">
                    <span className="text-lg font-bold">NET BALANCE</span>
                    <span className={`text-xl font-bold ${totals.groupBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs {totals.groupBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  variant="secondary"
                  onClick={printGroupReport}
                  data-testid="button-print-group"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Group Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Print: Combined Report */}
      {printingReport === 'combined' && (
        <div className="hidden print:block bg-white text-black" style={{ fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', padding: '10px' }}>
          {/* Letterhead */}
          <div style={{ borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <img src={abbottLawLogo} alt="Abbott Law College Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>
                  ABBOTT LAW COLLEGE MANSEHRA
                </h1>
                <p style={{ fontSize: '12px', margin: '3px 0', fontStyle: 'italic' }}>
                  Affiliated with Hazara University, Mansehra
                </p>
                <p style={{ fontSize: '10px', margin: '2px 0', color: '#444' }}>
                  Main Shinkiari Road, Mansehra | Phone: 0997-304480 | Email: info@abbottlawcollege.edu.pk
                </p>
              </div>
              <img src={abbottLawLogo} alt="Abbott Law College Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', visibility: 'hidden' }} />
            </div>
          </div>

          {/* Report Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline', margin: '0' }}>
              COMBINED DAILY FINANCIAL REPORT
            </h2>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>Date: {today}</p>
          </div>

          {/* LLB Fee Collection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #1e40af' }}>
              A. LLB FEE COLLECTION
            </h3>
            {report?.llbPayments && report.llbPayments.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Receipt No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Student Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Father Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Roll No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Program</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Sem</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '90px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.llbPayments.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.receiptNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.studentName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.fatherName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.rollNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.program}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{p.semester}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#d1fae5', fontWeight: 'bold' }}>
                    <td colSpan={7} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (LLB Fees):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.llbTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No LLB fee payments recorded today</p>
            )}
          </div>

          {/* Group Fee Collection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #0d9488' }}>
              B. GROUP FEE COLLECTION (B.Ed, DM, ADPE, etc.)
            </h3>
            {report?.groupPayments && report.groupPayments.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Receipt No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Student Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Father Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Roll No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Program</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Sem</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '90px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.groupPayments.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.receiptNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.studentName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.fatherName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.rollNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.program}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{p.semester}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#ccfbf1', fontWeight: 'bold' }}>
                    <td colSpan={7} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Group Fees):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.groupTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No Group fee payments recorded today</p>
            )}
          </div>

          {/* Other Income */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #7c3aed' }}>
              C. OTHER INCOME (Canteen, Library, Registration, etc.)
            </h3>
            {report?.otherIncome && report.otherIncome.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Reference</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '110px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.otherIncome.map((i, idx) => (
                    <tr key={i.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.description}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.category}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.referenceNumber || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {i.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#ede9fe', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Other Income):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.otherIncomeTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No other income recorded today</p>
            )}
          </div>

          {/* Expenses */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #dc2626' }}>
              D. EXPENSES
            </h3>
            {report?.expenses && report.expenses.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Reference</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '110px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((e, idx) => (
                    <tr key={e.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.description}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.category}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.referenceNumber || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#fee2e2', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Expenses):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.expenseTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No expenses recorded today</p>
            )}
          </div>

          {/* Summary Box */}
          <div style={{ border: '2px solid #000', padding: '15px', marginTop: '25px', backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px', textDecoration: 'underline' }}>
              DAILY FINANCIAL SUMMARY
            </h3>
            <table style={{ width: '60%', margin: '0 auto', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '5px 0' }}>A. LLB Fee Collection</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>Rs {totals.llbTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0' }}>B. Group Fee Collection</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>Rs {totals.groupTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0' }}>C. Other Income</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>Rs {totals.otherIncomeTotal.toLocaleString()}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #000' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>TOTAL INCOME (A+B+C)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>Rs {totals.combinedTotalIncome.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0', color: '#dc2626' }}>D. Less: Total Expenses</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>Rs {totals.expenseTotal.toLocaleString()}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #000', backgroundColor: '#dcfce7' }}>
                  <td style={{ padding: '10px 5px', fontSize: '14px', fontWeight: 'bold' }}>NET CASH BALANCE</td>
                  <td style={{ padding: '10px 5px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>Rs {totals.combinedBalance.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Section */}
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Prepared By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Accountant</div>
            </div>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Verified By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Senior Accountant</div>
            </div>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Approved By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Principal</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            This is a computer-generated report. Printed on {new Date().toLocaleString('en-GB')}
          </div>
        </div>
      )}

      {/* Print: Group Report */}
      {printingReport === 'group' && (
        <div className="hidden print:block bg-white text-black" style={{ fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', padding: '10px' }}>
          {/* Letterhead */}
          <div style={{ borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <img src={abbottGroupLogo} alt="Abbott Group of Colleges Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>
                  ABBOTT GROUP OF COLLEGES MANSEHRA
                </h1>
                <p style={{ fontSize: '12px', margin: '3px 0', fontStyle: 'italic' }}>
                  Excellence in Education - B.Ed, DM, Physical Education Programs
                </p>
                <p style={{ fontSize: '10px', margin: '2px 0', color: '#444' }}>
                  Main Shinkiari Road, Mansehra | Phone: 0997-304480 | Email: info@abbottgroup.edu.pk
                </p>
              </div>
              <img src={abbottGroupLogo} alt="Abbott Group of Colleges Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', visibility: 'hidden' }} />
            </div>
          </div>

          {/* Report Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline', margin: '0' }}>
              GROUP DAILY FINANCIAL REPORT
            </h2>
            <p style={{ fontSize: '11px', margin: '5px 0', fontStyle: 'italic' }}>(Excludes LLB Fee Collection)</p>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>Date: {today}</p>
          </div>

          {/* Group Fee Collection */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #0d9488' }}>
              A. GROUP FEE COLLECTION (B.Ed, DM, ADPE, etc.)
            </h3>
            {report?.groupPayments && report.groupPayments.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Receipt No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Student Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Father Name</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Roll No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Program</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Sem</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '90px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.groupPayments.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.receiptNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.studentName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.fatherName}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.rollNumber}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{p.program}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{p.semester}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#ccfbf1', fontWeight: 'bold' }}>
                    <td colSpan={7} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Group Fees):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.groupTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No Group fee payments recorded today</p>
            )}
          </div>

          {/* Other Income */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #7c3aed' }}>
              B. OTHER INCOME (Canteen, Library, Registration, etc.)
            </h3>
            {report?.otherIncome && report.otherIncome.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Reference</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '110px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.otherIncome.map((i, idx) => (
                    <tr key={i.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.description}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.category}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{i.referenceNumber || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {i.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#ede9fe', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Other Income):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.otherIncomeTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No other income recorded today</p>
            )}
          </div>

          {/* Expenses */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '8px 10px', margin: '0 0 5px 0', borderLeft: '4px solid #dc2626' }}>
              C. EXPENSES
            </h3>
            {report?.expenses && report.expenses.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', width: '35px', fontWeight: 'bold' }}>S#</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', fontWeight: 'bold' }}>Reference</th>
                    <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', width: '110px', fontWeight: 'bold' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((e, idx) => (
                    <tr key={e.id}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.description}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.category}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{e.referenceNumber || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Rs {e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#fee2e2', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Sub-Total (Expenses):</td>
                    <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right' }}>Rs {totals.expenseTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', padding: '10px', backgroundColor: '#f9fafb' }}>No expenses recorded today</p>
            )}
          </div>

          {/* Summary Box */}
          <div style={{ border: '2px solid #000', padding: '15px', marginTop: '25px', backgroundColor: '#f0fdfa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px', textDecoration: 'underline' }}>
              GROUP DAILY FINANCIAL SUMMARY
            </h3>
            <table style={{ width: '60%', margin: '0 auto', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '5px 0' }}>A. Group Fee Collection</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>Rs {totals.groupTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0' }}>B. Other Income</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>Rs {totals.otherIncomeTotal.toLocaleString()}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #000' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>TOTAL INCOME (A+B)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#0d9488' }}>Rs {totals.groupTotalIncome.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0', color: '#dc2626' }}>C. Less: Total Expenses</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>Rs {totals.expenseTotal.toLocaleString()}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #000', backgroundColor: '#ccfbf1' }}>
                  <td style={{ padding: '10px 5px', fontSize: '14px', fontWeight: 'bold' }}>NET CASH BALANCE</td>
                  <td style={{ padding: '10px 5px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>Rs {totals.groupBalance.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Section */}
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Prepared By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Accountant</div>
            </div>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Verified By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Senior Accountant</div>
            </div>
            <div style={{ textAlign: 'center', width: '25%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>Approved By</div>
              <div style={{ fontSize: '9px', color: '#666' }}>Principal</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            This is a computer-generated report. Printed on {new Date().toLocaleString('en-GB')}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { 
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: #fff !important;
          }
          @page { 
            size: A4 portrait; 
            margin: 15mm; 
          }
          .print\\:block {
            display: block !important;
            visibility: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </>
  );
}
