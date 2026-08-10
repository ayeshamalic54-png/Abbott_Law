import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CirculationReport() {
  const circulations = [
    { id: 1, bookId: "BK-001", bookTitle: "Constitutional Law", studentRoll: "2025-LLB-001", studentName: "Ahmad Khan", issueDate: "2025-10-15", returnDate: "2025-11-15", status: "Issued" },
    { id: 2, bookId: "BK-002", bookTitle: "Criminal Law", studentRoll: "2025-LLB-002", studentName: "Fatima Ali", issueDate: "2025-10-20", returnDate: "2025-11-01", status: "Returned" },
    { id: 3, bookId: "BK-003", bookTitle: "Civil Procedure", studentRoll: "2025-LLB-003", studentName: "Hassan Raza", issueDate: "2025-10-25", returnDate: "2025-11-25", status: "Overdue" },
  ];

  const exportToCSV = () => {
    const headers = ["Book ID", "Book Title", "Roll Number", "Student Name", "Issue Date", "Return Date", "Status"];
    const csvData = circulations.map(c => [
      c.bookId,
      c.bookTitle,
      c.studentRoll,
      c.studentName,
      c.issueDate,
      c.returnDate,
      c.status
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-circulation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const saveReport = () => {
    const reportData = {
      reportType: "Library Circulation Report",
      generatedAt: new Date().toISOString(),
      data: circulations
    };
    localStorage.setItem(`circulation-report-${Date.now()}`, JSON.stringify(reportData));
    alert("Report saved successfully!");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-circulation-report">
            <BookOpen className="h-8 w-8 text-primary" />
            Library Circulation Report
          </h1>
          <p className="text-muted-foreground mt-1">Book issue and return records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveReport} variant="outline" data-testid="button-save">
            Save Report
          </Button>
          <Button onClick={exportToCSV} variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => window.print()} variant="outline" data-testid="button-print">
            <FileText className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {circulations.filter(c => c.status === 'Issued').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {circulations.filter(c => c.status === 'Returned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {circulations.filter(c => c.status === 'Overdue').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{circulations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Circulation Details</CardTitle>
          <CardDescription>Complete record of book circulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book ID</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {circulations.map((circ) => (
                  <TableRow key={circ.id}>
                    <TableCell className="font-medium">{circ.bookId}</TableCell>
                    <TableCell>{circ.bookTitle}</TableCell>
                    <TableCell>{circ.studentRoll}</TableCell>
                    <TableCell>{circ.studentName}</TableCell>
                    <TableCell>{circ.issueDate}</TableCell>
                    <TableCell>{circ.returnDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        circ.status === 'Returned' ? 'default' : 
                        circ.status === 'Overdue' ? 'destructive' : 
                        'secondary'
                      }>
                        {circ.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
