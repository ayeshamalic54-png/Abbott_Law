import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintView } from "@/components/print-view";

export default function InquiriesListPrint() {
  const [, setLocation] = useLocation();
  
  const { data: inquiries, isLoading } = useQuery<any[]>({
    queryKey: ['/api/inquiries'],
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="print:hidden flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/admissions/inquiries')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <PrintView
        title="Admission Inquiries"
        subtitle={`All admission inquiries (Total: ${inquiries?.length || 0})`}
        reportType="Admission Inquiries Report"
        reportData={inquiries}
        college="group"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries?.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell>{inquiry.inquiryDate ? new Date(inquiry.inquiryDate).toLocaleDateString('en-PK') : 'N/A'}</TableCell>
                <TableCell className="font-medium">{inquiry.fullName}</TableCell>
                <TableCell>{inquiry.phone || 'N/A'}</TableCell>
                <TableCell className="text-sm">{inquiry.email || 'N/A'}</TableCell>
                <TableCell>{inquiry.program || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={(inquiry.status === 'admitted' ? 'default' : 'secondary') as any}>
                    {inquiry.status || 'pending'}
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
