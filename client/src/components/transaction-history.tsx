import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Transaction } from "@shared/schema";
import { TRANSACTION_TYPES, formatCurrency } from "@/lib/constants";

export default function TransactionHistory() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    const typeInfo = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES];
    if (!typeInfo) return 'gray';
    
    const colorMap = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[typeInfo.color as keyof typeof colorMap] || colorMap.gray;
  };

  const getTaxStatus = (type: string) => {
    const typeInfo = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES];
    if (!typeInfo) return { label: 'ไม่เกี่ยวข้อง', color: 'bg-gray-100 text-gray-800' };
    
    if (typeInfo.isIncome && typeInfo.taxable) {
      return { label: 'ต้องยื่น', color: 'bg-red-100 text-red-800' };
    } else if (typeInfo.isIncome && !typeInfo.taxable) {
      return { label: 'ยกเว้น', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'ไม่เกี่ยวข้อง', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Calculate running balance
  let runningBalance = 0;
  const transactionsWithBalance = [...transactions].reverse().map(transaction => {
    const debit = parseFloat(transaction.debitAmount || '0');
    const credit = parseFloat(transaction.creditAmount || '0');
    runningBalance += credit - debit;
    return { ...transaction, runningBalance };
  }).reverse();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">รายการล่าสุด</h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">เดบิต</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">เครดิต</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดคงเหลือ</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">ภาษี</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {transactionsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    ยังไม่มีรายการธุรกรรม
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((transaction) => {
                  const debit = parseFloat(transaction.debitAmount || '0');
                  const credit = parseFloat(transaction.creditAmount || '0');
                  const taxStatus = getTaxStatus(transaction.type);
                  
                  return (
                    <TableRow key={transaction.id} className="hover:bg-gray-50" data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900" data-testid={`text-date-${transaction.id}`}>
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={`${getTypeColor(transaction.type)}`} data-testid={`badge-type-${transaction.id}`}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900" data-testid={`text-debit-${transaction.id}`}>
                        {debit > 0 ? (
                          <span className="text-red-600 font-medium">{formatCurrency(debit)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900" data-testid={`text-credit-${transaction.id}`}>
                        {credit > 0 ? (
                          <span className="text-green-600 font-medium">{formatCurrency(credit)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900" data-testid={`text-balance-${transaction.id}`}>
                        {formatCurrency(transaction.runningBalance)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={taxStatus.color} data-testid={`badge-tax-${transaction.id}`}>
                          {taxStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
