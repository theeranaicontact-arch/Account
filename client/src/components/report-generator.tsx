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

  const { data: yearlyThermalData, refetch: refetchYearlyThermal } = useQuery<ThermalData>({
    queryKey: ['/api/reports/thermal-yearly', selectedYear],
    enabled: false,
  });

  const { data: yearlyReportData, refetch: refetchYearlyReport } = useQuery({
    queryKey: ['/api/reports/yearly', selectedYear],
    enabled: false,
  });

  const handleGenerateThermalReport = async () => {
    if (reportType === 'yearly') {
      await refetchYearlyThermal();
      setShowThermalModal(true);
    } else {
      await refetchThermal();
      setShowThermalModal(true);
    }
  };

  const handleGeneratePDFReport = async () => {
    if (reportType === 'yearly') {
      await refetchYearlyReport();
      console.log('Yearly PDF Report:', yearlyReportData);
    } else {
      await refetchReport();
      console.log('Monthly PDF Report:', reportData);
    }
  };

  return (
    <>
      <Card className="form-section">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-purple-400 to-purple-500 p-4 text-white rounded-t-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 text-6xl opacity-20">📊</div>
            <div className="absolute bottom-0 left-0 text-4xl opacity-30">📋</div>
            <h2 className="text-lg font-semibold relative z-10">📊 สร้างรายงานน่ารัก 💜</h2>
            <p className="text-purple-100 text-sm mt-1 relative z-10">✨ สร้างรายงานสรุปและพิมพ์ใบเสร็จสวยๆ</p>
          </div>
          <div className="p-6">
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
            <div className={reportType === 'yearly' ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
              {reportType === 'monthly' && (
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
              )}
              
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
          </div>
        </CardContent>
      </Card>

      <ThermalPreviewModal
        isOpen={showThermalModal}
        onClose={() => setShowThermalModal(false)}
        thermalData={reportType === 'yearly' ? yearlyThermalData : thermalData}
      />
    </>
  );
}
