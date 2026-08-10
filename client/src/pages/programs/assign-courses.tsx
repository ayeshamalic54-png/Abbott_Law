import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, BookOpen, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Program = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  name: string;
  code: string;
  credits: number;
};

export default function AssignCourses() {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const handleAssign = () => {
    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Please select a program",
        variant: "destructive",
      });
      return;
    }

    if (selectedCourses.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one course",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Assigned ${selectedCourses.length} course(s) to the selected program`,
    });

    // Reset
    setSelectedCourses([]);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
          <Link2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-assign-courses">Assign Courses to Programs</h1>
          <p className="text-muted-foreground">Link courses with academic programs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Program</CardTitle>
          <CardDescription>Choose which program you want to assign courses to</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-full" data-testid="select-program">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map(program => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Courses ({courses.length})</CardTitle>
          <CardDescription>
            Select courses to assign to the program. 
            {selectedCourses.length > 0 && ` (${selectedCourses.length} selected)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No courses available</p>
              <p className="text-sm mt-1">Add courses first from the "Add Courses/Subjects" menu</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {courses.map(course => {
                const isSelected = selectedCourses.includes(course.id);
                return (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleCourse(course.id)}
                    data-testid={`course-card-${course.id}`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {course.code}
                            </Badge>
                            <Badge className="text-xs">{course.credits} Classes</Badge>
                          </div>
                          <h3 className="font-semibold">{course.name}</h3>
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProgram && selectedCourses.length > 0 && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleAssign} data-testid="button-assign">
            <Link2 className="h-4 w-4 mr-2" />
            Assign {selectedCourses.length} Course(s) to Program
          </Button>
        </div>
      )}
    </div>
  );
}
