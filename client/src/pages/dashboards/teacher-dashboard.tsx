import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Calendar, FileText, Users, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

type Student = {
  id: string;
  fullName: string;
  program: string;
  status: string;
};

type Course = {
  id: string;
  name: string;
  code: string;
  program: string;
};

type Attendance = {
  id: string;
  date: string;
  status: string;
};

export default function TeacherDashboard() {
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/students'],
  });

  const activeStudents = students.filter(s => s.status?.toLowerCase() === 'active').length;
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;

  const quickActions = [
    { label: "Mark Attendance", href: "/attendance/students", icon: Calendar, color: "from-blue-500 to-cyan-600", description: "Take student attendance" },
    { label: "Add Grades", href: "/grades", icon: FileText, color: "from-green-500 to-emerald-600", description: "Enter student grades" },
    { label: "View Students", href: "/students", icon: Users, color: "from-purple-500 to-pink-600", description: "View student list (read-only)" },
    { label: "View Courses", href: "/courses", icon: BookOpen, color: "from-orange-500 to-red-600", description: "View course list" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" data-testid="heading-dashboard">
            Teacher Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Your teaching overview - View data and manage attendance/grades</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <p className="text-xs text-muted-foreground">{activeStudents} active</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentToday}</div>
              <p className="text-xs text-muted-foreground">Out of {activeStudents} students</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600">{new Date().toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="font-heading text-slate-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              As a teacher, you can mark attendance and add grades. Other data is view-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className={`group h-auto w-full flex-col gap-2 py-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${action.color} bg-clip-padding border-transparent text-white hover:opacity-90`} data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Recent Students
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Latest enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                  No students enrolled yet
                </div>
              ) : (
                <div className="space-y-2">
                  {students.slice(0, 5).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div>
                        <p className="font-medium text-sm">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.program}</p>
                      </div>
                      <Badge variant={student.status?.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                        {student.status || 'Active'}
                      </Badge>
                    </div>
                  ))}
                  {students.length > 5 && (
                    <Link href="/students">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View all {students.length} students
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Courses
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Available courses</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                  No courses available
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div>
                        <p className="font-medium text-sm">{course.name}</p>
                        <p className="text-xs text-muted-foreground">{course.code} - {course.program}</p>
                      </div>
                    </div>
                  ))}
                  {courses.length > 5 && (
                    <Link href="/courses">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View all {courses.length} courses
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Teacher Access Notice</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  As a teacher, you have read-only access to student and course information. 
                  You can mark attendance and enter grades for students. 
                  For other changes, please contact the administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
