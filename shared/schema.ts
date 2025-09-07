import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, index, jsonb, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Financial institutions (banks, credit unions, etc.)
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logo: text("logo"),
  primaryColor: varchar("primary_color", { length: 7 }),
  url: text("url"),
  plaidInstitutionId: text("plaid_institution_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank accounts and financial accounts
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  institutionId: varchar("institution_id"),
  externalAccountId: text("external_account_id"), // Plaid/Teller account ID
  accessToken: text("access_token"), // Plaid access token
  plaidAccountId: text("plaid_account_id"), // Plaid-specific account ID
  name: text("name").notNull(),
  officialName: text("official_name"),
  type: varchar("type", { length: 50 }).notNull(), // checking, savings, credit, loan, investment
  subtype: varchar("subtype", { length: 50 }),
  mask: varchar("mask", { length: 10 }), // Last 4 digits
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }),
  availableBalance: decimal("available_balance", { precision: 12, scale: 2 }),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  balance: decimal("balance", { precision: 12, scale: 2 }), // Legacy balance field for compatibility
  institutionName: text("institution_name"), // Cached institution name for performance
  isActive: boolean("is_active").default(true),
  connectionSource: varchar("connection_source", { length: 20 }).default("manual"), // manual, plaid, teller
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  rawAmount: decimal("raw_amount", { precision: 10, scale: 2 }).notNull(), // signed amount from bank
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // absolute value for display
  categoryId: varchar("category_id"),
  category: text("category").notNull(), // fallback for legacy data
  type: text("type", { enum: ["income", "expense"] }).notNull(), // legacy field
  merchant: text("merchant"),
  accountId: varchar("account_id"), // which account this transaction belongs to
  userId: varchar("user_id"),
  externalTransactionId: text("external_transaction_id"), // Plaid/Teller transaction ID
  isPending: boolean("is_pending").default(false),
  source: varchar("source", { length: 20 }).default("manual"), // manual, plaid, teller, csv
  plaidCategory: jsonb("plaid_category"), // Plaid's category array (legacy)
  plaidPersonalFinanceCategory: jsonb("plaid_personal_finance_category"), // Plaid's structured personal finance category
  plaidAccountId: text("plaid_account_id"), // Plaid's account identifier
  authorizedDate: timestamp("authorized_date"), // Date transaction was authorized (can differ from date)
  isoCurrencyCode: varchar("iso_currency_code", { length: 3 }), // Currency code (USD, EUR, etc.)
  paymentChannel: varchar("payment_channel", { length: 20 }), // in store, online, other
  // Enhanced Plaid fields for comprehensive transaction metadata
  personalFinanceCategoryPrimary: text("personal_finance_category_primary"), // Primary category (e.g., "FOOD_AND_DRINK")
  personalFinanceCategoryDetailed: text("personal_finance_category_detailed"), // Detailed category (e.g., "FOOD_AND_DRINK_RESTAURANTS")
  personalFinanceCategoryConfidence: text("personal_finance_category_confidence"), // Confidence level (VERY_HIGH, HIGH, MEDIUM, LOW)
  locationJson: text("location_json"), // JSON string with location data (address, city, state, lat/lng)
  paymentMetaJson: text("payment_meta_json"), // JSON string with payment metadata (reference numbers, processor info)
  ignoreType: text("ignore_type").default("none"), // none, budget, everything
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin-controlled main categories with enhanced Plaid integration
export const adminCategories = pgTable("admin_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subcategory: text("subcategory"), // Subcategory name (e.g., "Paychecks", "Gas", "Coffee Shops")
  ledgerType: text("ledger_type", { 
    enum: ["INCOME", "EXPENSE", "TRANSFER", "DEBT_CREDIT", "ADJUSTMENT"] 
  }).notNull(),
  budgetType: text("budget_type", { 
    enum: ["FIXED", "FLEXIBLE", "NON_MONTHLY"] 
  }).notNull().default("FLEXIBLE"),
  plaidPrimary: text("plaid_primary"), // Plaid primary category (e.g., "FOOD_AND_DRINK")
  plaidDetailed: text("plaid_detailed"), // Plaid detailed category (e.g., "FOOD_AND_DRINK_RESTAURANTS")
  description: text("description"),
  parentId: varchar("parent_id"),
  color: text("color").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-specific merchant overrides and subcategories
export const userMerchantOverrides = pgTable("user_merchant_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  adminCategoryId: varchar("admin_category_id").notNull(), // references admin_categories
  subcategoryName: text("subcategory_name"), // optional user-defined subcategory
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"), // 1.0 for user overrides
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User recurring transaction overrides - allows users to manually mark merchants as recurring/non-recurring
export const userRecurringOverrides = pgTable("user_recurring_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  merchantName: text("merchant_name").notNull(), // Normalized merchant name
  originalMerchant: text("original_merchant"), // Original transaction description/merchant
  recurringStatus: text("recurring_status", { enum: ["recurring", "non-recurring"] }).notNull(),
  applyToAll: boolean("apply_to_all").default(true), // Apply to all transactions from this merchant
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"), // User override confidence
  reason: text("reason"), // Optional reason from user
  
  // Rule metadata for automation
  ruleType: text("rule_type").default("recurring_override"), // Type of automation rule
  isActive: boolean("is_active").default(true),
  appliedCount: integer("applied_count").default(0), // How many times this rule has been applied
  
  // Transaction context that triggered the override
  triggerTransactionId: varchar("trigger_transaction_id"), // Transaction that triggered this override
  relatedTransactionCount: integer("related_transaction_count").default(0), // Number of related transactions
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userMerchantIndex: index("user_recurring_overrides_user_merchant_idx").on(table.userId, table.merchantName),
  userIdIndex: index("user_recurring_overrides_user_id_idx").on(table.userId),
}));

// Legacy categories table (kept for backward compatibility)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ledgerType: text("ledger_type", { 
    enum: ["INCOME", "EXPENSE", "TRANSFER", "DEBT_PRINCIPAL", "DEBT_INTEREST", "ADJUSTMENT"] 
  }).notNull(),
  color: text("color").notNull(),
  isDefault: text("is_default").default("false"), // for system-provided categories
  userId: varchar("user_id"), // null for system categories
  createdAt: timestamp("created_at").defaultNow(),
});

// Transaction categorization metadata
export const transactionCategorizationMeta = pgTable("transaction_categorization_meta", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  adminCategoryId: varchar("admin_category_id"),
  userMerchantOverrideId: varchar("user_merchant_override_id"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  categorizedBy: varchar("categorized_by", { length: 20 }).default("system"), // system, user, admin
  needsReview: boolean("needs_review").default(false), // for low-confidence transactions
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  limit: decimal("limit", { precision: 10, scale: 2 }).notNull(),
  spent: decimal("spent", { precision: 10, scale: 2 }).notNull().default("0"),
  userId: varchar("user_id"),
  category: text("category"),
  rationale: text("rationale"), // Explanation of why this amount was chosen
  budgetType: varchar("budget_type", { length: 20 }).default("manual"), // manual, wizard-generated
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetPlans = pgTable("budget_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  month: varchar("month").notNull(), // YYYY-MM
  expectedEarnings: decimal("expected_earnings", { precision: 10, scale: 2 }).notNull(),
  expectedBills: decimal("expected_bills", { precision: 10, scale: 2 }).notNull(),
  savingsRate: integer("savings_rate").notNull(),
  savingsReserve: decimal("savings_reserve", { precision: 10, scale: 2 }).notNull(),
  spendingBudget: decimal("spending_budget", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  target: decimal("target", { precision: 10, scale: 2 }).notNull(),
  saved: decimal("saved", { precision: 10, scale: 2 }).notNull().default("0"),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  authProvider: varchar("auth_provider", { length: 20 }).default("local"), // local, google, github, microsoft, replit
  authProviderId: text("auth_provider_id"), // OAuth provider user ID
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingSkipped: boolean("onboarding_skipped").default(false),
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("free").notNull(), // free, active, canceled, past_due, trialing
  subscriptionPlan: text("subscription_plan").default("free").notNull(), // free, pro
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  trialRemindersSent: jsonb("trial_reminders_sent").default("[]"), // Array of reminder types sent
  lastTrialReminderAt: timestamp("last_trial_reminder_at"),
  // Bill notification settings
  billNotificationsEnabled: boolean("bill_notifications_enabled").default(true),
  billNotificationDays: integer("bill_notification_days").default(3), // Days before due date
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("password_reset_tokens_user_id_idx").on(table.userId),
  tokenIndex: index("password_reset_tokens_token_idx").on(table.token),
}));

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  interval: text("interval").default("month").notNull(), // month, year
  trialDays: integer("trial_days").default(0),
  stripePriceId: text("stripe_price_id"),
  features: jsonb("features").default("[]"), // JSON array of feature strings
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets - things the user owns
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // real_estate, vehicle, cash_equivalent, investment
  subtype: varchar("subtype", { length: 50 }).notNull(), // house, car, cash, stocks, etc.
  currentValue: decimal("current_value", { precision: 12, scale: 2 }).notNull(),
  purchaseValue: decimal("purchase_value", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  description: text("description"),
  notes: text("notes"),
  includeInNetWorth: boolean("include_in_net_worth").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Liabilities - debts and obligations
export const liabilities = pgTable("liabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // mortgage, auto_loan, credit_card, personal_loan, other
  subtype: varchar("subtype", { length: 50 }).notNull(), // primary_mortgage, car_loan, visa, etc.
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }), // percentage
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }),
  minimumPayment: decimal("minimum_payment", { precision: 10, scale: 2 }),
  dueDate: timestamp("due_date"),
  payoffDate: timestamp("payoff_date"),
  description: text("description"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recurring transactions and subscriptions management
export const recurringTransactions = pgTable("recurring_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(), // User-defined name (e.g., "Netflix", "Electric Bill")
  merchant: text("merchant"), // Auto-detected merchant from transactions
  category: text("category").notNull(),
  categoryId: varchar("category_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, weekly, yearly, quarterly, etc.
  frequencyDays: integer("frequency_days"), // For custom frequencies (e.g., every 30 days)
  nextDueDate: timestamp("next_due_date"),
  lastTransactionDate: timestamp("last_transaction_date"),
  isActive: boolean("is_active").default(true),
  isRecurring: boolean("is_recurring").default(true),
  ignoreType: text("ignore_type").default("none"), // none, budgets, everything
  tags: jsonb("tags").default("[]"), // Array of user tags
  notes: text("notes"),
  notificationDays: integer("notification_days").default(3), // Days before due date to notify
  linkedTransactionIds: jsonb("linked_transaction_ids").default("[]"), // Array of transaction IDs
  accountId: varchar("account_id"), // Primary account for this recurring item
  autoDetected: boolean("auto_detected").default(false), // Whether this was auto-detected from transactions
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // Confidence score for auto-detection (0-1)
  merchantLogo: text("merchant_logo"), // URL to merchant logo (Clearbit or custom)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("recurring_transactions_user_id_idx").on(table.userId),
  nextDueDateIndex: index("recurring_transactions_next_due_date_idx").on(table.nextDueDate),
}));

// Bill notifications and alerts
export const billNotifications = pgTable("bill_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  billId: varchar("bill_id").notNull(), // recurring transaction or manual subscription ID
  billName: text("bill_name"),
  billType: text("bill_type"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  dueDate: timestamp("due_date"),
  scheduledFor: timestamp("scheduled_for").notNull(), // When to send the notification
  notificationDate: timestamp("notification_date"), // Legacy column
  notificationType: text("notification_type").notNull(), // upcoming, overdue, paid
  method: text("method").notNull(), // email, in_app, both
  status: text("status").default("pending").notNull(), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("bill_notifications_user_id_idx").on(table.userId),
  scheduledForIndex: index("bill_notifications_scheduled_for_idx").on(table.scheduledFor),
  dueDateIndex: index("bill_notifications_due_date_idx").on(table.dueDate),
  statusIndex: index("bill_notifications_status_idx").on(table.status),
}));

// Manual subscriptions and free trials
export const manualSubscriptions = pgTable("manual_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  frequency: text("frequency").notNull(), // monthly, yearly, one_time
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // For free trials or limited subscriptions
  isTrial: boolean("is_trial").default(false),
  trialEndsAt: timestamp("trial_ends_at"),
  category: text("category").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  linkedRecurringTransactionId: varchar("linked_recurring_transaction_id"), // Link to detected recurring transaction
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderDays: integer("reminder_days").default(7), // Days before trial ends
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("manual_subscriptions_user_id_idx").on(table.userId),
  trialEndsAtIndex: index("manual_subscriptions_trial_ends_at_idx").on(table.trialEndsAt),
}));

// Transaction categorization rules
export const categorizationRules = pgTable("categorization_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ruleName: text("rule_name").notNull(),
  merchantPattern: text("merchant_pattern"), // Pattern to match merchant names
  descriptionPattern: text("description_pattern"), // Pattern to match descriptions
  amountMin: decimal("amount_min", { precision: 10, scale: 2 }),
  amountMax: decimal("amount_max", { precision: 10, scale: 2 }),
  category: text("category").notNull(),
  categoryId: varchar("category_id"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority rules are applied first
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("categorization_rules_user_id_idx").on(table.userId),
}));

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);



// Transaction Tags - Custom user tags for filtering and reporting
export const transactionTags = pgTable("transaction_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"), // Default indigo color
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Tag Assignments - Many-to-many relationship between transactions and tags
export const transactionTagAssignments = pgTable("transaction_tag_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  tagId: varchar("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Automation Rules - User-defined rules for auto-categorization and tagging
export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority rules are evaluated first
  
  // Rule conditions
  merchantPattern: text("merchant_pattern"), // Pattern to match merchant names
  descriptionPattern: text("description_pattern"), // Pattern to match descriptions
  amountMin: decimal("amount_min", { precision: 10, scale: 2 }), // Minimum amount
  amountMax: decimal("amount_max", { precision: 10, scale: 2 }), // Maximum amount
  transactionType: text("transaction_type", { enum: ["income", "expense", "both"] }).default("both"),
  
  // Rule actions
  setCategoryId: varchar("set_category_id"), // Auto-assign category
  addTagIds: text("add_tag_ids").array(), // Auto-assign tags (array of tag IDs)
  renameTransactionTo: text("rename_transaction_to"), // Rename transaction description
  ignoreTransaction: boolean("ignore_transaction").default(false), // Hide/ignore transaction completely
  ignoreForBudgeting: boolean("ignore_for_budgeting").default(false), // Exclude from budget calculations
  ignoreForReporting: boolean("ignore_for_reporting").default(false), // Exclude from reports
  
  // Action toggles for UI
  enableCategoryChange: boolean("enable_category_change").default(false),
  enableRename: boolean("enable_rename").default(false),
  enableTagging: boolean("enable_tagging").default(false),
  enableIgnore: boolean("enable_ignore").default(false),
  
  // Metadata
  appliedCount: integer("applied_count").default(0), // Number of times rule has been applied
  lastAppliedAt: timestamp("last_applied_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Splits - Split transactions into multiple parts while maintaining original record
export const transactionSplits = pgTable("transaction_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalTransactionId: varchar("original_transaction_id").notNull(), // Reference to original transaction
  userId: varchar("user_id").notNull(),
  
  // Split details
  description: text("description").notNull(), // Description for this split part
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount for this split
  categoryId: varchar("category_id"), // Category for this split
  category: text("category"), // Fallback category name
  tagIds: text("tag_ids").array(), // Tags for this split (array of tag IDs)
  notes: text("notes"), // Optional notes for this split
  
  // Metadata
  splitOrder: integer("split_order").default(0), // Order of this split within the transaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ledger types for proper financial classification
export type LedgerType = "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_PRINCIPAL" | "DEBT_INTEREST" | "ADJUSTMENT";

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  description: z.string(),
  rawAmount: z.number().optional(), // signed amount from bank
  amount: z.string(),
  categoryId: z.string().optional(),
  category: z.string(), // fallback for legacy data
  type: z.enum(["income", "expense"]),
  merchant: z.string().optional(),
  accountId: z.string().optional(),
  userId: z.string().nullable().optional(),
  externalTransactionId: z.string().optional(),
  isPending: z.boolean().optional(),
  source: z.enum(["manual", "plaid", "teller", "csv"]).optional(),
  plaidCategory: z.string().optional(),
  plaidPersonalFinanceCategory: z.string().optional(),
  plaidAccountId: z.string().optional(),
  authorizedDate: z.union([z.string(), z.date()]).transform((val) => val instanceof Date ? val : new Date(val)).optional(),
  isoCurrencyCode: z.string().optional(),
  paymentChannel: z.string().optional(),
  personalFinanceCategoryPrimary: z.string().optional(),
  personalFinanceCategoryDetailed: z.string().optional(),
  personalFinanceCategoryConfidence: z.string().optional(),
  locationJson: z.string().optional(),
  paymentMetaJson: z.string().optional(),
});

// More lenient schema for updates - allows flexible data types and null values
export const updateTransactionSchema = z.object({
  date: z.union([z.string(), z.date()]).optional(),
  description: z.string().optional(),
  rawAmount: z.union([z.number(), z.string()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  categoryId: z.string().nullable().optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  merchant: z.string().nullable().optional(), // Allow null values
  accountId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  externalTransactionId: z.string().nullable().optional(),
  isPending: z.boolean().optional(),
  source: z.enum(["manual", "plaid", "teller", "csv"]).optional(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetPlanSchema = z.object({
  month: z.string(),
  expectedEarnings: z.coerce.number(),
  expectedBills: z.coerce.number(),
  savingsRate: z.coerce.number(),
  // These fields are calculated server-side and may not be supplied by the client
  savingsReserve: z.coerce.number().optional(),
  spendingBudget: z.coerce.number().optional(),
});

export type InsertBudgetPlan = z.infer<typeof insertBudgetPlanSchema>;

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertAdminCategorySchema = createInsertSchema(adminCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMerchantOverrideSchema = createInsertSchema(userMerchantOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRecurringOverrideSchema = createInsertSchema(userRecurringOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for user recurring overrides
export type UserRecurringOverride = typeof userRecurringOverrides.$inferSelect;
export type InsertUserRecurringOverride = z.infer<typeof insertUserRecurringOverrideSchema>;

export const insertTransactionCategorizationMetaSchema = createInsertSchema(transactionCategorizationMeta).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  onboardingSkipped: true,
  isAdmin: true,
}).partial();

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export const insertLiabilitySchema = createInsertSchema(liabilities).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactions).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export const insertBillNotificationSchema = createInsertSchema(billNotifications).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
});

export const insertManualSubscriptionSchema = createInsertSchema(manualSubscriptions).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertCategorizationRuleSchema = createInsertSchema(categorizationRules).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionTagSchema = createInsertSchema(transactionTags).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionTagAssignmentSchema = createInsertSchema(transactionTagAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  userId: true, // Server will add this
  appliedCount: true,
  lastAppliedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSplitSchema = createInsertSchema(transactionSplits).omit({
  id: true,
  userId: true, // Server will add this
  createdAt: true,
  updatedAt: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertAdminCategory = z.infer<typeof insertAdminCategorySchema>;
export type AdminCategory = typeof adminCategories.$inferSelect;
export type InsertUserMerchantOverride = z.infer<typeof insertUserMerchantOverrideSchema>;
export type UserMerchantOverride = typeof userMerchantOverrides.$inferSelect;
export type InsertTransactionCategorizationMeta = z.infer<typeof insertTransactionCategorizationMetaSchema>;
export type TransactionCategorizationMeta = typeof transactionCategorizationMeta.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type BudgetPlan = typeof budgetPlans.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertLiability = z.infer<typeof insertLiabilitySchema>;
export type Liability = typeof liabilities.$inferSelect;
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertBillNotification = z.infer<typeof insertBillNotificationSchema>;
export type BillNotification = typeof billNotifications.$inferSelect;
export type InsertManualSubscription = z.infer<typeof insertManualSubscriptionSchema>;
export type ManualSubscription = typeof manualSubscriptions.$inferSelect;
export type InsertCategorizationRule = z.infer<typeof insertCategorizationRuleSchema>;
export type CategorizationRule = typeof categorizationRules.$inferSelect;
export type InsertTransactionTag = z.infer<typeof insertTransactionTagSchema>;
export type TransactionTag = typeof transactionTags.$inferSelect;
export type InsertTransactionTagAssignment = z.infer<typeof insertTransactionTagAssignmentSchema>;
export type TransactionTagAssignment = typeof transactionTagAssignments.$inferSelect;
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertTransactionSplit = z.infer<typeof insertTransactionSplitSchema>;
export type TransactionSplit = typeof transactionSplits.$inferSelect;

export const transactionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  search: z.string().optional(),
  merchant: z.string().optional(),
  account: z.string().optional(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

// Budget Wizard Types
export const budgetWizardSchema = z.object({
  // Household information
  relationship: z.enum(["single", "couple", "family"]),
  dependents: z.enum(["no-kids", "kids-0-5", "kids-6-12", "teens-13-17"]),
  adultsWorking: z.number().min(1).max(2),
  
  // Location
  zipCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  
  // Income
  netMonthlyIncome: z.number().positive(),
  
  // Housing
  rentOrMortgage: z.number().nonnegative(),
  utilities: z.number().nonnegative().optional(),
  
  // Transportation
  transportType: z.enum(["car", "public", "mixed"]),
  monthlyMiles: z.number().nonnegative().optional(), // For car
  transitPassCost: z.number().nonnegative().optional(), // For public transit
  
  // Childcare
  childcareType: z.enum(["none", "family", "family-care", "center"]).optional(),
  childcareHours: z.enum(["part-time", "full-time"]).optional(),
  
  // Savings & Debt
  emergencyFundMonths: z.number().min(1).max(6).default(3),
  debtMinimums: z.number().nonnegative().default(0),
  
  // Subscriptions
  streaming: z.number().nonnegative().default(0),
  phone: z.number().nonnegative().default(0),
  internet: z.number().nonnegative().default(0),
  gym: z.number().nonnegative().default(0),
});

export type BudgetWizardData = z.infer<typeof budgetWizardSchema>;

// Events tracking for KPIs and analytics
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // sync_start, sync_complete, reauth_shown, reauth_completed, digest_viewed, tile_view, tile_click
  eventData: jsonb("event_data"), // Additional data like latency, tile_type, institution_id, etc.
  institutionId: varchar("institution_id"), // For sync-related events
  latencyMs: integer("latency_ms"), // For performance tracking
  success: boolean("success"), // For error tracking
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sync status tracking per institution
export const syncStatus = pgTable("sync_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // success, failed, reauth_required, pending
  lastSyncAt: timestamp("last_sync_at"),
  lastSuccessAt: timestamp("last_success_at"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  nextRetryAt: timestamp("next_retry_at"),
  errorMessage: text("error_message"),
  newTransactionsCount: integer("new_transactions_count").default(0),
  updatedTransactionsCount: integer("updated_transactions_count").default(0),
  duplicatesRemovedCount: integer("duplicates_removed_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// APY offers tracking
export const apyOffers = pgTable("apy_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bank: text("bank").notNull(),
  productName: text("product_name").notNull(),
  apyPct: decimal("apy_pct", { precision: 5, scale: 2 }).notNull(),
  apyBps: integer("apy_bps").notNull(),
  minDeposit: decimal("min_deposit", { precision: 10, scale: 2 }).default("0"),
  directDepositRequired: boolean("direct_deposit_required").default(false),
  monthlyFee: decimal("monthly_fee", { precision: 6, scale: 2 }).default("0"),
  productUrl: text("product_url"),
  sourceUrl: text("source_url"),
  asOfDate: timestamp("as_of_date").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bills and subscriptions tracking
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // bill, subscription, recurring_payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // monthly, yearly, weekly, quarterly
  nextDueDate: timestamp("next_due_date"),
  categoryId: varchar("category_id"),
  isActive: boolean("is_active").default(true),
  autoDetected: boolean("auto_detected").default(false), // If detected from transaction patterns
  merchantName: text("merchant_name"),
  lastChargeTransactionId: varchar("last_charge_transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertSyncStatusSchema = createInsertSchema(syncStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApyOfferSchema = createInsertSchema(apyOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertSyncStatus = z.infer<typeof insertSyncStatusSchema>;
export type SyncStatus = typeof syncStatus.$inferSelect;
export type InsertApyOffer = z.infer<typeof insertApyOfferSchema>;
export type ApyOffer = typeof apyOffers.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Password reset schemas
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// Recurring Merchant Configuration for Admin Panel
export const recurringMerchants = pgTable("recurring_merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  notificationDays: integer("notification_days").default(3), // Days before due date to notify
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRecurringMerchantSchema = createInsertSchema(recurringMerchants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecurringMerchant = z.infer<typeof insertRecurringMerchantSchema>;
export type RecurringMerchant = typeof recurringMerchants.$inferSelect;
