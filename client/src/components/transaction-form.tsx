import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp } from "lucide-react";
import { TRANSACTION_TYPES } from "@/lib/constants";

export default function TransactionForm() {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      type: 'REG',
      debitAmount: '',
      creditAmount: '',
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "สำเร็จ",
        description: "บันทึกรายการเรียบร้อยแล้ว",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกรายการได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    // Ensure only debit OR credit has value, not both
    if (transactionType === 'income') {
      data.debitAmount = '';
    } else {
      data.creditAmount = '';
    }
    
    createTransactionMutation.mutate(data);
  };

  const incomeTypes = Object.entries(TRANSACTION_TYPES).filter(([_, info]) => info.isIncome);
  const expenseTypes = Object.entries(TRANSACTION_TYPES).filter(([_, info]) => !info.isIncome);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">บันทึกรายรับ-รายจ่าย</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">ประเภทรายการ</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`flex items-center justify-center px-4 py-3 border-2 font-medium ${
                    transactionType === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700'
                  }`}
                  onClick={() => {
                    setTransactionType('income');
                    form.setValue('type', 'REG');
                  }}
                  data-testid="button-income-type"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  รายได้
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className={`flex items-center justify-center px-4 py-3 border-2 font-medium ${
                    transactionType === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-700 hover:border-red-500 hover:bg-red-50 hover:text-red-700'
                  }`}
                  onClick={() => {
                    setTransactionType('expense');
                    form.setValue('type', 'ESS');
                  }}
                  data-testid="button-expense-type"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  รายจ่าย
                </Button>
              </div>
            </div>

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมวดหมู่</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <optgroup label="รายได้">
                        {incomeTypes.map(([code, info]) => (
                          <SelectItem key={code} value={code} disabled={transactionType !== 'income'}>
                            {code} - {info.nameTh}
                          </SelectItem>
                        ))}
                      </optgroup>
                      <optgroup label="รายจ่าย">
                        {expenseTypes.map(([code, info]) => (
                          <SelectItem key={code} value={code} disabled={transactionType !== 'expense'}>
                            {code} - {info.nameTh}
                          </SelectItem>
                        ))}
                      </optgroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="debitAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เดบิต (รายจ่าย)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">฿</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          disabled={transactionType === 'income'}
                          data-testid="input-debit-amount"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="creditAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เครดิต (รายรับ)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">฿</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          disabled={transactionType === 'expense'}
                          data-testid="input-credit-amount"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Field */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วันที่</FormLabel>
                  <FormControl>
                    <Input type="date" data-testid="input-transaction-date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดเพิ่มเติม..."
                      rows={3}
                      data-testid="input-notes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={createTransactionMutation.isPending}
              data-testid="button-submit-transaction"
            >
              {createTransactionMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
