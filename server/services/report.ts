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

export class ReportService {
  static generateMonthlyReport(transactions: Transaction[], month: number, year: number): ReportData {
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.transactionDate);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
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

    let receipt = '';
    receipt += `        account report ${reportData.year}\n\n`;
    receipt += `Month : ${monthNames[reportData.month - 1]}            Current : THB\n`;
    receipt += `——————————————————————————————————\n`;
    receipt += `Date Type Debit Credit          Total\n`;
    receipt += `——————————————————————————————————\n`;

    let runningTotal = 0;
    reportData.transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const day = date.getDate();
      const debit = parseFloat(transaction.debitAmount || '0');
      const credit = parseFloat(transaction.creditAmount || '0');
      
      runningTotal += credit - debit;
      
      const debitStr = debit > 0 ? debit.toString() : '';
      const creditStr = credit > 0 ? credit.toString() : '';
      
      receipt += `   -${day.toString().padStart(2)}    ${transaction.type}     ${debitStr.padStart(6)}    ${creditStr.padStart(8)}      ${runningTotal}\n`;
    });

    receipt += `                                —————-\n`;
    receipt += `                                  ${runningTotal}\n`;
    receipt += `                                —————-\n`;
    receipt += `——————————————————————————————————\n`;
    receipt += ` Debit ≈ ${reportData.totalDebit}        Taxable    Amount\n`;
    receipt += ` Credit ≈ ${reportData.totalCredit}                 —————-\n`;
    receipt += `                                  ${reportData.taxableAmount}\n`;
    
    // Add type summary
    Object.entries(reportData.typeSummary).forEach(([type, count]) => {
      receipt += ` ${type}    ≈     ${count}                —————-\n`;
    });
    
    receipt += `           Tax-Exempt Income\n`;
    receipt += `              1                —————-\n`;
    receipt += `                                     ${reportData.taxExemptAmount}\n`;
    receipt += `                                —————-\n`;

    return receipt;
  }
}
