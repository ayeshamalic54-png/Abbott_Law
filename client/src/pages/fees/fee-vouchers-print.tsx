import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintView } from "@/components/print-view";
import type { FeeVoucher } from "@shared/schema";

export default function FeeVouchersPrint() {
  const [, setLocation] = useLocation();
  
  const { data: vouchers, isLoading } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fees/vouchers'],
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  const totalAmount = vouchers?.reduce((sum, v) => sum + Number(v.amount || 0), 0) || 0;
  const paidVouchers = vouchers?.filter(v => v.status === 'paid').length || 0;
  const pendingVouchers = vouchers?.filter(v => v.status === 'pending').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="print:hidden flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/fees/vouchers')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <PrintView
        title="Fee Vouchers Report"
        subtitle={`Total: ${vouchers?.length || 0} vouchers | Paid: ${paidVouchers} | Pending: ${pendingVouchers} | Total Amount: Rs ${totalAmount.toLocaleString()}`}
        reportType="Fee Vouchers Report"
        reportData={vouchers}
        college="group"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher Number</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers?.map((voucher) => (
              <TableRow key={voucher.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {voucher.voucherNumber}
                </TableCell>
                <TableCell>{voucher.studentId}</TableCell>
                <TableCell className="font-semibold">Rs {Number(voucher.amount).toLocaleString()}</TableCell>
                <TableCell>{voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(voucher.status || 'pending') as any}>
                    {voucher.status || 'pending'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PrintView>
    </div>
  );
}
