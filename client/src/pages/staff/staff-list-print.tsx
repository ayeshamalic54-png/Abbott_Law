import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintView } from "@/components/print-view";
import type { Staff } from "@shared/schema";

export default function StaffListPrint() {
  const [, setLocation] = useLocation();
  
  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'default',
      inactive: 'secondary',
      retired: 'outline'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="print:hidden flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/staff')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <PrintView
        title="Staff Directory"
        subtitle={`Complete list of faculty and staff (Total: ${staff?.length || 0})`}
        reportType="Staff List Report"
        reportData={staff}
        college="law"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Employment Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-mono text-sm">
                  {member.employeeId}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{member.fullName}</p>
                </TableCell>
                <TableCell>{member.designation || 'N/A'}</TableCell>
                <TableCell>{member.employmentType || 'N/A'}</TableCell>
                <TableCell className="text-sm">{member.email}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(member.status || 'active') as any}>
                    {member.status || 'active'}
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
