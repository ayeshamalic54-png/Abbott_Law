import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrintView } from "@/components/print-view";
import type { Student } from "@shared/schema";

export default function AllAdmissionsPrint() {
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <PrintView
        title="All Student Admissions"
        subtitle="Complete Student Directory"
        reportType="Admissions Report"
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
                <TableCell className="font-mono font-medium">{student.rollNumber}</TableCell>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>{student.fatherName || 'N/A'}</TableCell>
                <TableCell>{student.program || 'N/A'}</TableCell>
                <TableCell>{student.semester || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={(student.status === 'active' ? 'default' : 'secondary') as any}>
                    {student.status || 'N/A'}
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
