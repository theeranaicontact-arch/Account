import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { airtableService } from "./services/airtable";
import { ReportService } from "./services/report";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
// Added: import puppeteer to allow rendering receipts as highâ€‘resolution PNGs
import puppeteer from "puppeteer";

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

      // Save to local storage (with duplicate prevention)
      const transaction = await storage.createTransaction(validatedData);

      // Auto-sync to Airtable
      try {
        const airtableRecord = await airtableService.createRecord({
          Type: validatedData.type,
          Debit: validatedData.debitAmount
            ? parseFloat(validatedData.debitAmount)
            : undefined,
          Credit: validatedData.creditAmount
            ? parseFloat(validatedData.creditAmount)
            : undefined,
          Date: validatedData.transactionDate,
          Notes: validatedData.notes || undefined,
        });

        // Update with Airtable ID if successful
        if (airtableRecord) {
          await storage.updateTransaction(transaction.id, {
            airtableId: airtableRecord.id,
          } as any);
        }
      } catch (airtableError) {
        console.error("Failed to auto-sync to Airtable:", airtableError);
        // Continue without failing the request - data still saved locally
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else if (
        error instanceof Error &&
        error.message.includes("Duplicate transaction")
      ) {
        res.status(409).json({ error: "à¸£à¸²à¸¢à¸à¸²à¸£à¸™à¸µà¹‰à¸–à¸¹à¸à¹€à¸žà¸´à¹ˆà¸¡à¹„à¸›à¹à¸¥à¹‰à¸§à¹€à¸¡à¸·à¹ˆà¸­à¸ªà¸±à¸à¸„à¸£à¸¹à¹ˆ" });
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

  // Generate yearly report
  app.get("/api/reports/yearly/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid year" });
      }
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateYearlyReport(transactions, year);
      res.json(reportData);
    } catch (error) {
      console.error("Error generating yearly report:", error);
      res.status(500).json({ error: "Failed to generate yearly report" });
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

  // Generate yearly thermal receipt
  app.get("/api/reports/thermal-yearly/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid year" });
      }
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateYearlyReport(transactions, year);
      const thermalReceipt = ReportService.generateYearlyThermalReceipt(reportData);
      res.json({ receipt: thermalReceipt, reportData });
    } catch (error) {
      console.error("Error generating yearly thermal receipt:", error);
      res.status(500).json({ error: "Failed to generate yearly thermal receipt" });
    }
  });

  // Added: Generate highâ€‘resolution PNG of thermal receipt
  // This endpoint returns the receipt for a monthly report rendered as a PNG image.
  app.get("/api/reports/thermal-image/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateMonthlyReport(transactions, month, year);
      const thermalReceipt = ReportService.generateThermalReceipt(reportData);
      // Build simple HTML with monospace font to preserve layout
      const html = `
        <html>
        <head>
          <style>
            body {
              font-family: "Courier New", monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              white-space: pre;
            }
          </style>
        </head>
        <body>${thermalReceipt}</body>
        </html>
      `;
      // Launch headless browser and render HTML to PNG
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      // For high resolution, set a deviceScaleFactor > 1
      await page.setViewport({ width: 384, height: 1000, deviceScaleFactor: 4 });
      await page.setContent(html);
      const imageBuffer = await page.screenshot({ type: "png", fullPage: true });
      await browser.close();
      res.setHeader("Content-Type", "image/png");
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error generating thermal image:", error);
      res.status(500).json({ error: "Failed to generate thermal image" });
    }
  });

  // Generate yearly thermal receipt image (similar to monthly)
  app.get("/api/reports/thermal-image-yearly/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid year" });
      }
      const transactions = await storage.getTransactions();
      const reportData = ReportService.generateYearlyReport(transactions, year);
      const thermalReceipt = ReportService.generateYearlyThermalReceipt(reportData);
      const html = `
        <html>
        <head>
          <style>
            body {
              font-family: "Courier New", monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              white-space: pre;
            }
          </style>
        </head>
        <body>${thermalReceipt}</body>
        </html>
      `;
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 384, height: 1200, deviceScaleFactor: 4 });
      await page.setContent(html);
      const imageBuffer = await page.screenshot({ type: "png", fullPage: true });
      await browser.close();
      res.setHeader("Content-Type", "image/png");
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error generating yearly thermal image:", error);
      res.status(500).json({ error: "Failed to generate yearly thermal image" });
    }
  });

  // Sync with Airtable (pull from Airtable only)
  app.post("/api/sync/airtable", async (req, res) => {
    try {
      const airtableRecords = await airtableService.getAllRecords();
      let syncedCount = 0;
      // Clear existing data first to ensure only Airtable data
      const existingTransactions = await storage.getTransactions();
      for (const transaction of existingTransactions) {
        await storage.deleteTransaction(transaction.id);
      }
      // Only sync data from Airtable
      if (airtableRecords.length === 0) {
        res.json({ message: "à¹„à¸¡à¹ˆà¸žà¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸™ Airtable à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¹„à¸”à¹‰" });
        return;
      }
      for (const record of airtableRecords) {
        try {
          const transaction = {
            type: record.fields.Type,
            debitAmount: record.fields.Debit?.toString() || undefined,
            creditAmount: record.fields.Credit?.toString() || undefined,
            transactionDate: record.fields.Date,
            notes: record.fields.Notes || undefined,
            airtableId: record.id,
          };
          await storage.createTransaction(transaction as any);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync record ${record.id}:`, error);
        }
      }
      res.json({ message: `à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ ${syncedCount} à¸£à¸²à¸¢à¸à¸²à¸£à¸ˆà¸²à¸ Airtable` });
    } catch (error) {
      console.error("Error syncing with Airtable:", error);
      res.status(500).json({ error: "à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸à¸±à¸š Airtable à¹„à¸”à¹‰" });
    }
  });

  // Push local data to Airtable
  app.post("/api/sync/push-to-airtable", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const unsynced = transactions.filter((t) => !t.airtableId);
      let pushedCount = 0;
      if (unsynced.length === 0) {
        res.json({ message: "à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸«à¸¡à¹ˆà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸ªà¹ˆà¸‡à¹„à¸› Airtable" });
        return;
      }
      for (const transaction of unsynced) {
        try {
          const airtableRecord = await airtableService.createRecord({
            Type: transaction.type,
            Debit: transaction.debitAmount
              ? parseFloat(transaction.debitAmount)
              : undefined,
            Credit: transaction.creditAmount
              ? parseFloat(transaction.creditAmount)
              : undefined,
            Date: transaction.transactionDate,
            Notes: transaction.notes || undefined,
          });
          // Update local record with Airtable ID if successful
          if (airtableRecord) {
            await storage.updateTransaction(transaction.id, {
              airtableId: airtableRecord.id,
            } as any);
            pushedCount++;
          }
        } catch (error) {
          console.error(`Failed to push transaction ${transaction.id}:`, error);
        }
      }
      if (pushedCount > 0) {
        res.json({ message: `à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ ${pushedCount} à¸£à¸²à¸¢à¸à¸²à¸£à¹„à¸› Airtable` });
      } else {
        res.json({ message: "à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸› Airtable à¹„à¸”à¹‰à¹ƒà¸™à¸‚à¸“à¸°à¸™à¸µà¹‰" });
      }
    } catch (error) {
      console.error("Error pushing to Airtable:", error);
      res.status(500).json({ error: "Failed to push to Airtable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}