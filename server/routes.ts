import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { airtableService } from "./services/airtable";
import { ReportService } from "./services/report";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Save to local storage
      const transaction = await storage.createTransaction(validatedData);
      
      // Sync to Airtable
      try {
        const airtableRecord = await airtableService.createRecord({
          Type: validatedData.type,
          DebitAmount: validatedData.debitAmount ? parseFloat(validatedData.debitAmount) : undefined,
          CreditAmount: validatedData.creditAmount ? parseFloat(validatedData.creditAmount) : undefined,
          Date: validatedData.transactionDate,
          Notes: validatedData.notes || undefined,
        });
        
        // Update with Airtable ID
        await storage.updateTransaction(transaction.id, { airtableId: airtableRecord.id } as any);
      } catch (airtableError) {
        console.error("Failed to sync to Airtable:", airtableError);
        // Continue without failing the request
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction" });
      }
    }
  });

  // Generate monthly report
  app.get("/api/reports/monthly/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateMonthlyReport(transactions, month, year);
      
      res.json(reportData);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Generate thermal receipt format
  app.get("/api/reports/thermal/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateMonthlyReport(transactions, month, year);
      const thermalReceipt = ReportService.generateThermalReceipt(reportData);
      
      res.json({ receipt: thermalReceipt, reportData });
    } catch (error) {
      console.error("Error generating thermal receipt:", error);
      res.status(500).json({ error: "Failed to generate thermal receipt" });
    }
  });

  // Sync with Airtable (pull from Airtable)
  app.post("/api/sync/airtable", async (req, res) => {
    try {
      const airtableRecords = await airtableService.getAllRecords();
      let syncedCount = 0;
      
      for (const record of airtableRecords) {
        try {
          // Check if record already exists
          const existingTransactions = await storage.getTransactions();
          const exists = existingTransactions.some(t => t.airtableId === record.id);
          
          if (!exists) {
            const transaction = {
              type: record.fields.Type,
              debitAmount: record.fields.DebitAmount?.toString() || undefined,
              creditAmount: record.fields.CreditAmount?.toString() || undefined,
              transactionDate: record.fields.Date,
              notes: record.fields.Notes || undefined,
              airtableId: record.id,
            };
            
            await storage.createTransaction(transaction as any);
            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync record ${record.id}:`, error);
        }
      }
      
      res.json({ message: `ดึงข้อมูล ${syncedCount} รายการจาก Airtable` });
    } catch (error) {
      console.error("Error syncing with Airtable:", error);
      res.status(500).json({ error: "Failed to sync with Airtable" });
    }
  });

  // Push local data to Airtable
  app.post("/api/sync/push-to-airtable", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const unsynced = transactions.filter(t => !t.airtableId);
      let pushedCount = 0;

      for (const transaction of unsynced) {
        try {
          const airtableRecord = await airtableService.createRecord({
            Type: transaction.type,
            DebitAmount: transaction.debitAmount ? parseFloat(transaction.debitAmount) : undefined,
            CreditAmount: transaction.creditAmount ? parseFloat(transaction.creditAmount) : undefined,
            Date: transaction.transactionDate,
            Notes: transaction.notes || undefined,
          });
          
          // Update local record with Airtable ID
          await storage.updateTransaction(transaction.id, { airtableId: airtableRecord.id } as any);
          pushedCount++;
        } catch (error) {
          console.error(`Failed to push transaction ${transaction.id}:`, error);
        }
      }
      
      res.json({ message: `ส่งข้อมูล ${pushedCount} รายการไป Airtable` });
    } catch (error) {
      console.error("Error pushing to Airtable:", error);
      res.status(500).json({ error: "Failed to push to Airtable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
