import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Eye, Printer, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { FeeVoucher } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FeeVouchers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  
  const { data: vouchers, isLoading } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fees/vouchers'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/fees/vouchers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Voucher deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/fees/vouchers'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete voucher", variant: "destructive" });
    },
  });

  const filteredVouchers = vouchers?.filter(v =>
    v.voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-vouchers">Fee Vouchers</h1>
          <p className="text-muted-foreground">Generate and manage student fee vouchers</p>
        </div>
        <Button 
          onClick={() => setLocation('/fees/vouchers/generate')}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
          data-testid="button-generate-voucher"
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Vouchers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Vouchers</CardTitle>
              <CardDescription>List of generated fee vouchers</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Button variant="outline" size="icon" title="Export" data-testid="button-export">
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/fees/vouchers/print')}
                title="Print View"
                data-testid="button-print-view"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vouchers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher) => (
                    <TableRow key={voucher.id} className="hover-elevate" data-testid={`row-voucher-${voucher.id}`}>
                      <TableCell className="font-mono" data-testid={`text-voucher-${voucher.id}`}>{voucher.voucherNumber}</TableCell>
                      <TableCell>{voucher.studentId}</TableCell>
                      <TableCell className="font-mono">Rs {parseFloat(voucher.amount).toLocaleString()}</TableCell>
                      <TableCell>{voucher.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={voucher.status === 'paid' ? 'default' : 'secondary'}>
                          {voucher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Voucher"
                            onClick={() => setLocation(`/fees/voucher/${voucher.id}`)}
                            data-testid={`button-view-voucher-${voucher.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Voucher"
                            onClick={() => setLocation(`/fees/voucher/${voucher.id}`)}
                            data-testid={`button-print-voucher-${voucher.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete Voucher"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-voucher-${voucher.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Voucher</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete voucher {voucher.voucherNumber}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(voucher.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
    </div>
  );
}
