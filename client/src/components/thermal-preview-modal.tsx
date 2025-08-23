import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ThermalData {
  receipt: string;
  reportData: any;
}

interface ThermalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  thermalData?: ThermalData;
}

export default function ThermalPreviewModal({ isOpen, onClose, thermalData }: ThermalPreviewModalProps) {
  const handlePrint = () => {
    if (!thermalData?.receipt) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.2; 
              margin: 0; 
              padding: 10px;
              white-space: pre;
            }
            @media print {
              body { margin: 0; }
              @page { 
                size: A6; 
                margin: 5mm;
              }
            }
          </style>
        </head>
        <body>${thermalData.receipt}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 max-h-screen overflow-y-auto" data-testid="modal-thermal-preview">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>ตัวอย่างรายงาน Thermal Printer</DialogTitle>
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* A6 Thermal Receipt Preview */}
        <div className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-xs leading-tight overflow-auto" 
             style={{ width: '100%', maxWidth: '148mm' }}
             data-testid="thermal-receipt-preview">
          {thermalData?.receipt ? (
            <pre className="whitespace-pre-wrap">{thermalData.receipt}</pre>
          ) : (
            <div className="text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <Button 
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-print"
          >
            ปิด
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handlePrint}
            disabled={!thermalData?.receipt}
            data-testid="button-print-thermal"
          >
            พิมพ์
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
