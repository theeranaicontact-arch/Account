import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 3 }).notNull(), // REG, SID, INV, OIC, TEX, ESS, DIS, DEB, SAV, OEX
  debitAmount: decimal("debit_amount", { precision: 10, scale: 2 }),
  creditAmount: decimal("credit_amount", { precision: 10, scale: 2 }),
  transactionDate: date("transaction_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
  airtableId: varchar("airtable_id").unique(), // For syncing with Airtable
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  airtableId: true,
}).extend({
  debitAmount: z.string().optional(),
  creditAmount: z.string().optional(),
  type: z.enum(['REG', 'SID', 'INV', 'OIC', 'TEX', 'ESS', 'DIS', 'DEB', 'SAV', 'OEX']),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Transaction type categories and tax info
export const INCOME_TYPES = ['REG', 'SID', 'INV', 'OIC', 'TEX'] as const;
export const EXPENSE_TYPES = ['ESS', 'DIS', 'DEB', 'SAV', 'OEX'] as const;
export const TAXABLE_INCOME_TYPES = ['REG', 'SID', 'INV', 'OIC'] as const;
export const TAX_EXEMPT_INCOME_TYPES = ['TEX'] as const;

export const TRANSACTION_TYPE_INFO = {
  // Income types
  REG: { nameEn: 'Regular Income', nameTh: 'รายได้ประจำ (เงินเดือน, ค่าจ้าง, โบนัส)', taxable: true },
  SID: { nameEn: 'Side Income', nameTh: 'รายได้เสริม / งานพิเศษ', taxable: true },
  INV: { nameEn: 'Investment Income', nameTh: 'รายได้จากการลงทุน (หุ้น, ดอกเบี้ย, ปันผล)', taxable: true },
  OIC: { nameEn: 'Other Income', nameTh: 'รายได้อื่น ๆ (ของขวัญ, ขายทรัพย์สิน)', taxable: true },
  TEX: { nameEn: 'Tax-Exempt Income', nameTh: 'รายได้ที่ได้รับการยกเว้นภาษี', taxable: false },
  
  // Expense types
  ESS: { nameEn: 'Essential', nameTh: 'ค่าใช้จ่ายจำเป็น (อาหาร, ที่พัก, ค่าน้ำไฟ)', taxable: false },
  DIS: { nameEn: 'Discretionary', nameTh: 'ค่าใช้จ่ายไม่จำเป็น (ช้อปปิ้ง, ท่องเที่ยว)', taxable: false },
  DEB: { nameEn: 'Debt', nameTh: 'ชำระหนี้ / สินเชื่อ', taxable: false },
  SAV: { nameEn: 'Savings / Investment', nameTh: 'การออมเงิน / การลงทุน', taxable: false },
  OEX: { nameEn: 'Other Expense', nameTh: 'รายจ่ายอื่น ๆ (ของขวัญ, บริจาค, ค่าปรับ)', taxable: false },
} as const;
