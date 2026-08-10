import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const inventorySchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemType: z.string().min(1, "Item type is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
  currentStock: z.coerce.number().min(0, "Stock must be non-negative"),
});

const saleSchema = z.object({
  inventoryId: z.string().min(1, "Please select an item"),
  customerType: z.enum(['student', 'staff', 'external']),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  saleDate: z.string().min(1, "Sale date is required"),
});

type InventoryItem = {
  id: string;
  itemName: string;
  itemType: string;
  unitPrice: string;
  currentStock: number;
  isActive: boolean;
};

type SaleRecord = {
  id: string;
  itemName: string;
  itemType: string;
  customerType: string;
  customerId: string | null;
  customerName: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  saleDate: string;
  soldBy: string | null;
};

export default function CopiesSalesManagement() {
  const { toast } = useToast();
  const [openInventoryDialog, setOpenInventoryDialog] = useState(false);
  const [openSaleDialog, setOpenSaleDialog] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/library/copies-inventory'],
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery<SaleRecord[]>({
    queryKey: ['/api/library/copies-sales'],
  });

  const inventoryForm = useForm<z.infer<typeof inventorySchema>>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemName: "",
      itemType: "",
      unitPrice: "",
      currentStock: 0,
    },
  });

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      inventoryId: "",
      customerType: 'student',
      customerId: "",
      customerName: "",
      quantity: 1,
      saleDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inventorySchema>) => {
      return await apiRequest('POST', '/api/library/copies-inventory', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/copies-inventory'] });
      toast({ title: "Success", description: "Inventory item added successfully" });
      setOpenInventoryDialog(false);
      inventoryForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add inventory item", variant: "destructive" });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof inventorySchema>> }) => {
      return await apiRequest('PATCH', `/api/library/copies-inventory/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/copies-inventory'] });
      toast({ title: "Success", description: "Stock updated successfully" });
      setSelectedInventory(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update stock", variant: "destructive" });
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof saleSchema>) => {
      const item = inventory.find(i => i.id === data.inventoryId);
      if (!item) throw new Error("Item not found");

      const totalAmount = parseFloat(item.unitPrice) * data.quantity;

      return await apiRequest('POST', '/api/library/copies-sales', {
        ...data,
        unitPrice: item.unitPrice,
        totalAmount: totalAmount.toFixed(2),
        soldBy: null, // Will be set by backend from session
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/copies-sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library/copies-inventory'] });
      toast({ 
        title: "Success", 
        description: "Sale recorded successfully and stock updated. Amount added to revenue." 
      });
      setOpenSaleDialog(false);
      saleForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record sale", variant: "destructive" });
    },
  });

  const totalStockValue = inventory.reduce((sum, item) => 
    sum + (item.currentStock * parseFloat(item.unitPrice || '0')), 0
  );

  const totalSalesAmount = sales.reduce((sum, sale) => 
    sum + parseFloat(sale.totalAmount || '0'), 0
  );

  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Copies Sales Management</h1>
          <p className="text-muted-foreground">Manage inventory and record sales of practical copies and stationery</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-stock-value">Rs {totalStockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{inventory.length} items in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sales">Rs {totalSalesAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-items-sold">{totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-low-stock">
              {inventory.filter(i => i.currentStock < 10).length}
            </div>
            <p className="text-xs text-muted-foreground">Items below 10 units</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Records</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1">
              <div>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Manage stock of practical copies and stationery items</CardDescription>
              </div>
              <Dialog open={openInventoryDialog} onOpenChange={setOpenInventoryDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-inventory">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>
                      Add a new item to the copies inventory
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...inventoryForm}>
                    <form onSubmit={inventoryForm.handleSubmit((data) => createInventoryMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={inventoryForm.control}
                        name="itemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Practical Copy Small" data-testid="input-item-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={inventoryForm.control}
                        name="itemType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Type / Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Practical Copy, Notebook, etc." data-testid="input-item-type" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={inventoryForm.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price (Rs)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-unit-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={inventoryForm.control}
                        name="currentStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stock (Units)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="0" 
                                data-testid="input-current-stock" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createInventoryMutation.isPending} data-testid="button-save-inventory">
                        {createInventoryMutation.isPending ? "Saving..." : "Add Item"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading inventory...</p>
              ) : inventory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No inventory items yet. Add your first item to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.itemType}</TableCell>
                        <TableCell>Rs {parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={item.currentStock < 10 ? "destructive" : "default"}>
                            {item.currentStock} units
                          </Badge>
                        </TableCell>
                        <TableCell>Rs {(item.currentStock * parseFloat(item.unitPrice)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedInventory(item)} data-testid={`button-update-stock-${item.id}`}>
                                Update Stock
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Stock: {item.itemName}</DialogTitle>
                                <DialogDescription>Add or remove stock quantity</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Stock: {item.currentStock} units</Label>
                                </div>
                                <div>
                                  <Label>New Stock Quantity</Label>
                                  <Input 
                                    type="number" 
                                    defaultValue={item.currentStock}
                                    onChange={(e) => {
                                      const newStock = parseInt(e.target.value) || 0;
                                      if (selectedInventory) {
                                        setSelectedInventory({ ...selectedInventory, currentStock: newStock });
                                      }
                                    }}
                                    data-testid="input-new-stock"
                                  />
                                </div>
                                <Button 
                                  onClick={() => {
                                    if (selectedInventory) {
                                      updateInventoryMutation.mutate({
                                        id: item.id,
                                        data: { currentStock: selectedInventory.currentStock }
                                      });
                                    }
                                  }}
                                  disabled={updateInventoryMutation.isPending}
                                  data-testid="button-confirm-stock-update"
                                >
                                  {updateInventoryMutation.isPending ? "Updating..." : "Update Stock"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1">
              <div>
                <CardTitle>Sales Records</CardTitle>
                <CardDescription>Record and track copies sales transactions</CardDescription>
              </div>
              <Dialog open={openSaleDialog} onOpenChange={setOpenSaleDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-record-sale">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Record Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record New Sale</DialogTitle>
                    <DialogDescription>
                      Record a sale transaction. Stock will be automatically deducted and revenue recorded.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...saleForm}>
                    <form onSubmit={saleForm.handleSubmit((data) => createSaleMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={saleForm.control}
                        name="inventoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Item</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-item">
                                  <SelectValue placeholder="Select an item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inventory.filter(i => i.currentStock > 0).map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.itemName} - Rs {parseFloat(item.unitPrice).toFixed(2)} ({item.currentStock} in stock)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={saleForm.control}
                        name="customerType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-customer-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="external">External</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={saleForm.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter customer name" data-testid="input-customer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={saleForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1"
                                placeholder="1" 
                                data-testid="input-quantity" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={saleForm.control}
                        name="saleDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sale Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-sale-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createSaleMutation.isPending} className="w-full" data-testid="button-save-sale">
                        {createSaleMutation.isPending ? "Recording..." : "Record Sale"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading sales records...</p>
              ) : sales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                        <TableCell>{format(new Date(sale.saleDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sale.itemName}</div>
                            <div className="text-xs text-muted-foreground">{sale.itemType}</div>
                          </div>
                        </TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.customerType}</Badge>
                        </TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>Rs {parseFloat(sale.unitPrice).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">Rs {parseFloat(sale.totalAmount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
