import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Eye, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AccountsReports() {
  const { toast } = useToast();
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  const handleView = (reportName: string) => {
    setViewingReport(reportName);
    toast({
      title: "Viewing Report",
      description: `Opening ${reportName}...`,
    });
  };

  const handleExport = (reportName: string) => {
    toast({
      title: "Exporting Report",
      description: `${reportName} exported successfully as PDF`,
    });
  };

  const handleSave = (reportName: string) => {
    toast({
      title: "Saving Report",
      description: `${reportName} saved to your reports archive`,
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* Background gradient matching dashboard */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 -z-10"></div>
      
      {/* Animated background shapes */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-900/70 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-900/70 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="space-y-6 p-6">
        <Card className="backdrop-blur-md bg-gray-900/70 border-white/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-heading text-white">Financial Reports</CardTitle>
                <CardDescription className="text-white">View, export, and save income, expense, and financial statements</CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="bg-white/30 border-white/30 text-white backdrop-blur-md"
                data-testid="button-export-all"
                onClick={() => handleExport("All Reports")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="backdrop-blur-md bg-gray-900/70 border-white/30">
            <CardHeader>
              <CardTitle className="font-heading text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-300" />
                Income Report
              </CardTitle>
              <CardDescription className="text-white">Total income and collections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-heading font-bold text-white mb-2">Rs 0</div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleView("Income Report")}
                  data-testid="button-view-income"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleExport("Income Report")}
                  data-testid="button-export-income"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleSave("Income Report")}
                  data-testid="button-save-income"
                >
                  <Save className="h-3 w-3 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-gray-900/70 border-white/30">
            <CardHeader>
              <CardTitle className="font-heading text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-300" />
                Expense Report
              </CardTitle>
              <CardDescription className="text-white">Total expenses and payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-heading font-bold text-white mb-2">Rs 0</div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleView("Expense Report")}
                  data-testid="button-view-expense"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleExport("Expense Report")}
                  data-testid="button-export-expense"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white/30 border-white/30 text-white backdrop-blur-md"
                  onClick={() => handleSave("Expense Report")}
                  data-testid="button-save-expense"
                >
                  <Save className="h-3 w-3 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-gray-900/70 border-white/30">
          <CardHeader>
            <CardTitle className="font-heading text-white">Available Reports</CardTitle>
            <CardDescription className="text-white">View, export, or save any financial report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Monthly Income Statement', period: 'Current Month' },
                { name: 'Expense Summary', period: 'Current Month' },
                { name: 'Fee Collection Report', period: 'Current Month' },
                { name: 'Salary Payment Report', period: 'Current Month' },
              ].map((report, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-white/30 rounded-lg backdrop-blur-md bg-white/20 hover-elevate">
                  <div>
                    <div className="font-heading font-medium text-white">{report.name}</div>
                    <div className="text-sm text-white">{report.period}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/30 border-white/30 text-white backdrop-blur-md"
                      onClick={() => handleView(report.name)}
                      data-testid={`button-view-${idx}`}
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/30 border-white/30 text-white backdrop-blur-md"
                      onClick={() => handleExport(report.name)}
                      data-testid={`button-export-${idx}`}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/30 border-white/30 text-white backdrop-blur-md"
                      onClick={() => handleSave(report.name)}
                      data-testid={`button-save-${idx}`}
                    >
                      <Save className="h-3 w-3 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
