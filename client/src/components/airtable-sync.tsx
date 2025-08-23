import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";

export default function AirtableSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncFromAirtableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync/airtable');
      return response.json();
    },
    onMutate: () => {
      setSyncStatus('syncing');
    },
    onSuccess: (data) => {
      setSyncStatus('success');
      toast({
        title: "สำเร็จ",
        description: `ดึงข้อมูลจาก Airtable เรียบร้อยแล้ว: ${data.message}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
    onError: (error) => {
      setSyncStatus('error');
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลจาก Airtable ได้",
        variant: "destructive",
      });
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
  });

  const pushToAirtableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync/push-to-airtable');
      return response.json();
    },
    onMutate: () => {
      setSyncStatus('syncing');
    },
    onSuccess: (data) => {
      setSyncStatus('success');
      toast({
        title: "สำเร็จ",
        description: `ส่งข้อมูลไป Airtable เรียบร้อยแล้ว: ${data.message}`,
      });
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
    onError: (error) => {
      setSyncStatus('error');
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไป Airtable ได้",
        variant: "destructive",
      });
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
  });

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'กำลังซิงค์...';
      case 'success':
        return 'ซิงค์สำเร็จ';
      case 'error':
        return 'ซิงค์ล้มเหลว';
      default:
        return 'พร้อมซิงค์';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">จัดการข้อมูล Airtable</h2>
        
        {/* Status Display */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className="ml-2 text-sm font-medium text-gray-700">
            สถานะ: {getStatusText()}
          </span>
        </div>

        <div className="space-y-3">
          {/* Pull from Airtable */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => syncFromAirtableMutation.mutate()}
            disabled={syncStatus === 'syncing'}
            data-testid="button-sync-from-airtable"
          >
            <Download className="w-4 h-4 mr-2" />
            ดึงข้อมูลจาก Airtable
          </Button>

          {/* Push to Airtable */}
          <Button
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => pushToAirtableMutation.mutate()}
            disabled={syncStatus === 'syncing'}
            data-testid="button-push-to-airtable"
          >
            <Upload className="w-4 h-4 mr-2" />
            ส่งข้อมูลไป Airtable
          </Button>

          {/* Connection Status */}
          <div className="border-t pt-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              เชื่อมต่อกับ Airtable Base: app4cbr97pcHjtLen
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}