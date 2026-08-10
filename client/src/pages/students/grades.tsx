import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

type Grade = {
  id: string;
  studentId: string;
  subject: string;
  semester: number;
  examType: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  createdAt: string;
};

export default function Grades() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ['/api/grades'],
  });

  // Filter grades for current student if student role
  const filteredGrades = isStudent 
    ? grades.filter(g => g.studentId === user?.id)
    : grades;

  // Group by semester
  const gradesBySemester = filteredGrades.reduce((acc, grade) => {
    const sem = grade.semester || 0;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(grade);
    return acc;
  }, {} as Record<number, Grade[]>);

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-500';
    const upperGrade = grade.toUpperCase();
    if (upperGrade.includes('A')) return 'bg-green-500';
    if (upperGrade.includes('B')) return 'bg-blue-500';
    if (upperGrade.includes('C')) return 'bg-yellow-500';
    if (upperGrade.includes('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const calculatePercentage = (obtained: number, total: number) => {
    if (!total || total === 0) return 0;
    return ((obtained / total) * 100).toFixed(2);
  };

  const printResults = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-grades">
              {isStudent ? 'My Grades' : 'Student Grades'}
            </h1>
            <p className="text-muted-foreground">View exam results and academic performance</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={printResults} data-testid="button-print-grades">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGrades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Grades Available</h3>
            <p className="text-muted-foreground">
              {isStudent 
                ? "Your exam results will appear here once they are published."
                : "No grades have been entered yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(gradesBySemester).sort((a, b) => Number(b) - Number(a)).map((semester) => {
            const semesterGrades = gradesBySemester[Number(semester)];
            const totalObtained = semesterGrades.reduce((sum, g) => sum + (g.obtainedMarks || 0), 0);
            const totalMax = semesterGrades.reduce((sum, g) => sum + (g.totalMarks || 0), 0);
            const semesterPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0';

            return (
              <Card key={semester}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Semester {semester || 'N/A'}
                    </CardTitle>
                    <Badge className={`${Number(semesterPercentage) >= 60 ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                      Overall: {semesterPercentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Subject</th>
                          <th className="text-left py-3 px-4 font-semibold">Exam Type</th>
                          <th className="text-center py-3 px-4 font-semibold">Obtained</th>
                          <th className="text-center py-3 px-4 font-semibold">Total</th>
                          <th className="text-center py-3 px-4 font-semibold">Percentage</th>
                          <th className="text-center py-3 px-4 font-semibold">Grade</th>
                          <th className="text-left py-3 px-4 font-semibold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semesterGrades.map((grade) => (
                          <tr 
                            key={grade.id} 
                            className="border-b hover-elevate"
                            data-testid={`grade-row-${grade.id}`}
                          >
                            <td className="py-3 px-4 font-medium">{grade.subject}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{grade.examType || 'N/A'}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-lg">
                              {grade.obtainedMarks || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-muted-foreground">
                              {grade.totalMarks || 0}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold">
                                {calculatePercentage(grade.obtainedMarks || 0, grade.totalMarks || 0)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={`${getGradeColor(grade.grade)} text-white font-bold`}>
                                {grade.grade || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {grade.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
