import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, BookOpen, Printer } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { LibraryBook } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const bookSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  publisher: z.string().optional(),
  category: z.string().optional(),
  totalCopies: z.coerce.number().min(1, "Must have at least 1 copy"),
  availableCopies: z.coerce.number().min(0, "Cannot be negative"),
});

export default function LibraryBooks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'library_staff';
  
  const { data: books, isLoading } = useQuery<LibraryBook[]>({
    queryKey: ['/api/library/books'],
  });

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      isbn: "",
      title: "",
      author: "",
      publisher: "",
      category: "",
      totalCopies: 1,
      availableCopies: 1,
    },
  });

  const createBookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookSchema>) => {
      return await apiRequest('POST', '/api/library/books', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/books'] });
      toast({ title: "Success", description: "Book added successfully" });
      setOpenAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add book", variant: "destructive" });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof bookSchema> }) => {
      return await apiRequest('PATCH', `/api/library/books/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/books'] });
      toast({ title: "Success", description: "Book updated successfully" });
      setOpenEditDialog(false);
      setSelectedBook(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update book", variant: "destructive" });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/library/books/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/books'] });
      toast({ title: "Success", description: "Book deleted successfully" });
      setOpenDeleteDialog(false);
      setSelectedBook(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete book", variant: "destructive" });
    },
  });

  const handleEditClick = (book: LibraryBook) => {
    setSelectedBook(book);
    form.reset({
      isbn: book.isbn || "",
      title: book.title,
      author: book.author || "",
      publisher: book.publisher || "",
      category: book.category || "",
      totalCopies: book.totalCopies || 1,
      availableCopies: book.availableCopies || 0,
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (book: LibraryBook) => {
    setSelectedBook(book);
    setOpenDeleteDialog(true);
  };

  const filteredBooks = books?.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-books">Book Catalog</h1>
          <p className="text-muted-foreground">Manage library book inventory</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/library/books/print')}
            data-testid="button-print-view"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print View
          </Button>
          {isAdmin && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-book">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>
                  Add a new book to the library catalog
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createBookMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Book Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter book title" data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isbn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISBN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ISBN number" data-testid="input-isbn" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Author name" data-testid="input-author" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publisher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publisher</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Publisher name" data-testid="input-publisher" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Law, History" data-testid="input-category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalCopies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Copies *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" placeholder="1" data-testid="input-total-copies" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availableCopies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Copies *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" placeholder="1" data-testid="input-available-copies" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBookMutation.isPending} data-testid="button-save-book">
                      {createBookMutation.isPending ? "Adding..." : "Add Book"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Books</CardTitle>
              <CardDescription>Complete library collection</CardDescription>
            </div>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No books found</p>
              <p className="text-sm text-muted-foreground mt-1">Start building your library collection</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Copies</TableHead>
                    <TableHead>Available</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id} className="hover-elevate" data-testid={`row-book-${book.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-isbn-${book.id}`}>
                        {book.isbn || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-title-${book.id}`}>{book.title}</p>
                          <p className="text-xs text-muted-foreground">{book.publisher}</p>
                        </div>
                      </TableCell>
                      <TableCell>{book.author || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell>{book.totalCopies || 0}</TableCell>
                      <TableCell>
                        <Badge variant={book.availableCopies! > 0 ? 'default' : 'destructive'} data-testid={`badge-available-${book.id}`}>
                          {book.availableCopies || 0}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Edit" 
                              onClick={() => handleEditClick(book)}
                              data-testid={`button-edit-${book.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Delete"
                              onClick={() => handleDeleteClick(book)}
                              data-testid={`button-delete-${book.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Book Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update book information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (selectedBook) {
                updateBookMutation.mutate({ id: selectedBook.id, data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter book title" data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ISBN number" data-testid="input-edit-isbn" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Author name" data-testid="input-edit-author" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publisher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Publisher name" data-testid="input-edit-publisher" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Law, History" data-testid="input-edit-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Copies *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="1" data-testid="input-edit-total-copies" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availableCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Copies *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="1" data-testid="input-edit-available-copies" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBookMutation.isPending} data-testid="button-update-book">
                  {updateBookMutation.isPending ? "Updating..." : "Update Book"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBook?.title}"? This action cannot be undone.
              {selectedBook && (selectedBook.totalCopies! - selectedBook.availableCopies!) > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium">
                    Warning: This book has {selectedBook.totalCopies! - selectedBook.availableCopies!} copies currently issued.
                    You cannot delete it until all copies are returned.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBook && deleteBookMutation.mutate(selectedBook.id)}
              disabled={deleteBookMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteBookMutation.isPending ? "Deleting..." : "Delete Book"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
