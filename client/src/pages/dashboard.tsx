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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900" data-testid="text-app-title">
                Personal Finance Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Connected to Airtable</span>
              <div className="h-2 w-2 bg-green-500 rounded-full" data-testid="status-airtable-connected"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Month Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500">ยอดคงเหลือเดือนนี้</dt>
                  <dd className="text-2xl font-bold text-gray-900" data-testid="text-current-balance">
                    {formatCurrency(currentBalance)}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500">รายได้รวม</dt>
                  <dd className="text-2xl font-bold text-green-600" data-testid="text-total-income">
                    {formatCurrency(totalIncome)}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500">รายจ่ายรวม</dt>
                  <dd className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
                    {formatCurrency(totalExpenses)}
                  </dd>
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
