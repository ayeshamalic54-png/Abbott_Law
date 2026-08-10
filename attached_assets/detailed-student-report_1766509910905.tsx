import { Card } from "@/components/ui/card";

interface DetailedStudentReportProps {
  students: any[];
  reportType: string;
  reportDate: string;
  additionalInfo?: (student: any) => React.ReactNode;
}

export function DetailedStudentReport({ students, reportType, reportDate, additionalInfo }: DetailedStudentReportProps) {
  return (
    <div className="detailed-report">
      {/* College Header - Only shows on print */}
      <div className="college-header hidden print:block">
        <h1 className="text-4xl font-bold">Abbott Law College</h1>
        <p className="text-lg mt-2">Mansehra, Khyber Pakhtunkhwa</p>
        <p className="text-sm mt-1">Affiliated with Hazara University</p>
      </div>

      {/* Report Metadata */}
      <div className="report-meta">
        <h2 className="text-2xl font-bold text-center mb-4">{reportType}</h2>
        <div className="flex justify-between text-sm mb-6">
          <span>Report Date: {reportDate}</span>
          <span>Total Students: {students.length}</span>
        </div>
      </div>

      {/* Detailed Student Cards */}
      <div className="space-y-6">
        {students.map((student, index) => (
          <Card key={student.id || index} className="p-6 avoid-break border-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Identity */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                  Student Information
                </h3>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="font-semibold w-32">Name:</span>
                    <span className="flex-1">{student.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Roll Number:</span>
                    <span className="flex-1">{student.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Father Name:</span>
                    <span className="flex-1">{student.fatherName || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Date of Birth:</span>
                    <span className="flex-1">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Gender:</span>
                    <span className="flex-1 capitalize">{student.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                  Academic Details
                </h3>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="font-semibold w-32">Program:</span>
                    <span className="flex-1">{student.program || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Semester:</span>
                    <span className="flex-1">{student.semester ? `Semester ${student.semester}` : 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Section:</span>
                    <span className="flex-1">{student.section || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Status:</span>
                    <span className="flex-1 capitalize">{student.status || 'Active'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Enrollment:</span>
                    <span className="flex-1">{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary border-b-2 border-primary pb-2">
                  Contact Information
                </h3>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="font-semibold w-32">Phone:</span>
                    <span className="flex-1">{student.phone || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Email:</span>
                    <span className="flex-1">{student.email || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Address:</span>
                    <span className="flex-1">{student.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Additional Report-Specific Information */}
              {additionalInfo && (
                <div className="space-y-2">
                  {additionalInfo(student)}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 text-center text-sm text-muted-foreground">
        <p>Abbott Law College - Official Document</p>
        <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
