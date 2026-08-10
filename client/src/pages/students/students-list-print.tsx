import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { PrintView } from "@/components/print-view";
import type { Student } from "@shared/schema";

export default function StudentsListPrint() {
  
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const colors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      graduated: 'outline',
      suspended: 'destructive'
    };
    return colors[status] || 'secondary';
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="print-page">
      <PrintView
        title="Students Directory"
        subtitle={`Complete list of enrolled students (Total: ${students?.length || 0})`}
        reportType="Students List Report"
        reportData={students}
        college="group"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.No</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Father's Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students?.map((student, index) => (
              <TableRow key={student.id}>
                <TableCell className="font-bold text-center">{index + 1}</TableCell>
                <TableCell className="font-mono text-sm">
                  {student.rollNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground print-hide">{student.email}</p>
                  </div>
                </TableCell>
                <TableCell>{student.fatherName || 'N/A'}</TableCell>
                <TableCell>{student.program || 'N/A'}</TableCell>
                <TableCell>{student.semester || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(student.status || 'active')}>
                    {student.status || 'active'}
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
