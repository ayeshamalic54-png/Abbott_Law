import { Button } from "@/components/ui/button";
import { Printer, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrintViewProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  reportData?: any;
  reportType: string;
  className?: string;
  college?: "law" | "group";
}

export function PrintView({ 
  title, 
  subtitle, 
  children, 
  reportData, 
  reportType,
  className = "",
  college = "law"
}: PrintViewProps) {
  const collegeName = college === "group" ? "ABBOTT GROUP OF COLLEGES" : "ABBOTT LAW COLLEGE";
  const affiliation = college === "group" ? "Excellence in Education" : "Affiliated with Hazara University";
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const data = {
      reportType,
      title,
      subtitle,
      generatedAt: new Date().toISOString(),
      generatedBy: "System Admin",
      data: reportData,
    };
    
    const filename = `${reportType.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(filename, JSON.stringify(data));
    
    toast({
      title: "Report Saved",
      description: `${reportType} has been saved successfully`,
    });
  };

  return (
    <div className={`print-container ${className}`}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-professional-view {
            font-size: 10pt;
          }
          .print-professional-header {
            text-align: center;
            border-bottom: 3px double #1e3a5f;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .print-professional-header h1 {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a5f;
            margin: 0;
          }
          .print-professional-header p {
            margin: 3px 0;
            color: #444;
          }
          .print-professional-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin: 15px 0;
            padding: 8px;
            background: #f0f4f8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #ddd;
          }
          .print-professional-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 9pt;
            color: #666;
          }
          .print-professional-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .print-professional-content th {
            background: #1e3a5f !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: white !important;
            padding: 8px 6px;
            text-align: left;
            font-size: 9pt;
            border: 1px solid #1e3a5f;
          }
          .print-professional-content td {
            padding: 6px;
            border: 1px solid #ddd;
            font-size: 9pt;
          }
          .print-professional-content tr:nth-child(even) {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-professional-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
          }
          .print-signature-block {
            text-align: center;
            min-width: 150px;
          }
          .print-signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 9pt;
          }
          .print-generated-note {
            text-align: center;
            margin-top: 20px;
            font-size: 8pt;
            color: #666;
          }
        }
      `}</style>

      {/* Action buttons - hidden on print */}
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-lg"
          data-testid="button-save-report"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Report
        </Button>
        <Button 
          onClick={handlePrint}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
          data-testid="button-print-report"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Professional Print Layout */}
      <div className="print-professional-view bg-white border rounded-lg shadow-sm">
        {/* Header */}
        <div className="print-professional-header text-center border-b-4 border-double border-[#1e3a5f] pb-4 mb-5 p-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{collegeName}</h1>
          <p className="text-gray-600 mt-1">Mansehra, Khyber Pakhtunkhwa</p>
          <p className="text-gray-500 text-sm">{affiliation}</p>
        </div>

        {/* Title */}
        <div className="print-professional-title text-center font-bold text-lg py-2 px-4 mx-6 bg-slate-100 border border-gray-200 rounded">
          {title.toUpperCase()}
        </div>

        {/* Metadata */}
        <div className="print-professional-meta flex justify-between text-sm text-gray-500 px-6 py-3">
          <span>Report Date: {new Date().toLocaleDateString()}</span>
          {subtitle && <span>{subtitle}</span>}
          <span>Session: {new Date().getFullYear()}</span>
        </div>

        {/* Content */}
        <div className="print-professional-content px-6 py-4">
          {children}
        </div>

        {/* Footer with signatures */}
        <div className="print-professional-footer flex justify-between px-6 py-4 mt-8 border-t">
          <div className="print-signature-block text-center min-w-[150px]">
            <div className="print-signature-line border-t border-gray-800 mt-10 pt-2 text-sm">
              Prepared By
            </div>
          </div>
          <div className="print-signature-block text-center min-w-[150px]">
            <div className="print-signature-line border-t border-gray-800 mt-10 pt-2 text-sm">
              Verified By
            </div>
          </div>
          <div className="print-signature-block text-center min-w-[150px]">
            <div className="print-signature-line border-t border-gray-800 mt-10 pt-2 text-sm">
              Principal
            </div>
          </div>
        </div>

        {/* Generated note */}
        <div className="print-generated-note text-center text-xs text-gray-400 py-4">
          This is a computer-generated report. Generated on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
