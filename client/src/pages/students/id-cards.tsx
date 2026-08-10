import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Printer, CreditCard, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Student {
  id: string;
  rollNumber: string;
  fullName: string;
  fatherName: string;
  program: string;
  semester: number;
  phone: string;
  email: string;
  photoUrl: string;
  status: string;
  enrollmentDate: string;
}

export default function StudentIDCards() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: programs } = useQuery<any[]>({
    queryKey: ['/api/programs'],
  });

  const filteredStudents = students?.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === "all" || s.program === selectedProgram;
    const isActive = !s.status || s.status.toLowerCase() === 'active';
    return matchesSearch && matchesProgram && isActive;
  }) || [];

  const toggleStudent = (id: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const printCards = () => {
    window.print();
  };

  const selectedStudentsList = students?.filter(s => selectedStudents.has(s.id)) || [];

  const getValidityDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    return `Dec ${year + 1}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between no-print">
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-id-cards">
              <CreditCard className="h-8 w-8 text-primary" />
              Student ID Cards
            </h1>
            <p className="text-muted-foreground mt-1">Generate and print student identity cards</p>
          </div>
        </div>
        <Button 
          onClick={printCards}
          disabled={selectedStudents.size === 0}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
          data-testid="button-print-cards"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Selected ({selectedStudents.size})
        </Button>
      </div>

      <div className="no-print">
        <Card>
          <CardHeader>
            <CardTitle>Select Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-64" data-testid="select-program">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={selectAll} data-testid="button-select-all">
                {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudents.has(student.id) 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleStudent(student.id)}
                  data-testid={`student-select-${student.id}`}
                >
                  <Checkbox 
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedStudents.size > 0 && (
        <div className="no-print">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {selectedStudents.size} ID card(s) will be printed. Click "Print Selected" to print.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div ref={printRef} className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            .id-card {
              width: 85.6mm;
              height: 53.98mm;
              border: 2px solid #1e3a5f;
              border-radius: 8px;
              page-break-inside: avoid;
              background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
              position: relative;
              overflow: hidden;
              margin: 5mm;
              display: inline-block;
              vertical-align: top;
            }
            .id-card-header {
              background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
              color: white;
              padding: 6px 10px;
              text-align: center;
            }
            .id-card-body {
              padding: 8px 10px;
              display: flex;
              gap: 10px;
            }
            .id-card-photo {
              width: 25mm;
              height: 30mm;
              border: 2px solid #1e3a5f;
              border-radius: 4px;
              background: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .id-card-photo img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .id-card-info {
              flex: 1;
              font-size: 8pt;
              line-height: 1.4;
            }
            .id-card-info .label {
              color: #64748b;
              font-size: 7pt;
            }
            .id-card-info .value {
              font-weight: 600;
              color: #1e293b;
            }
            .id-card-footer {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: #1e3a5f;
              color: white;
              padding: 4px 10px;
              font-size: 7pt;
              display: flex;
              justify-content: space-between;
            }
          }
        `}</style>
        
        {selectedStudentsList.map((student) => (
          <div key={student.id} className="id-card">
            <div className="id-card-header">
              <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>ABBOTT LAW COLLEGE</div>
              <div style={{ fontSize: '7pt' }}>Mansehra, Khyber Pakhtunkhwa</div>
            </div>
            <div className="id-card-body">
              <div className="id-card-photo">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.fullName} />
                ) : (
                  <User style={{ width: '20mm', height: '20mm', color: '#94a3b8' }} />
                )}
              </div>
              <div className="id-card-info">
                <div>
                  <span className="label">Name:</span>
                  <div className="value">{student.fullName}</div>
                </div>
                <div>
                  <span className="label">Father:</span>
                  <div className="value">{student.fatherName || 'N/A'}</div>
                </div>
                <div>
                  <span className="label">Roll No:</span>
                  <div className="value">{student.rollNumber}</div>
                </div>
                <div>
                  <span className="label">Program:</span>
                  <div className="value">{student.program || 'N/A'}</div>
                </div>
                <div>
                  <span className="label">Semester:</span>
                  <div className="value">{student.semester || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="id-card-footer">
              <span>Valid Till: {getValidityDate()}</span>
              <span>Emergency: {student.phone || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedStudentsList.slice(0, 6).map((student) => (
          <Card key={student.id} className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-3 text-center">
              <h3 className="font-bold text-lg">ABBOTT LAW COLLEGE</h3>
              <p className="text-xs opacity-90">Mansehra, Khyber Pakhtunkhwa</p>
            </div>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-muted rounded border-2 border-blue-900 flex items-center justify-center overflow-hidden">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Name:</span>
                    <p className="font-semibold">{student.fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Father:</span>
                    <p className="font-medium">{student.fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Roll No:</span>
                    <p className="font-semibold text-primary">{student.rollNumber}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground text-xs">Program:</span>
                      <p className="font-medium text-xs">{student.program || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Sem:</span>
                      <p className="font-medium">{student.semester || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>Valid: {getValidityDate()}</span>
                <span>{student.phone || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {selectedStudentsList.length > 6 && (
          <Card className="flex items-center justify-center bg-muted">
            <CardContent className="text-center py-8">
              <p className="text-2xl font-bold text-primary">+{selectedStudentsList.length - 6}</p>
              <p className="text-muted-foreground">more cards</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
