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
    <Card className="form-section">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-4 text-white rounded-t-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 text-6xl opacity-20">☁️</div>
          <div className="absolute bottom-0 left-0 text-4xl opacity-30">🔄</div>
          <h2 className="text-lg font-semibold relative z-10">☁️ จัดการข้อมูลคลาวด์ 💙</h2>
          <p className="text-blue-100 text-sm mt-1 relative z-10">✨ ซิงค์ข้อมูลกับ Airtable อย่างง่ายดาย</p>
        </div>
        <div className="p-6">
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
            className="w-full button-kawaii-blue"
            onClick={() => syncFromAirtableMutation.mutate()}
            disabled={syncStatus === 'syncing'}
            data-testid="button-sync-from-airtable"
          >
            <span className="flex items-center text-lg">
              <span className="mr-2">📥</span> ดึงข้อมูลจาก Airtable <span className="ml-2">✨</span>
            </span>
          </Button>

          {/* Push to Airtable */}
          <Button
            className="w-full button-kawaii-mint"
            onClick={() => pushToAirtableMutation.mutate()}
            disabled={syncStatus === 'syncing'}
            data-testid="button-push-to-airtable"
          >
            <span className="flex items-center text-lg">
              <span className="mr-2">📤</span> ส่งข้อมูลไป Airtable <span className="ml-2">🌸</span>
            </span>
          </Button>

          {/* Connection Status */}
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${syncStatus === 'success' ? 'bg-green-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                เชื่อมต่อกับ Airtable Base: app4cbr97pcHjtLen
              </div>
              <div className="text-xs text-gray-500">
                สถานะการเชื่อมต่อจะอัพเดทอัตโนมัติ
                <br />
                หมายเหตุ: ระบบจะแสดงเฉพาะข้อมูลจาก Airtable เท่านั้น
              </div>
            </div>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}