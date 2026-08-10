import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { SalaryType, InsertSalaryType } from "@shared/schema";
import { insertSalaryTypeSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function SalaryTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSalaryType, setSelectedSalaryType] = useState<SalaryType | null>(null);

  const { data: salaryTypes, isLoading } = useQuery<SalaryType[]>({
    queryKey: ['/api/payroll/types'],
  });

  const canEditDelete = user?.role === 'admin';

  const form = useForm<Partial<InsertSalaryType>>({
    resolver: zodResolver(insertSalaryTypeSchema.partial()),
    defaultValues: {},
  });

  const createForm = useForm<InsertSalaryType>({
    resolver: zodResolver(insertSalaryTypeSchema),
    defaultValues: {
      name: "",
      type: "fixed",
      amount: "0",
      description: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSalaryType) => {
      return await apiRequest('POST', '/api/payroll/types', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Salary type created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/types'] });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create salary type",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertSalaryType>) => {
      if (!selectedSalaryType) throw new Error("No salary type selected");
      return await apiRequest('PUT', `/api/payroll/types/${selectedSalaryType.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Salary type updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/types'] });
      setEditDialogOpen(false);
      setSelectedSalaryType(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update salary type",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/payroll/types/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Salary type deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/types'] });
      setDeleteDialogOpen(false);
      setSelectedSalaryType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete salary type",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (salaryType: SalaryType) => {
    setSelectedSalaryType(salaryType);
    form.reset({
      name: salaryType.name,
      type: (salaryType.type ?? "fixed") as "fixed" | "per_lecture",
      amount: salaryType.amount,
      description: salaryType.description ?? "",
      isActive: salaryType.isActive ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (salaryType: SalaryType) => {
    setSelectedSalaryType(salaryType);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: Partial<InsertSalaryType>) => {
    updateMutation.mutate(data);
  };

  const confirmDelete = () => {
    if (selectedSalaryType) {
      deleteMutation.mutate(selectedSalaryType.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-salary-types">Salary Types</h1>
          <p className="text-muted-foreground">Define salary structures and rates</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-salary-type">
          <Plus className="h-4 w-4 mr-2" />
          Add Salary Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Configurations</CardTitle>
          <CardDescription>All defined salary types and rates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : !salaryTypes || salaryTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No salary types defined</p>
              <p className="text-sm text-muted-foreground mt-1">Create salary structures for permanent and visiting staff</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryTypes.map((salary) => (
                    <TableRow key={salary.id} className="hover-elevate" data-testid={`row-salary-${salary.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${salary.id}`}>{salary.name}</TableCell>
                      <TableCell>
                        <Badge variant={salary.type === 'fixed' ? 'default' : 'secondary'}>
                          {salary.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-amount-${salary.id}`}>
                        Rs {parseFloat(salary.amount).toLocaleString()}
                        {salary.type === 'per_lecture' && '/lecture'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{salary.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={salary.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${salary.id}`}>
                          {salary.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEditDelete && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Edit" 
                              onClick={() => handleEdit(salary)}
                              data-testid={`button-edit-${salary.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Delete" 
                              onClick={() => handleDelete(salary)}
                              data-testid={`button-delete-${salary.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Salary Type Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Salary Type</DialogTitle>
            <DialogDescription>Create a new salary type for staff members</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Senior Lecturer" data-testid="create-input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "fixed"}>
                      <FormControl>
                        <SelectTrigger data-testid="create-select-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Monthly</SelectItem>
                        <SelectItem value="per_lecture">Per Lecture</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Rs)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        placeholder="e.g., 50000"
                        data-testid="create-input-amount" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} placeholder="Description of this salary type" data-testid="create-input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this salary type
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="create-switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="create-button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="create-button-save"
                >
                  {createMutation.isPending ? "Creating..." : "Create Salary Type"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Salary Type Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Salary Type</DialogTitle>
            <DialogDescription>Update salary type information</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Monthly</SelectItem>
                        <SelectItem value="per_lecture">Per Lecture</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        value={field.value ?? ""} 
                        data-testid="input-amount" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this salary type
                      </div>
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the salary type "{selectedSalaryType?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
