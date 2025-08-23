import { Transaction, TRANSACTION_TYPE_INFO } from "@shared/schema";

export interface ReportData {
  month: number;
  year: number;
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  taxableAmount: number;
  taxExemptAmount: number;
  typeSummary: Record<string, number>;
}

export interface YearlyReportData {
  year: number;
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  taxableAmount: number;
  taxExemptAmount: number;
  typeSummary: Record<string, number>;
  monthlyBreakdown: Array<{
    month: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    transactionCount: number;
  }>;
}

export class ReportService {
  static generateYearlyReport(transactions: Transaction[], year: number): YearlyReportData {
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.transactionDate);
      const transactionYear = date.getFullYear();
      
      // Convert Buddhist Era (BE) to Christian Era (CE) if needed
      const targetYear = year > 2500 ? year - 543 : year;
      
      return transactionYear === targetYear;
    });

    let totalDebit = 0;
    let totalCredit = 0;
    let taxableAmount = 0;
    let taxExemptAmount = 0;
    const typeSummary: Record<string, number> = {};
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalDebit: 0,
      totalCredit: 0,
      balance: 0,
      transactionCount: 0
    }));

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const month = date.getMonth();
      const debit = parseFloat(transaction.debitAmount || '0');
      const credit = parseFloat(transaction.creditAmount || '0');
      
      totalDebit += debit;
      totalCredit += credit;

      // Update monthly breakdown
      monthlyBreakdown[month].totalDebit += debit;
      monthlyBreakdown[month].totalCredit += credit;
      monthlyBreakdown[month].balance += credit - debit;
      monthlyBreakdown[month].transactionCount++;

      // Count transaction types
      typeSummary[transaction.type] = (typeSummary[transaction.type] || 0) + 1;

      // Calculate taxable amounts (only for income)
      if (credit > 0) {
        const typeInfo = TRANSACTION_TYPE_INFO[transaction.type as keyof typeof TRANSACTION_TYPE_INFO];
        if (typeInfo.taxable) {
          taxableAmount += credit;
        } else {
          taxExemptAmount += credit;
        }
      }
    });

    return {
      year,
      transactions: filteredTransactions,
      totalDebit,
      totalCredit,
      balance: totalCredit - totalDebit,
      taxableAmount,
      taxExemptAmount,
      typeSummary,
      monthlyBreakdown
    };
  }

  static generateMonthlyReport(transactions: Transaction[], month: number, year: number): ReportData {
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.transactionDate);
      const transactionYear = date.getFullYear();
      const transactionMonth = date.getMonth() + 1;
      
      // Convert Buddhist Era (BE) to Christian Era (CE) if needed
      const targetYear = year > 2500 ? year - 543 : year;
      
      return transactionMonth === month && transactionYear === targetYear;
    });

    let totalDebit = 0;
    let totalCredit = 0;
    let taxableAmount = 0;
    let taxExemptAmount = 0;
    const typeSummary: Record<string, number> = {};

    filteredTransactions.forEach(transaction => {
      const debit = parseFloat(transaction.debitAmount || '0');
      const credit = parseFloat(transaction.creditAmount || '0');
      
      totalDebit += debit;
      totalCredit += credit;

      // Count transaction types
      typeSummary[transaction.type] = (typeSummary[transaction.type] || 0) + 1;

      // Calculate taxable amounts (only for income)
      if (credit > 0) {
        const typeInfo = TRANSACTION_TYPE_INFO[transaction.type as keyof typeof TRANSACTION_TYPE_INFO];
        if (typeInfo.taxable) {
          taxableAmount += credit;
        } else {
          taxExemptAmount += credit;
        }
      }
    });

    return {
      month,
      year,
      transactions: filteredTransactions,
      totalDebit,
      totalCredit,
      balance: totalCredit - totalDebit,
      taxableAmount,
      taxExemptAmount,
      typeSummary
    };
  }

  static generateThermalReceipt(reportData: ReportData): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Convert year to Buddhist Era if it's in Christian Era
    const displayYear = reportData.year < 2500 ? reportData.year + 543 : reportData.year;

    let receipt = '';
    receipt += `        ACCOUNT REPORT ${displayYear}\n\n`;
    receipt += `Month: ${monthNames[reportData.month - 1].padEnd(15)}Current: THB\n`;
    receipt += `=======================================\n`;
    receipt += `Date  Type    Debit   Credit    Total\n`;
    receipt += `=======================================\n`;

    let runningTotal = 0;
    reportData.transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const day = date.getDate();
      const debit = parseFloat(transaction.debitAmount || '0');
      const credit = parseFloat(transaction.creditAmount || '0');
      
      runningTotal += credit - debit;
      
      const debitStr = debit > 0 ? debit.toFixed(2) : '';
      const creditStr = credit > 0 ? credit.toFixed(2) : '';
      const totalStr = runningTotal.toFixed(2);
      
      receipt += ` ${day.toString().padStart(2, '0')}   ${transaction.type.padEnd(4)}  ${debitStr.padStart(7)}  ${creditStr.padStart(7)}  ${totalStr.padStart(8)}\n`;
    });

    receipt += `                               ________\n`;
    receipt += `                               ${runningTotal.toFixed(2).padStart(8)}\n`;
    receipt += `                               ========\n\n`;

    receipt += `=======================================\n`;
    receipt += `  SUMMARY                             \n`;
    receipt += `---------------------------------------\n`;
    receipt += ` Total Debit    :  ${reportData.totalDebit.toFixed(2).padStart(12)}\n`;
    receipt += ` Total Credit   :  ${reportData.totalCredit.toFixed(2).padStart(12)}\n`;
    receipt += ` Balance        :  ${(reportData.totalCredit - reportData.totalDebit).toFixed(2).padStart(12)}\n`;
    receipt += `---------------------------------------\n`;
    
    // Add type summary
    receipt += ` TRANSACTION TYPES                   \n`;
    Object.entries(reportData.typeSummary).forEach(([type, count]) => {
      receipt += ` ${type.padEnd(12)} :  ${count.toString().padStart(12)}\n`;
    });
    
    receipt += `---------------------------------------\n`;
    receipt += ` TAX INFORMATION                     \n`;
    receipt += ` Taxable Income :  ${reportData.taxableAmount.toFixed(2).padStart(12)}\n`;
    receipt += ` Tax-Exempt     :  ${reportData.taxExemptAmount.toFixed(2).padStart(12)}\n`;
    receipt += `=======================================\n`;

    return receipt;
  }

  static generateYearlyThermalReceipt(reportData: YearlyReportData): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Convert year to Buddhist Era if it's in Christian Era
    const displayYear = reportData.year < 2500 ? reportData.year + 543 : reportData.year;

    let receipt = '';
    receipt += `      YEARLY ACCOUNT REPORT ${displayYear}\n\n`;
    receipt += `=======================================\n`;
    receipt += `Month    Debit   Credit   Balance Count\n`;
    receipt += `=======================================\n`;

    reportData.monthlyBreakdown.forEach((monthData, index) => {
      if (monthData.transactionCount > 0) {
        const monthName = monthNames[index];
        const debitStr = monthData.totalDebit.toFixed(2);
        const creditStr = monthData.totalCredit.toFixed(2);
        const balanceStr = monthData.balance.toFixed(2);
        const countStr = monthData.transactionCount.toString();
        
        receipt += ` ${monthName}   ${debitStr.padStart(7)}  ${creditStr.padStart(7)}  ${balanceStr.padStart(7)}  ${countStr.padStart(3)}\n`;
      }
    });

    receipt += `=======================================\n`;
    receipt += `  YEARLY SUMMARY                      \n`;
    receipt += `---------------------------------------\n`;
    receipt += ` Total Debit    :  ${reportData.totalDebit.toFixed(2).padStart(12)}\n`;
    receipt += ` Total Credit   :  ${reportData.totalCredit.toFixed(2).padStart(12)}\n`;
    receipt += ` Net Balance    :  ${reportData.balance.toFixed(2).padStart(12)}\n`;
    receipt += `---------------------------------------\n`;
    
    // Add type summary
    receipt += ` TRANSACTION TYPES                   \n`;
    Object.entries(reportData.typeSummary).forEach(([type, count]) => {
      receipt += ` ${type.padEnd(12)} :  ${count.toString().padStart(12)}\n`;
    });
    
    receipt += `---------------------------------------\n`;
    receipt += ` TAX INFORMATION                     \n`;
    receipt += ` Taxable Income :  ${reportData.taxableAmount.toFixed(2).padStart(12)}\n`;
    receipt += ` Tax-Exempt     :  ${reportData.taxExemptAmount.toFixed(2).padStart(12)}\n`;
    receipt += `=======================================\n`;

    return receipt;
  }
}
