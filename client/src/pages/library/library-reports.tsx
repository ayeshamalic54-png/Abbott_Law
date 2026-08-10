import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, AlertCircle, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";

type LibraryBook = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
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

type LibraryFine = {
  id: string;
  amount: string;
  status: 'pending' | 'paid';
};

export default function LibraryReports() {
  const { data: books = [] } = useQuery<LibraryBook[]>({
    queryKey: ['/api/library/books'],
  });

  const { data: issues = [] } = useQuery<LibraryIssue[]>({
    queryKey: ['/api/library/issues'],
  });

  const { data: fines = [] } = useQuery<LibraryFine[]>({
    queryKey: ['/api/library/fines'],
  });

  const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0);
  const availableBooks = books.reduce((sum, book) => sum + book.availableCopies, 0);
  const issuedBooks = totalBooks - availableBooks;
  const overdueIssues = issues.filter(i => i.status === 'overdue').length;
  const totalFines = fines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const pendingFines = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const popularBooks = books
    .map(book => ({
      ...book,
      issueCount: issues.filter(i => i.bookId === book.id).length
    }))
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 10);

  const categoryStats = books.reduce((acc, book) => {
    const category = book.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { total: 0, available: 0 };
    }
    acc[category].total += book.totalCopies;
    acc[category].available += book.availableCopies;
    return acc;
  }, {} as Record<string, { total: number; available: number }>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Library Reports</h1>
        <p className="text-muted-foreground">Comprehensive statistics and analytics for library operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-books">{totalBooks}</div>
            <p className="text-xs text-muted-foreground">{books.length} titles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-books">{availableBooks}</div>
            <p className="text-xs text-muted-foreground">
              {totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0}% available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-issued-books">{issuedBooks}</div>
            <p className="text-xs text-muted-foreground">{issues.filter(i => i.status === 'issued').length} active loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-overdue-books">{overdueIssues}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-fines">Rs {totalFines.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{fines.length} fine records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-fines">Rs {pendingFines.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Unpaid fines</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular Books</CardTitle>
            <CardDescription>Most frequently issued books</CardDescription>
          </CardHeader>
          <CardContent>
            {popularBooks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Times Issued</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell className="text-muted-foreground">{book.author || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge>{book.issueCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books by Category</CardTitle>
            <CardDescription>Collection distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryStats).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No categories available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Copies</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Issued</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(categoryStats).map(([category, stats]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category}</TableCell>
                      <TableCell>{stats.total}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stats.available}</Badge>
                      </TableCell>
                      <TableCell>{stats.total - stats.available}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest book issues and returns</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Borrower Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.slice(0, 10).map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>{format(new Date(issue.issueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(issue.dueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {issue.returnDate ? format(new Date(issue.returnDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.borrowerType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          issue.status === 'returned' ? 'default' : 
                          issue.status === 'overdue' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {issue.status}
                      </Badge>
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
