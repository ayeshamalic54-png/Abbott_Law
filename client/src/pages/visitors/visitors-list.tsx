import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Printer, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Visitor, InsertVisitor } from "@shared/schema";
import { insertVisitorSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function VisitorsList() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const { data: visitors, isLoading } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });

  const canEditDelete = user?.role === 'admin' || user?.role === 'receptionist';

  const form = useForm<Partial<InsertVisitor>>({
    resolver: zodResolver(insertVisitorSchema.partial()),
    defaultValues: {},
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertVisitor>) => {
      if (!selectedVisitor) throw new Error("No visitor selected");
      return await apiRequest('PUT', `/api/visitors/${selectedVisitor.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Visitor updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      setEditDialogOpen(false);
      setSelectedVisitor(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update visitor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/visitors/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Visitor deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      setDeleteDialogOpen(false);
      setSelectedVisitor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete visitor",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    form.reset({
      name: visitor.name,
      phone: visitor.phone ?? "",
      purpose: visitor.purpose ?? "",
      visitDate: visitor.visitDate,
      remarks: visitor.remarks ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: Partial<InsertVisitor>) => {
    updateMutation.mutate(data);
  };

  const confirmDelete = () => {
    if (selectedVisitor) {
      deleteMutation.mutate(selectedVisitor.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold" data-testid="heading-visitors">Visitor Management</h1>
          <p className="text-muted-foreground">Track and manage campus visitors</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/visitors/print')}
            data-testid="button-print-view"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print View
          </Button>
          <Button onClick={() => window.location.href = '/visitors/add'} data-testid="button-add-visitor">
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : !visitors || visitors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No visitors recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.map((visitor) => (
                    <TableRow key={visitor.id} className="hover-elevate" data-testid={`row-visitor-${visitor.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${visitor.id}`}>{visitor.name}</TableCell>
                      <TableCell>{visitor.phone || '-'}</TableCell>
                      <TableCell>{visitor.purpose || '-'}</TableCell>
                      <TableCell>{visitor.visitDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{visitor.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        {canEditDelete && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Edit" 
                              onClick={() => handleEdit(visitor)}
                              data-testid={`button-edit-${visitor.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Delete" 
                              onClick={() => handleDelete(visitor)}
                              data-testid={`button-delete-${visitor.id}`}
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

      {/* Edit Visitor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Visitor</DialogTitle>
            <DialogDescription>Update visitor information</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visitDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} data-testid="input-visit-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-purpose" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} data-testid="input-remarks" />
                    </FormControl>
                    <FormMessage />
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
              This will permanently delete the visitor record for "{selectedVisitor?.name}". This action cannot be undone.
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
