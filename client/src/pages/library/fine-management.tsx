import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const fineSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().optional(),
});

type LibraryFine = {
  id: string;
  issueId: string;
  amount: string;
  reason: string | null;
  status: 'pending' | 'paid';
  paidDate: string | null;
  createdAt: string;
};

type LibraryIssue = {
  id: string;
  bookId: string;
  borrowerType: 'student' | 'staff';
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'issued' | 'returned' | 'overdue';
};

export default function FineManagement() {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);

  const { data: fines = [], isLoading: finesLoading } = useQuery<LibraryFine[]>({
    queryKey: ['/api/library/fines'],
  });

  const { data: issues = [] } = useQuery<LibraryIssue[]>({
    queryKey: ['/api/library/issues'],
  });

  const form = useForm<z.infer<typeof fineSchema>>({
    resolver: zodResolver(fineSchema),
    defaultValues: {
      issueId: "",
      amount: "",
      reason: "",
    },
  });

  const createFineMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fineSchema>) => {
      return await apiRequest('POST', '/api/library/fines', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/fines'] });
      toast({ title: "Success", description: "Fine created successfully" });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create fine", variant: "destructive" });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/library/fines/${id}`, {
        status: 'paid',
        paidDate: format(new Date(), 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/fines'] });
      toast({ title: "Success", description: "Fine marked as paid" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update fine", variant: "destructive" });
    },
  });

  const overdueIssues = issues.filter(i => i.status === 'overdue');
  const totalPending = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalCollected = fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Library Fine Management</h1>
          <p className="text-muted-foreground">Track and manage library fines for overdue books</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-overdue-count">{overdueIssues.length}</div>
            <p className="text-xs text-muted-foreground">Books past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-fines">Rs {totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{fines.filter(f => f.status === 'pending').length} unpaid fines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Fines</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-collected-fines">Rs {totalCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{fines.filter(f => f.status === 'paid').length} paid fines</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <div>
            <CardTitle>Library Fines</CardTitle>
            <CardDescription>Manage fines for overdue library books</CardDescription>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-fine">
                <DollarSign className="h-4 w-4 mr-2" />
                Add Fine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Library Fine</DialogTitle>
                <DialogDescription>
                  Add a fine for an overdue or damaged book
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createFineMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="issueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book Issue</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Issue ID" data-testid="input-issue-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fine Amount (Rs)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-fine-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 7 days overdue" data-testid="input-fine-reason" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createFineMutation.isPending} data-testid="button-save-fine">
                    {createFineMutation.isPending ? "Creating..." : "Create Fine"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {finesLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading fines...</p>
          ) : fines.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No fines recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id} data-testid={`row-fine-${fine.id}`}>
                    <TableCell className="font-mono text-sm">{fine.issueId.substring(0, 8)}</TableCell>
                    <TableCell className="font-medium">Rs {parseFloat(fine.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{fine.reason || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={fine.status === 'paid' ? 'default' : 'destructive'}>
                        {fine.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(fine.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {fine.paidDate ? format(new Date(fine.paidDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {fine.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => markPaidMutation.mutate(fine.id)}
                          disabled={markPaidMutation.isPending}
                          data-testid={`button-mark-paid-${fine.id}`}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
