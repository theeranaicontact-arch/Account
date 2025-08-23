import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import TransactionForm from "@/components/transaction-form";
import ReportGenerator from "@/components/report-generator";
import TransactionHistory from "@/components/transaction-history";
import AirtableSync from "@/components/airtable-sync";
import { type Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/constants";

export default function Dashboard() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Calculate current month totals
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.transactionDate);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTransactions.reduce((sum, t) => 
    sum + parseFloat(t.creditAmount || '0'), 0
  );

  const totalExpenses = currentMonthTransactions.reduce((sum, t) => 
    sum + parseFloat(t.debitAmount || '0'), 0
  );

  const currentBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-3 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent" data-testid="text-app-title">
                ระบบจัดการการเงินส่วนตัว
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" data-testid="status-airtable-connected"></div>
                <span className="text-sm font-medium text-green-700">เชื่อมต่อ Airtable</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Month Balance */}
          <Card className="stats-card overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">ยอดคงเหลือเดือนนี้</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-current-balance">
                      {formatCurrency(currentBalance)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-blue-100">
                  {currentBalance >= 0 ? '✨ สถานะการเงินดี' : '⚠️ ควรปรับแผนการเงิน'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="stats-card overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">รายได้รวม</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-total-income">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-100">
                  {currentMonthTransactions.filter(t => t.creditAmount).length} รายการ
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="stats-card overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">รายจ่ายรวม</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-total-expenses">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-red-100">
                  {currentMonthTransactions.filter(t => t.debitAmount).length} รายการ
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <TransactionForm />
          <ReportGenerator />
          <AirtableSync />
        </div>

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </div>
  );
}
