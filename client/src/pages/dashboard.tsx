import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import TransactionForm from "@/components/transaction-form";
import ReportGenerator from "@/components/report-generator";
import TransactionHistory from "@/components/transaction-history";
import AirtableSync from "@/components/airtable-sync";
import kawaiiFincatImage from '@assets/generated_images/Kawaii_finance_cat_mascot_98119bd0.png';
import kawaiiMoneyGirlImage from '@assets/generated_images/Kawaii_money_management_girl_afa7fc90.png';
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
    <div className="min-h-screen kawaii-bg">
      {/* Navigation */}
      <nav className="kawaii-nav shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-full mr-4 flex items-center justify-center kawaii-bounce shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              <h1 className="text-xl font-bold text-gray-700" data-testid="text-app-title">
                💕 ระบบจัดการเงินน่ารัก ✨
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/80 px-4 py-2 rounded-full border-2 border-white/50 backdrop-blur-sm kawaii-sparkle relative">
                <div className="h-3 w-3 bg-green-400 rounded-full mr-2 animate-pulse" data-testid="status-airtable-connected"></div>
                <span className="text-sm font-medium text-gray-700">🌸 เชื่อมต่อแล้ว</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Kawaii Mascot Images */}
        <div className="fixed top-20 right-8 z-10 hidden lg:block">
          <img 
            src={kawaiiFincatImage} 
            alt="Kawaii Finance Cat" 
            className="w-24 h-24 kawaii-floating opacity-80"
          />
        </div>
        <div className="fixed bottom-8 left-8 z-10 hidden lg:block">
          <img 
            src={kawaiiMoneyGirlImage} 
            alt="Kawaii Money Girl" 
            className="w-32 h-32 kawaii-bounce opacity-90"
          />
        </div>
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Month Balance */}
          <Card className="stats-card overflow-hidden kawaii-floating">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-pink-400 to-pink-500 text-white relative">
                <div className="absolute top-2 right-2 text-2xl">💖</div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">💰 ยอดคงเหลือเดือนนี้</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-current-balance">
                      {formatCurrency(currentBalance)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center kawaii-bounce">
                    <span className="text-2xl">🪙</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-pink-100">
                  {currentBalance >= 0 ? '✨ สถานะการเงินดีจัง!' : '🌸 ปรับแผนการเงินกันเถอะ'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="stats-card overflow-hidden kawaii-floating" style={{animationDelay: '0.5s'}}>
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-mint-400 to-green-400 text-white relative">
                <div className="absolute top-2 right-2 text-2xl">🌿</div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">💚 รายได้รวม</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-total-income">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center kawaii-bounce">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-100">
                  🎉 {currentMonthTransactions.filter(t => t.creditAmount).length} รายการ
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="stats-card overflow-hidden kawaii-floating" style={{animationDelay: '1s'}}>
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-br from-purple-400 to-purple-500 text-white relative">
                <div className="absolute top-2 right-2 text-2xl">🛍️</div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">💜 รายจ่ายรวม</p>
                    <p className="text-2xl font-bold mt-1" data-testid="text-total-expenses">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center kawaii-bounce">
                    <span className="text-2xl">📉</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-purple-100">
                  🌈 {currentMonthTransactions.filter(t => t.debitAmount).length} รายการ
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="kawaii-floating">
            <TransactionForm />
          </div>
          <div className="kawaii-floating" style={{animationDelay: '1.5s'}}>
            <ReportGenerator />
          </div>
          <div className="kawaii-floating" style={{animationDelay: '2s'}}>
            <AirtableSync />
          </div>
        </div>

        {/* Transaction History */}
        <div className="kawaii-floating" style={{animationDelay: '2.5s'}}>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
