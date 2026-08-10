import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { ExpenseHead, InsertExpenseHead } from "@shared/schema";
import { insertExpenseHeadSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ExpenseHeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHead, setSelectedHead] = useState<ExpenseHead | null>(null);
  
  const { data: heads, isLoading } = useQuery<ExpenseHead[]>({
    queryKey: ['/api/accounts/expense-heads'],
  });

  const canEditDelete = user?.role === 'admin' || user?.role === 'accountant';

  const addForm = useForm<InsertExpenseHead>({
    resolver: zodResolver(insertExpenseHeadSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<Partial<InsertExpenseHead>>({
    resolver: zodResolver(insertExpenseHeadSchema.partial()),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExpenseHead) => {
      return await apiRequest('POST', '/api/accounts/expense-heads', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense head created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/expense-heads'] });
      setAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense head",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertExpenseHead>) => {
      if (!selectedHead) throw new Error("No expense head selected");
      return await apiRequest('PUT', `/api/accounts/expense-heads/${selectedHead.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense head updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/expense-heads'] });
      setEditDialogOpen(false);
      setSelectedHead(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense head",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/accounts/expense-heads/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense head deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/expense-heads'] });
      setDeleteDialogOpen(false);
      setSelectedHead(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense head",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (head: ExpenseHead) => {
    setSelectedHead(head);
    editForm.reset({
      name: head.name,
      description: head.description ?? "",
      isActive: head.isActive ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (head: ExpenseHead) => {
    setSelectedHead(head);
    setDeleteDialogOpen(true);
  };

  const onAddSubmit = (data: InsertExpenseHead) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: Partial<InsertExpenseHead>) => {
    updateMutation.mutate(data);
  };

  const confirmDelete = () => {
    if (selectedHead) {
      deleteMutation.mutate(selectedHead.id);
    }
  };

  const exportToCSV = () => {
    if (!heads) return;
    const headers = ["Name", "Description", "Status"];
    const csvData = heads.map(h => [
      h.name,
      h.description || "",
      h.isActive ? "Active" : "Inactive"
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-heads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-expense-heads">
            Expense Heads
          </h1>
          <p className="text-muted-foreground mt-1">Manage expense categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canEditDelete && (
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add">
              <Plus className="h-4 w-4 mr-2" />
              Add Head
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expense Heads</CardTitle>
          <CardDescription>List of expense categories for accounting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heads && heads.length > 0 ? (
                  heads.map((head) => (
                    <TableRow key={head.id}>
                      <TableCell className="font-medium">{head.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{head.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={head.isActive ? "default" : "secondary"}>
                          {head.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canEditDelete && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEdit(head)}
                              data-testid={`button-edit-${head.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(head)}
                              data-testid={`button-delete-${head.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEditDelete ? 4 : 3} className="text-center text-muted-foreground">
                      No expense heads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense Head</DialogTitle>
            <DialogDescription>Create a new expense category</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Salaries" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this expense category" 
                        {...field} 
                        value={field.value ?? ""}
                        data-testid="input-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-add">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add">
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense Head</DialogTitle>
            <DialogDescription>Update expense category details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Salaries" {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this expense category" 
                        {...field} 
                        value={field.value ?? ""}
                        data-testid="input-edit-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense head "{selectedHead?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
