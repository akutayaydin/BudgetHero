import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recurringMerchants = pgTable("recurring_merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantName: text("merchant_name").notNull(),
  normalizedName: text("normalized_name").notNull(), // For matching logic
  category: text("category").notNull(),
  transactionType: text("transaction_type").notNull(), // 'utility', 'subscription', 'credit_card', 'large_recurring', 'excluded'
  frequency: text("frequency"), // 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  autoDetected: boolean("auto_detected").default(false), // Whether this was auto-generated
  confidence: text("confidence"), // 'high', 'medium', 'low'
  notes: text("notes"),
  patterns: text("patterns"), // JSON array of regex patterns for matching
  excludeFromBills: boolean("exclude_from_bills").default(false),
  notificationDays: text("notification_days").default("3"), // Days before due date to notify
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for creating/updating merchants via API (normalizedName is optional since it's generated server-side)
export const insertRecurringMerchantSchema = z.object({
  merchantName: z.string().min(1),
  category: z.string().min(1),
  transactionType: z.enum(['utility', 'subscription', 'credit_card', 'large_recurring', 'excluded']),
  frequency: z.string().optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  autoDetected: z.boolean().optional().default(false),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  notes: z.string().optional(),
  patterns: z.string().optional(),
  excludeFromBills: z.boolean().optional().default(false),
  notificationDays: z.string().optional().default("3"),
});

export type InsertRecurringMerchant = z.infer<typeof insertRecurringMerchantSchema>;
export type RecurringMerchant = typeof recurringMerchants.$inferSelect;