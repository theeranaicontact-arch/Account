import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download } from "lucide-react";
import { THAI_MONTHS } from "@/lib/constants";
import ThermalPreviewModal from "./thermal-preview-modal";

interface ThermalData {
  receipt: string;
  reportData: any;
}

export default function ReportGenerator() {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(8); // August
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showThermalModal, setShowThermalModal] = useState(false);

  const { data: reportData, refetch: refetchReport } = useQuery({
    queryKey: ['/api/reports/monthly', selectedYear, selectedMonth],
    enabled: false, // Only fetch when explicitly requested
  });

  const { data: thermalData, refetch: refetchThermal } = useQuery<ThermalData>({
    queryKey: ['/api/reports/thermal', selectedYear, selectedMonth],
    enabled: false,
  });

  const handleGenerateThermalReport = async () => {
    await refetchThermal();
    setShowThermalModal(true);
  };

  const handleGeneratePDFReport = async () => {
    await refetchReport();
    // TODO: Implement PDF generation
    console.log('PDF Report:', reportData);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">สร้างรายงาน</h2>
          
          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">ประเภทรายงาน</label>
              <Select value={reportType} onValueChange={(value: 'monthly' | 'yearly') => setReportType(value)}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">รายงานรายเดือน</SelectItem>
                  <SelectItem value="yearly">รายงานรายปี</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">เดือน</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">ปี</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Options */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">รูปแบบการส่งออก</h3>
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleGenerateThermalReport}
                  data-testid="button-generate-thermal"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  สร้างรายงาน Thermal Printer
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={handleGeneratePDFReport}
                  data-testid="button-generate-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ThermalPreviewModal
        isOpen={showThermalModal}
        onClose={() => setShowThermalModal(false)}
        thermalData={thermalData}
      />
    </>
  );
}
