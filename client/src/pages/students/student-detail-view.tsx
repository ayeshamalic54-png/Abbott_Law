import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import type { Student } from "@shared/schema";

export default function StudentDetailView() {
  const [match, params] = useRoute("/students/view/:id");
  const [, setLocation] = useLocation();
  const studentId = params?.id;

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Student not found</p>
          <Button variant="ghost" onClick={() => setLocation('/students')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Screen-only controls */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/students')}
            className="hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-student-detail">
              Student Details
            </h1>
            <p className="text-muted-foreground mt-1">View complete student information</p>
          </div>
        </div>
        <Button
          onClick={handlePrint}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg"
          data-testid="button-print"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Print-friendly content */}
      <div className="admission-print-container">
        {/* Print Header */}
        <div className="print-only print-header">
          <h1>ABBOTT LAW COLLEGE</h1>
          <p>Mansehra Road, Abbottabad, Pakistan</p>
          <p>Student Admission Report</p>
        </div>

        {/* Photo and Basic Info Section */}
        <div className="admission-print-header">
          <div className="admission-photo-box">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} />
            ) : (
              <div className="text-xs text-center text-muted-foreground">No Photo</div>
            )}
          </div>
          <div className="admission-basic-info">
            <table>
              <tbody>
                <tr>
                  <td>Roll Number:</td>
                  <td><strong>{student.rollNumber}</strong></td>
                </tr>
                <tr>
                  <td>Full Name:</td>
                  <td><strong>{student.fullName}</strong></td>
                </tr>
                <tr>
                  <td>Father's Name:</td>
                  <td>{student.fatherName || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Program:</td>
                  <td>{student.program || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="admission-field-row">
              <div className="admission-field">
                <div className="admission-field-label">Date of Birth</div>
                <div className="admission-field-value">{student.dateOfBirth || 'N/A'}</div>
              </div>
              <div className="admission-field">
                <div className="admission-field-label">Gender</div>
                <div className="admission-field-value">{student.gender || 'N/A'}</div>
              </div>
            </div>
            <div className="admission-field-row">
              <div className="admission-field">
                <div className="admission-field-label">Phone Number</div>
                <div className="admission-field-value">{student.phone || 'N/A'}</div>
              </div>
              <div className="admission-field">
                <div className="admission-field-label">Email Address</div>
                <div className="admission-field-value">{student.email || 'N/A'}</div>
              </div>
            </div>
            <div className="admission-field-row">
              <div className="admission-field" style={{flex: 1, paddingRight: 0}}>
                <div className="admission-field-label">Complete Address</div>
                <div className="admission-field-value">{student.address || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information Section */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Academic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="admission-field-row">
              <div className="admission-field">
                <div className="admission-field-label">Program</div>
                <div className="admission-field-value">{student.program || 'N/A'}</div>
              </div>
              <div className="admission-field">
                <div className="admission-field-label">Semester</div>
                <div className="admission-field-value">{student.semester || 'N/A'}</div>
              </div>
            </div>
            <div className="admission-field-row">
              <div className="admission-field">
                <div className="admission-field-label">Section</div>
                <div className="admission-field-value">{student.section || 'N/A'}</div>
              </div>
              <div className="admission-field">
                <div className="admission-field-label">Status</div>
                <div className="admission-field-value">{student.status || 'Active'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section - Print Only */}
        <div className="print-only signature-section">
          <div className="signature-box">
            <div className="signature-line">Student Signature</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Parent/Guardian Signature</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Authorized Signature</div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="print-only print-footer">
          <p>Generated on: {new Date().toLocaleDateString()} | Abbott Law College Management System</p>
        </div>
      </div>
    </div>
  );
}
