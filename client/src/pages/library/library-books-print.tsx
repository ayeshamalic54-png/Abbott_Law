import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintView } from "@/components/print-view";

export default function LibraryBooksPrint() {
  const [, setLocation] = useLocation();
  
  const { data: books, isLoading } = useQuery<any[]>({
    queryKey: ['/api/library/books'],
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="print:hidden flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/library/books')}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <PrintView
        title="Library Books Catalog"
        subtitle={`Complete library collection (Total: ${books?.length || 0} books)`}
        reportType="Library Books Catalog"
        reportData={books}
        college="group"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Total Copies</TableHead>
              <TableHead>Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books?.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-mono text-sm">
                  {book.bookId}
                </TableCell>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell className="font-mono text-sm">{book.isbn || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{book.category || 'General'}</Badge>
                </TableCell>
                <TableCell>{book.totalCopies || 0}</TableCell>
                <TableCell>{book.availableCopies || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PrintView>
    </div>
  );
}
