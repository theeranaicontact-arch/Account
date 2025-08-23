import { type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;

  constructor() {
    this.transactions = new Map();
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return Array.from(this.transactions.values())
      .filter(transaction => {
        const date = new Date(transaction.transactionDate);
        return date >= start && date <= end;
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Check for duplicate transactions
    const isDuplicate = Array.from(this.transactions.values()).some(existing => 
      existing.type === insertTransaction.type &&
      existing.debitAmount === insertTransaction.debitAmount &&
      existing.creditAmount === insertTransaction.creditAmount &&
      existing.transactionDate === insertTransaction.transactionDate &&
      existing.notes === insertTransaction.notes &&
      // Check if created within last 5 seconds to prevent accidental double-clicks
      new Date().getTime() - new Date(existing.createdAt).getTime() < 5000
    );

    if (isDuplicate) {
      throw new Error('Duplicate transaction detected within 5 seconds');
    }

    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
      airtableId: null,
      debitAmount: insertTransaction.debitAmount || null,
      creditAmount: insertTransaction.creditAmount || null,
      notes: insertTransaction.notes || null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updateData: Partial<InsertTransaction>): Promise<Transaction> {
    const existing = this.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updated: Transaction = { ...existing, ...updateData };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }
}

export const storage = new MemStorage();