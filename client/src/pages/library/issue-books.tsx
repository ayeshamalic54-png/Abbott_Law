import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IssueBooks() {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      studentRoll: "",
      bookId: "",
      issueDate: new Date().toISOString().split('T')[0],
      returnDate: "",
    },
  });

  const onSubmit = (data: any) => {
    toast({
      title: "Success!",
      description: "Book issued successfully",
    });
    form.reset();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-issue-books">
          <BookOpen className="h-8 w-8 text-primary" />
          Issue Books
        </h1>
        <p className="text-muted-foreground mt-1">Issue books to students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Issue Form</CardTitle>
          <CardDescription>Enter book issue details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="studentRoll"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Roll Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter roll number" {...field} data-testid="input-roll-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Scan or enter book ID" {...field} data-testid="input-book-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-issue-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Return Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-return-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                  data-testid="button-submit"
                >
                  Issue Book
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()} 
                  className="border-2"
                  data-testid="button-reset"
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
