import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrintView } from "@/components/print-view";
import type { Program } from "@shared/schema";

export default function ManageProgramsPrint() {
  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Separate programs by category
  const llbPrograms = programs?.filter(p => 
    p.category === 'llb' || 
    p.name.toLowerCase().includes('llb') || 
    p.name.toLowerCase().includes('llm')
  ) || [];
  
  const groupPrograms = programs?.filter(p => 
    p.category === 'group' || 
    (!p.name.toLowerCase().includes('llb') && !p.name.toLowerCase().includes('llm'))
  ) || [];

  const ProgramTable = ({ programList }: { programList: Program[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Program Name</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Total Semesters</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programList.map((program) => (
          <TableRow key={program.id}>
            <TableCell className="font-medium">{program.name}</TableCell>
            <TableCell>{program.durationYears} Years</TableCell>
            <TableCell>{program.totalSemesters}</TableCell>
            <TableCell className="text-sm">{program.description || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={(program.isActive ? 'default' : 'secondary') as any}>
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8">
      {/* Law Programs Section */}
      {llbPrograms.length > 0 && (
        <div style={{ pageBreakAfter: 'always' }}>
          <PrintView
            title="Law Programs"
            subtitle="Abbott Law College"
            reportType="Law Programs Report"
            reportData={llbPrograms}
            college="law"
          >
            <ProgramTable programList={llbPrograms} />
          </PrintView>
        </div>
      )}

      {/* Group Programs Section */}
      {groupPrograms.length > 0 && (
        <div style={{ pageBreakBefore: 'always' }}>
          <PrintView
            title="Education Programs"
            subtitle="Abbott Group of Colleges"
            reportType="Education Programs Report"
            reportData={groupPrograms}
            college="group"
          >
            <ProgramTable programList={groupPrograms} />
          </PrintView>
        </div>
      )}
    </div>
  );
}
