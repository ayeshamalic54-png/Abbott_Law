import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintView } from "@/components/print-view";

export default function VisitorsListPrint() {
  const [, setLocation] = useLocation();
  
  const { data: visitors, isLoading } = useQuery<any[]>({
    queryKey: ['/api/visitors'],
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
          onClick={() => setLocation('/visitors')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <PrintView
        title="Visitors Log"
        subtitle={`Complete visitor records (Total: ${visitors?.length || 0})`}
        reportType="Visitors Log Report"
        reportData={visitors}
        college="group"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Visitor Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors?.map((visitor) => (
              <TableRow key={visitor.id}>
                <TableCell>{visitor.visitDate ? new Date(visitor.visitDate).toLocaleDateString('en-PK') : 'N/A'}</TableCell>
                <TableCell className="font-medium">{visitor.name}</TableCell>
                <TableCell>{visitor.phone || 'N/A'}</TableCell>
                <TableCell>{visitor.purpose || 'N/A'}</TableCell>
                <TableCell className="text-sm">{visitor.remarks || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PrintView>
    </div>
  );
}
