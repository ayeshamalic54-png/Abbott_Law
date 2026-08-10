import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { FeeStructure, Program } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeeStructureSchema, type InsertFeeStructure } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FeeStructurePage() {
  const [open, setOpen] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: feeStructures, isLoading } = useQuery<FeeStructure[]>({
    queryKey: ['/api/fees/structures'],
  });

  const { data: programs, isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const form = useForm<InsertFeeStructure>({
    resolver: zodResolver(insertFeeStructureSchema),
    defaultValues: {
      name: "",
      program: "",
      paymentType: "semester",
      amount: "0",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFeeStructure) => {
      if (editingFeeStructure) {
        return await apiRequest('PUT', `/api/fees/structures/${editingFeeStructure.id}`, data);
      } else {
        return await apiRequest('POST', '/api/fees/structures', data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingFeeStructure ? "Fee structure updated successfully" : "Fee structure created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/structures'] });
      setOpen(false);
      setEditingFeeStructure(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/fees/structures/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fee structure deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/structures'] });
      setDeleteDialogOpen(false);
      setFeeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setFeeToDelete(null);
    },
  });

  const onSubmit = (data: InsertFeeStructure) => {
    createMutation.mutate(data);
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFeeStructure(fee);
    form.reset({
      name: fee.name,
      program: fee.program || "",
      paymentType: fee.paymentType || "semester",
      semester: fee.semester || undefined,
      amount: fee.amount,
      isActive: fee.isActive,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setFeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (feeToDelete) {
      deleteMutation.mutate(feeToDelete);
    }
  };

  // Watch the selected program to determine available payment types
  const selectedProgram = form.watch("program");
  const isLLBProgram = selectedProgram?.toLowerCase().includes("llb");

  // Automatically set payment type to semester for group programs
  useEffect(() => {
    if (selectedProgram && !isLLBProgram) {
      form.setValue("paymentType", "semester");
    }
  }, [selectedProgram, isLLBProgram, form]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-fee-structure">Fee Structure</h1>
          <p className="text-muted-foreground">Manage fee categories and rates</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingFeeStructure(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-fee">
              <Plus className="h-4 w-4 mr-2" />
              Add Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFeeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
              <DialogDescription>
                {editingFeeStructure ? 'Update the fee structure details' : 'Create a new fee category'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tuition Fee" {...field} data-testid="input-fee-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="program"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined} disabled={programsLoading}>
                        <FormControl>
                          <SelectTrigger data-testid="select-program">
                            <SelectValue placeholder={programsLoading ? "Loading programs..." : "Select program"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs?.filter(p => p.isActive).map((program) => (
                            <SelectItem key={program.id} value={program.name}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || "semester"}
                        disabled={!isLLBProgram && selectedProgram !== ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-type">
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLLBProgram && (
                            <SelectItem value="monthly">Monthly (Pay every month)</SelectItem>
                          )}
                          <SelectItem value="semester">Semester (Pay per semester)</SelectItem>
                        </SelectContent>
                      </Select>
                      {!isLLBProgram && selectedProgram && (
                        <p className="text-xs text-muted-foreground">Group programs only support semester payment</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-semester"
                        />
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
                      <FormLabel>Amount (Rs) *</FormLabel>
                      <FormControl>
                        <Input placeholder="10000" {...field} data-testid="input-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? (editingFeeStructure ? "Updating..." : "Creating...") : (editingFeeStructure ? "Update" : "Create")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Categories</CardTitle>
          <CardDescription>All configured fee structures</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : !feeStructures || feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No fee structures defined</p>
              <Button variant="ghost" onClick={() => setOpen(true)} className="mt-2">
                Create your first fee structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee) => (
                    <TableRow key={fee.id} className="hover-elevate" data-testid={`row-fee-${fee.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${fee.id}`}>{fee.name}</TableCell>
                      <TableCell>{fee.program || 'All Programs'}</TableCell>
                      <TableCell>
                        <Badge variant={fee.paymentType === 'monthly' ? 'default' : 'secondary'}>
                          {fee.paymentType === 'monthly' ? 'Monthly' : 'Semester'}
                        </Badge>
                      </TableCell>
                      <TableCell>{fee.semester || 'All Semesters'}</TableCell>
                      <TableCell className="font-mono" data-testid={`text-amount-${fee.id}`}>
                        Rs {parseFloat(fee.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${fee.id}`}>
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Edit" 
                            onClick={() => handleEdit(fee)}
                            data-testid={`button-edit-${fee.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete" 
                            onClick={() => handleDelete(fee.id)}
                            data-testid={`button-delete-${fee.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this fee structure. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
