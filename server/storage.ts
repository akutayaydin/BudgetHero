import { db, migrateDb } from "./db";
import { transactions, budgets, budgetPlans, goals, users, categories, institutions, accounts, subscriptionPlans, assets, liabilities, recurringTransactions, billNotifications, manualSubscriptions, categorizationRules, transactionTags, transactionTagAssignments, automationRules, transactionSplits, widgetLayouts } from "@shared/schema";
import { eq, and, gte, lte, like, or, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type {
  User, InsertUser, UpsertUser, Transaction, InsertTransaction, Category, InsertCategory,
  Budget, InsertBudget, BudgetPlan, InsertBudgetPlan, Goal, InsertGoal, TransactionFilters, Institution, InsertInstitution,
  Account, InsertAccount, Asset, InsertAsset, Liability, InsertLiability,
  RecurringTransaction, InsertRecurringTransaction, BillNotification, InsertBillNotification,
  ManualSubscription, InsertManualSubscription, CategorizationRule, InsertCategorizationRule,
  TransactionTag, InsertTransactionTag, TransactionTagAssignment, InsertTransactionTagAssignment,
  AutomationRule, InsertAutomationRule, TransactionSplit, InsertTransactionSplit,
  WidgetLayout, InsertWidgetLayout
} from "@shared/schema";
import { defaultCategories } from "../client/src/lib/transaction-classifier";

// Map legacy category names to the new taxonomy
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "Transportation": "Auto & Transport",
  "Rent & Utilities": "Bills & Utilities",
  "General Merchandise": "Shopping",
  "Home Improvement": "Home & Garden",
  "Travel": "Travel & Vacation",
//  "Personal Care": "Health & Wellness",
  "Subscriptions": "Bills & Utilities",
  "General Services: Childcare": "Family Care",
  "General Services: Automotive Services": "Auto & Transport",
  "Medical & Healthcare: Pets/Veterinary": "Pets",
  "Loan Payments: Credit Card": "Credit Card Payment",
  "Loan Payments: Credit Card Payment": "Credit Card Payment",
  "Food & Drink: Groceries": "Groceries",
};


// Map legacy admin category records (including subcategories) to the new taxonomy
const LEGACY_ADMIN_CATEGORY_RENAMES: Record<string, { name: string; subcategory?: string }> = {
  "Transportation": { name: "Auto & Transport" },
  "Rent & Utilities": { name: "Bills & Utilities" },
  "General Merchandise": { name: "Shopping" },
  "Home Improvement": { name: "Home & Garden" },
  "Travel": { name: "Travel & Vacation" },
//  "Personal Care": { name: "Health & Wellness" },
  "Subscriptions": { name: "Bills & Utilities" },
  "General Services: Childcare": { name: "Family Care", subcategory: "Childcare" },
  "General Services: Automotive Services": { name: "Auto & Transport", subcategory: "Automotive Services" },
  "Medical & Healthcare: Pets/Veterinary": { name: "Pets", subcategory: "Veterinary" },
  "Loan Payments: Credit Card": { name: "Credit Card Payment", subcategory: undefined },
  "Loan Payments: Credit Card Payment": { name: "Credit Card Payment", subcategory: undefined },
  "Food & Drink: Groceries": { name: "Groceries", subcategory: undefined },
};

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserOnboarding(userId: string, completed: boolean): Promise<User>;
  updateUserAvatar(userId: string, profileImageUrl: string | null): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: Partial<Pick<User, 'subscriptionStatus' | 'subscriptionPlan' | 'subscriptionEndsAt' | 'trialEndsAt' | 'trialRemindersSent' | 'lastTrialReminderAt'>>): Promise<User>;
  getSubscriptionPlans(): Promise<any[]>;
  getSubscriptionPlan(planId: string): Promise<any | undefined>;
  
  // Admin methods
  getAdminStats(): Promise<{
    totalUsers: number;
    totalTransactions: number;
    totalBudgets: number;
    totalAccounts: number;
    newUsersThisWeek: number;
    avgTransactionsPerUser: number;
  }>;
  getAdminAnalytics(): Promise<{
    conversionRates: {
      signupToFirstSync: number;
      signupToPaidUser: number;
      freeTrialToSubscription: number;
    };
    engagementPerAccount: {
      averageTransactionsPerAccount: number;
      averageAccountsPerUser: number;
      activeAccountsPercentage: number;
      lastSyncDistribution: Array<{ period: string; count: number }>;
    };
    retentionMetrics: {
      userRetention7Days: number;
      userRetention30Days: number;
      userRetention90Days: number;
      monthlyActiveUsers: number;
      dailyActiveUsers: number;
      averageSessionsPerUser: number;
    };
  }>;
  getAllUsersWithStats(): Promise<Array<User & {
    transactionCount: number;
    budgetCount: number;
    accountCount: number;
  }>>;
  resetUserData(userId: string): Promise<void>;

  // Transaction methods
  getTransactions(userId?: string, filters?: TransactionFilters): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  deleteManualTransactions(userId: string): Promise<number>;

  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getAdminCategories(): Promise<any[]>;

  // Budget methods
  getBudgets(userId?: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;

  // Budget plan methods
  getBudgetPlan(userId: string, month: string): Promise<BudgetPlan | undefined>;
  createBudgetPlan(plan: InsertBudgetPlan & { userId: string }): Promise<BudgetPlan>;
  upsertBudgetPlan(plan: InsertBudgetPlan & { userId: string }): Promise<BudgetPlan>;
  getIncomeEstimate(userId: string, months: number): Promise<{ average: number; months: { month: string; total: number }[] }>;
  getBillsEstimate(userId: string, months: number): Promise<{ average: number; candidates: any[] }>;
  
  // Goal methods
  getGoals(userId?: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;

  // Institution methods
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;

  // Account methods
  getAccounts(userId?: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  getAccountsByItemId(itemId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  
  // Asset methods
  getAssets(userId?: string): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset, userId: string): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;
  
  // Liability methods
  getLiabilities(userId?: string): Promise<Liability[]>;
  getLiability(id: string): Promise<Liability | undefined>;
  createLiability(liability: InsertLiability, userId: string): Promise<Liability>;
  updateLiability(id: string, liability: Partial<InsertLiability>): Promise<Liability | undefined>;
  deleteLiability(id: string): Promise<boolean>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;
  syncAccount(accountId: string): Promise<{ success: boolean; message: string }>;

  // Analytics methods
  getFinancialSummary(userId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  }>;
  
  getCategoryBreakdown(userId?: string, type?: "income" | "expense"): Promise<{
    category: string;
    amount: number;
    count: number;
  }[]>;

  // Database initialization
  initializeDefaultCategories(): Promise<void>;
  
  // Subscription methods
  getSubscriptionPlans(): Promise<any[]>;
  getSubscriptionPlan(id: string): Promise<any | undefined>;
  
  // Recurring transaction methods
  getRecurringTransactions(userId?: string): Promise<RecurringTransaction[]>;
  createRecurringTransaction(transaction: InsertRecurringTransaction, userId: string): Promise<RecurringTransaction>;
  
  // Manual subscription methods
  getManualSubscriptions(userId?: string): Promise<ManualSubscription[]>;
  createManualSubscription(subscription: InsertManualSubscription, userId: string): Promise<ManualSubscription>;

  // Transaction Tags methods
  getTransactionTags(userId: string): Promise<TransactionTag[]>;
  createTransactionTag(tag: InsertTransactionTag, userId: string): Promise<TransactionTag>;
  updateTransactionTag(tagId: string, updates: Partial<InsertTransactionTag>): Promise<TransactionTag>;
  deleteTransactionTag(tagId: string): Promise<boolean>;

  // Transaction Tag Assignments methods
  getTransactionTagAssignments(transactionId?: string): Promise<TransactionTagAssignment[]>;
  createTransactionTagAssignment(assignment: InsertTransactionTagAssignment): Promise<TransactionTagAssignment>;
  deleteTransactionTagAssignment(assignmentId: string): Promise<boolean>;

  // Automation Rules methods
  getAutomationRules(userId: string): Promise<AutomationRule[]>;
  createAutomationRule(rule: InsertAutomationRule, userId: string): Promise<AutomationRule>;
  updateAutomationRule(ruleId: string, updates: Partial<InsertAutomationRule>): Promise<AutomationRule>;
  deleteAutomationRule(ruleId: string): Promise<boolean>;

  // Transaction Splits methods
  getTransactionSplits(originalTransactionId?: string, userId?: string): Promise<TransactionSplit[]>;
  createTransactionSplits(splits: InsertTransactionSplit[], userId: string): Promise<TransactionSplit[]>;
  deleteTransactionSplits(originalTransactionId: string): Promise<boolean>;

  // Widget Layout methods
  getWidgetLayout(userId: string, deviceId?: string): Promise<WidgetLayout | undefined>;
  saveWidgetLayout(layout: InsertWidgetLayout, userId: string): Promise<WidgetLayout>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default categories when storage is created
    this.initializeDefaultCategories().catch(console.error);
  }

  async initializeDefaultCategories(): Promise<void> {
    try {
      // Check if categories already exist
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length > 0) return;

      // Insert default categories
      const categoriesToInsert = defaultCategories.map(cat => ({
        name: cat.name,
        ledgerType: cat.ledgerType,
        color: cat.color,
        isDefault: "true",
        userId: null, // System categories
      }));

      await db.insert(categories).values(categoriesToInsert);
    } catch (error) {
      console.error("Error initializing default categories:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          username: userData.username,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User> {
    console.log(`Updating user ${userId} with:`, updates);
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    console.log(`Updated user:`, user);
    return user;
  }

  async updateUserOnboarding(userId: string, completed: boolean): Promise<User> {
    console.log(`Updating onboarding status for user ${userId} to ${completed}`);
    const [user] = await db
      .update(users)
      .set({ 
        onboardingCompleted: completed, 
        onboardingSkipped: completed ? false : undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    console.log(`Updated user onboarding:`, user);
    return user;
  }

  async updateUserAvatar(userId: string, profileImageUrl: string | null): Promise<User> {
    console.log(`Updating avatar for user ${userId}`);
    const [user] = await db
      .update(users)
      .set({ 
        profileImageUrl,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    console.log(`Updated user avatar:`, user);
    return user;
  }

  async getTransactions(userId?: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const conditions = [];

    if (userId) {
      conditions.push(eq(transactions.userId, userId));
    }

    if (filters?.startDate) {
      conditions.push(gte(transactions.date, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(transactions.date, new Date(filters.endDate)));
    }

    if (filters?.category) {
      const legacyMatch = Object.entries(LEGACY_CATEGORY_MAP).find(([, newName]) => newName === filters.category);
      if (legacyMatch) {
        conditions.push(
          or(
            eq(transactions.category, filters.category),
            eq(transactions.category, legacyMatch[0])
          )
        );
      } else {
        conditions.push(eq(transactions.category, filters.category));
      }
    }

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(transactions.description, `%${filters.search}%`),
          ilike(transactions.category, `%${filters.search}%`),
          ilike(transactions.merchant, `%${filters.search}%`)
        )
      );
    }

    if (filters?.merchant) {
      // Use case-insensitive matching for merchant filter
      console.log(`Storage: Adding merchant filter for "${filters.merchant}"`);
      conditions.push(ilike(transactions.merchant, `%${filters.merchant}%`));
    }

    if (filters?.account) {
      conditions.push(eq(transactions.accountId, filters.account));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(transactions)
      .where(whereCondition)
      .orderBy(sql`${transactions.date} DESC`);
    
    return results.map(t => ({
      ...t,
      category: LEGACY_CATEGORY_MAP[t.category] || t.category,
    }));
    
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Auto-categorize using enhanced categorizer
    if (!transaction.categoryId) {
      try {
        const { enhancedCategorizer } = await import('./enhancedCategorizer');
        const match = await enhancedCategorizer.categorizeTransaction({
          id: '', // Will be generated
          description: transaction.description || '',
          merchant: transaction.merchant,
          source: transaction.source || 'manual',
          personalFinanceCategoryPrimary: transaction.personalFinanceCategoryPrimary,
          personalFinanceCategoryDetailed: transaction.personalFinanceCategoryDetailed,
          personalFinanceCategoryConfidence: transaction.personalFinanceCategoryConfidence,
        });
        
        if (match) {
          transaction.categoryId = match.categoryId;
          transaction.category = match.subcategory || match.categoryName;
          console.log(`✅ Enhanced categorization: "${transaction.description}" → "${match.categoryName}${match.subcategory ? ` > ${match.subcategory}` : ''}" (${match.source}, confidence: ${match.confidence})`);
        } else {
          transaction.category = transaction.category || 'Uncategorized';
        }
      } catch (error) {
        console.error('Enhanced auto-categorization failed:', error);
        transaction.category = transaction.category || 'Uncategorized';
      }
    }

    // Apply automation rules if userId is available
    if (transaction.userId) {
      try {
        const { automationRulesEngine } = await import('./automationRulesEngine');
        const userRules = await this.getAutomationRules(transaction.userId);
        
        if (userRules.length > 0) {
          const { updatedTransaction } = await automationRulesEngine.applyRulesToTransaction(transaction, userRules);
          transaction = updatedTransaction as InsertTransaction;
        }
      } catch (error) {
        console.error('Automation rules application failed:', error);
      }
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        rawAmount: transaction.rawAmount?.toString() || transaction.amount,
        amount: transaction.amount,
      })
      .returning();
    return newTransaction;
  }

  async createTransactions(transactionList: InsertTransaction[]): Promise<Transaction[]> {
    // Auto-categorize transactions using enhanced categorizer
    const { enhancedCategorizer } = await import('./enhancedCategorizer');
    
    const insertData = [];
    let categorizedCount = 0;
    
    for (let transaction of transactionList) {
      // Auto-categorize if categoryId is not provided
      if (!transaction.categoryId) {
        try {
          const match = await enhancedCategorizer.categorizeTransaction({
            id: '', // Will be generated
            description: transaction.description || '',
            merchant: transaction.merchant,
            source: transaction.source || 'manual',
            personalFinanceCategoryPrimary: transaction.personalFinanceCategoryPrimary,
            personalFinanceCategoryDetailed: transaction.personalFinanceCategoryDetailed,
            personalFinanceCategoryConfidence: transaction.personalFinanceCategoryConfidence,
          });
          
          if (match) {
            transaction.categoryId = match.categoryId;
            transaction.category = match.subcategory || match.categoryName;
            categorizedCount++;
          } else {
            transaction.category = transaction.category || 'Uncategorized';
          }
        } catch (error) {
          console.error('Enhanced auto-categorization failed for transaction:', transaction.description, error);
          transaction.category = transaction.category || 'Uncategorized';
        }
      }

      // Apply automation rules if userId is available
      if (transaction.userId) {
        try {
          const { automationRulesEngine } = await import('./automationRulesEngine');
          const userRules = await this.getAutomationRules(transaction.userId);
          
          if (userRules.length > 0) {
            const { updatedTransaction } = await automationRulesEngine.applyRulesToTransaction(transaction, userRules);
            transaction = updatedTransaction as InsertTransaction;
          }
        } catch (error) {
          console.error('Automation rules application failed:', error);
        }
      }

      insertData.push({
        ...transaction,
        rawAmount: transaction.rawAmount?.toString() || transaction.amount,
        amount: transaction.amount,
      });
    }
    
    if (categorizedCount > 0) {
      console.log(`✅ Enhanced categorization: Auto-categorized ${categorizedCount}/${transactionList.length} transactions`);
    }

    const newTransactions = await db
      .insert(transactions)
      .values(insertData)
      .returning();
    return newTransactions;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({
        ...transaction,
        rawAmount: transaction.rawAmount?.toString() || transaction.amount || undefined,
        amount: transaction.amount || undefined,
      })
      .where(eq(transactions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteManualTransactions(userId: string): Promise<number> {
    // Delete transactions that don't have a source or have source as 'manual'
    const result = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          or(
            eq(transactions.source, 'manual'),
            sql`${transactions.source} IS NULL`
          )
        )
      );
    
    return result.rowCount || 0;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getAdminCategories(): Promise<any[]> {
    const { adminCategories } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(adminCategories)
      .where(eq(adminCategories.isActive, true))
      .orderBy(adminCategories.sortOrder);

    const renamed: { id: string; name: string; subcategory: string | null }[] = [];

    const mapped = rows.map((cat: any) => {
      const compositeKey = cat.subcategory
        ? `${cat.name}: ${cat.subcategory}`
        : cat.name;
      const rename =
        LEGACY_ADMIN_CATEGORY_RENAMES[compositeKey] ||
        LEGACY_ADMIN_CATEGORY_RENAMES[cat.name];

      if (rename) {
        const updated: any = { ...cat, name: rename.name };
        if (Object.prototype.hasOwnProperty.call(rename, "subcategory")) {
          updated.subcategory = rename.subcategory;
          
        }
        renamed.push({ id: cat.id, name: updated.name, subcategory: updated.subcategory ?? null });
        return updated;
      }
      return cat;
    });

    if (renamed.length) {
      for (const r of renamed) {
        await db
          .update(adminCategories)
          .set({ name: r.name, subcategory: r.subcategory })
          .where(eq(adminCategories.id, r.id));
      }
    }

    return mapped;
  }

  async getFinancialSummary(userId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  }> {
    const filters: TransactionFilters = {};
    if (startDate) filters.startDate = startDate.toISOString();
    if (endDate) filters.endDate = endDate.toISOString();

    const transactionList = await this.getTransactions(userId, filters);

    const income = transactionList
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactionList
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      transactionCount: transactionList.length,
    };
  }

  async getCategoryBreakdown(userId?: string, type?: "income" | "expense"): Promise<{
    category: string;
    amount: number;
    count: number;
  }[]> {
    const filters: TransactionFilters = {};
    if (type) filters.type = type;

    const transactionList = await this.getTransactions(userId, filters);
    const breakdown = new Map<string, { amount: number; count: number }>();

    transactionList.forEach(transaction => {
      const category = transaction.category;
      const existing = breakdown.get(category) || { amount: 0, count: 0 };
      breakdown.set(category, {
        amount: existing.amount + parseFloat(transaction.amount),
        count: existing.count + 1,
      });
    });

    return Array.from(breakdown.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  }

  async getBudgets(userId?: string): Promise<Budget[]> {
    if (userId) {
      return await db.select().from(budgets).where(eq(budgets.userId, userId));
    }
    return await db.select().from(budgets);
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updated] = await db
      .update(budgets)
      .set(budget)
      .where(eq(budgets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getBudgetPlan(userId: string, month: string): Promise<BudgetPlan | undefined> {
    try {
      const [plan] = await db
        .select()
        .from(budgetPlans)
        .where(and(eq(budgetPlans.userId, userId), eq(budgetPlans.month, month)));
      return plan || undefined;
    } catch (error: any) {
      // If the table hasn't been migrated yet or the database isn't reachable,
      // treat it as "no plan" so the API can respond with a 404 instead of a 500.
      if (error?.message?.includes('budget_plans') || error?.code === 'ECONNREFUSED') {
        return undefined;
      }
      throw error;
    }
  }

  async createBudgetPlan(plan: InsertBudgetPlan & { userId: string }): Promise<BudgetPlan> {
    try {
      const [newPlan] = await db.insert(budgetPlans).values(plan).returning();
      return newPlan;
    } catch (error: any) {
      if (error?.message?.includes('budget_plans')) {
        await migrateDb();
        const [newPlan] = await db.insert(budgetPlans).values(plan).returning();
        return newPlan;
      }
      throw error;
    }
  }

  async updateBudgetPlan(id: string, plan: Partial<InsertBudgetPlan>): Promise<BudgetPlan | undefined> {
    try {
      const [updated] = await db.update(budgetPlans).set(plan).where(eq(budgetPlans.id, id)).returning();
      return updated || undefined;
    } catch (error: any) {
      if (error?.message?.includes('budget_plans')) {
        await migrateDb();
        const [updated] = await db.update(budgetPlans).set(plan).where(eq(budgetPlans.id, id)).returning();
        return updated || undefined;
      }
      throw error;
    }
  }

  async getIncomeEstimate(userId: string, months: number): Promise<{ average: number; months: { month: string; total: number }[] }> {
    const rows = await db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        total: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, 'income')))
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .limit(months);

    const monthsData = rows.map(r => ({ month: r.month, total: Number(r.total) }));
    const average = monthsData.length ? monthsData.reduce((s, r) => s + r.total, 0) / monthsData.length : 0;
    return { average, months: monthsData };
  }

  async getBillsEstimate(userId: string, months: number): Promise<{ average: number; candidates: any[] }> {
    const rows = await db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        total: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.category, 'Bills & Utilities'),
          eq(transactions.type, 'expense')
        )
      )
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .limit(months);

    const monthsData = rows.map(r => ({ month: r.month, total: Number(r.total) }));
    const average = monthsData.length ? monthsData.reduce((s, r) => s + r.total, 0) / monthsData.length : 0;
    return { average, candidates: [] };
  }


  async upsertBudgetPlan(plan: InsertBudgetPlan & { userId: string }): Promise<BudgetPlan> {
    const existing = await this.getBudgetPlan(plan.userId, plan.month);
    
    if (existing) {
      const [updated] = await db
        .update(budgetPlans)
        .set(plan)
        .where(eq(budgetPlans.id, existing.id))
        .returning();
      return updated;
    }
    
    const [inserted] = await db.insert(budgetPlans).values(plan).returning();
    return inserted;
  }

  async getGoals(userId?: string): Promise<Goal[]> {
    if (userId) {
      return await db.select().from(goals).where(eq(goals.userId, userId));
    }
    return await db.select().from(goals);
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Institution methods
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions);
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db.insert(institutions).values(institution).returning();
    return newInstitution;
  }

  async updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [updated] = await db
      .update(institutions)
      .set(institution)
      .where(eq(institutions.id, id))
      .returning();
    return updated || undefined;
  }

  // Account methods
  async getAccounts(userId?: string): Promise<Account[]> {
    if (userId) {
      return await db.select().from(accounts).where(eq(accounts.userId, userId));
    }
    return await db.select().from(accounts);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccountsByItemId(itemId: string): Promise<Account[]> {
    // Use externalAccountId instead of plaidItemId (which doesn't exist in schema)
    return await db.select().from(accounts).where(eq(accounts.externalAccountId, itemId));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db
      .update(accounts)
      .set({
        ...account,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async syncAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    try {
      const account = await this.getAccount(accountId);
      if (!account) {
        return { success: false, message: "Account not found" };
      }

      // If account has no access token, it's manually created
      if (!account.accessToken) {
        await this.updateAccount(accountId, { lastSyncAt: new Date() });
        return { success: true, message: "Manual account updated" };
      }

      // Sync with Plaid API
      const { plaidClient } = await import('./plaidClient');
      
      // Get account balances
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: account.accessToken,
      });

      // Find the specific account we're syncing
      const plaidAccount = balanceResponse.data.accounts.find(
        acc => acc.account_id === account.plaidAccountId
      );
      
      if (plaidAccount) {
        await this.updateAccount(accountId, {
          currentBalance: plaidAccount.balances.current?.toString() || null,
          availableBalance: plaidAccount.balances.available?.toString() || null,
          lastSyncAt: new Date(),
        });

        // Sync transactions from a broader date range to catch more data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        console.log(`Fetching transactions for ${account.name} from ${sixMonthsAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);
        
        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: account.accessToken,
          start_date: sixMonthsAgo.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        });
        
        console.log(`Found ${transactionsResponse.data.transactions.length} total transactions for access token`);

        // Store new transactions with enhanced categorization
        const { EnhancedTransactionCategorizer } = await import('./enhancedTransactionCategorizer');
        const categorizer = new EnhancedTransactionCategorizer();
        
        // Filter transactions for this specific account (extra safety)
        const accountTransactions = transactionsResponse.data.transactions.filter(
          tx => tx.account_id === account.plaidAccountId
        );
        
        for (const plaidTx of accountTransactions) {
          const existingTx = await this.getTransactionByExternalId(plaidTx.transaction_id);
          
          if (!existingTx) {
            // Auto-categorize the transaction using enhanced categorizer
            const categorization = await categorizer.categorize(
              plaidTx.name,
              -plaidTx.amount, // Convert to our amount format
              plaidTx.merchant_name || undefined
            );
            
            await this.createTransaction({
              userId: account.userId,
              accountId: accountId,
              externalTransactionId: plaidTx.transaction_id,
              rawAmount: (-plaidTx.amount), // Plaid uses negative for outgoing
              amount: Math.abs(plaidTx.amount).toString(),
              description: plaidTx.name,
              merchant: plaidTx.merchant_name || undefined,
              category: categorization.category,
              type: plaidTx.amount > 0 ? 'expense' : 'income',
              date: new Date(plaidTx.date),
              source: 'plaid',
              plaidCategory: plaidTx.category ? JSON.stringify(plaidTx.category) : undefined,
              plaidPersonalFinanceCategory: plaidTx.personal_finance_category ? JSON.stringify(plaidTx.personal_finance_category) : undefined,
              plaidAccountId: plaidTx.account_id,
              authorizedDate: plaidTx.authorized_date ? new Date(plaidTx.authorized_date) : undefined,
              isoCurrencyCode: plaidTx.iso_currency_code || undefined,
              paymentChannel: plaidTx.payment_channel || undefined,
              personalFinanceCategoryPrimary: plaidTx.personal_finance_category && plaidTx.personal_finance_category.primary ? plaidTx.personal_finance_category.primary : undefined,
              personalFinanceCategoryDetailed: plaidTx.personal_finance_category && plaidTx.personal_finance_category.detailed ? plaidTx.personal_finance_category.detailed : undefined,
              personalFinanceCategoryConfidence: plaidTx.personal_finance_category && plaidTx.personal_finance_category.confidence_level ? plaidTx.personal_finance_category.confidence_level : undefined,
              locationJson: plaidTx.location ? JSON.stringify(plaidTx.location) : undefined,
              paymentMetaJson: plaidTx.payment_meta ? JSON.stringify(plaidTx.payment_meta) : undefined,
            });
          }
        }

        return { 
          success: true, 
          message: `Synced ${transactionsResponse.data.transactions.length} transactions` 
        };
      }
      
      return { success: false, message: "No account data found" };
    } catch (error) {
      console.error('Plaid sync error:', error);
      return { 
        success: false, 
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async getTransactionByExternalId(externalId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.externalTransactionId, externalId));
    return transaction || undefined;
  }
  // Admin methods implementation
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalTransactions: number;
    totalBudgets: number;
    totalAccounts: number;
    newUsersThisWeek: number;
    avgTransactionsPerUser: number;
  }> {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const usersResult = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
      const newUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= ${weekAgo.toISOString()}
      `);
      const transactionsResult = await db.execute(sql`SELECT COUNT(*) as total FROM transactions`);
      const budgetsResult = await db.execute(sql`SELECT COUNT(*) as total FROM budgets`);
      const accountsResult = await db.execute(sql`SELECT COUNT(*) as total FROM accounts`);
      
      const totalUsers = Number((usersResult.rows[0] as any)?.total) || 0;
      const totalTransactions = Number((transactionsResult.rows[0] as any)?.total) || 0;
      const avgTransactionsPerUser = totalUsers > 0 ? Math.round(totalTransactions / totalUsers) : 0;
      
      return {
        totalUsers,
        totalTransactions,
        totalBudgets: Number((budgetsResult.rows[0] as any)?.total) || 0,
        totalAccounts: Number((accountsResult.rows[0] as any)?.total) || 0,
        newUsersThisWeek: Number((newUsersResult.rows[0] as any)?.count) || 0,
        avgTransactionsPerUser,
      };
    } catch (error) {
      console.error("Error getting admin stats:", error);
      throw error;
    }
  }

  async getAllUsersWithStats(): Promise<Array<User & {
    transactionCount: number;
    budgetCount: number;
    accountCount: number;
  }>> {
    try {
      const allUsers = await db.select().from(users);
      const usersWithStats = [];
      
      for (const user of allUsers) {
        const transactionCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM transactions WHERE user_id = ${user.id}
        `);
        const budgetCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM budgets WHERE user_id = ${user.id}
        `);
        const accountCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM accounts WHERE user_id = ${user.id}
        `);
        
        usersWithStats.push({
          ...user,
          transactionCount: Number((transactionCountResult.rows[0] as any)?.count) || 0,
          budgetCount: Number((budgetCountResult.rows[0] as any)?.count) || 0,
          accountCount: Number((accountCountResult.rows[0] as any)?.count) || 0,
        });
      }
      
      return usersWithStats;
    } catch (error) {
      console.error("Error getting users with stats:", error);
      throw error;
    }
  }

  async getAdminAnalytics(): Promise<{
    conversionRates: {
      signupToFirstSync: number;
      signupToPaidUser: number;
      freeTrialToSubscription: number;
    };
    engagementPerAccount: {
      averageTransactionsPerAccount: number;
      averageAccountsPerUser: number;
      activeAccountsPercentage: number;
      lastSyncDistribution: Array<{ period: string; count: number }>;
    };
    retentionMetrics: {
      userRetention7Days: number;
      userRetention30Days: number;
      userRetention90Days: number;
      monthlyActiveUsers: number;
      dailyActiveUsers: number;
      averageSessionsPerUser: number;
    };
  }> {
    try {
      const now = new Date();
      const day1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Conversion Rates
      const totalUsersResult = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
      const totalUsers = Number((totalUsersResult.rows[0] as any)?.total) || 0;

      const usersWithAccountsResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count FROM accounts
      `);
      const usersWithAccounts = Number((usersWithAccountsResult.rows[0] as any)?.count) || 0;

      const paidUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE subscription_status IN ('active', 'trialing', 'past_due')
      `);
      const paidUsers = Number((paidUsersResult.rows[0] as any)?.count) || 0;

      const trialUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE subscription_status = 'trialing'
      `);
      const trialUsers = Number((trialUsersResult.rows[0] as any)?.count) || 0;

      const subscriptionUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE subscription_status = 'active'
      `);
      const subscriptionUsers = Number((subscriptionUsersResult.rows[0] as any)?.count) || 0;

      // Engagement Per Account
      const totalAccountsResult = await db.execute(sql`SELECT COUNT(*) as total FROM accounts`);
      const totalAccounts = Number((totalAccountsResult.rows[0] as any)?.total) || 0;

      const totalTransactionsResult = await db.execute(sql`SELECT COUNT(*) as total FROM transactions`);
      const totalTransactions = Number((totalTransactionsResult.rows[0] as any)?.total) || 0;

      const activeAccountsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM accounts 
        WHERE last_sync_at >= ${day30.toISOString()}
      `);
      const activeAccounts = Number((activeAccountsResult.rows[0] as any)?.count) || 0;

      // Last sync distribution - simplified query
      const syncLast24h = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE last_sync_at >= ${day1.toISOString()}`);
      const syncLast7d = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE last_sync_at >= ${day7.toISOString()} AND last_sync_at < ${day1.toISOString()}`);
      const syncLast30d = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE last_sync_at >= ${day30.toISOString()} AND last_sync_at < ${day7.toISOString()}`);
      const syncOver30d = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE last_sync_at IS NOT NULL AND last_sync_at < ${day30.toISOString()}`);
      const neverSynced = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE last_sync_at IS NULL`);

      const lastSyncDistribution = [
        { period: 'Last 24 hours', count: Number((syncLast24h.rows[0] as any)?.count) || 0 },
        { period: 'Last 7 days', count: Number((syncLast7d.rows[0] as any)?.count) || 0 },
        { period: 'Last 30 days', count: Number((syncLast30d.rows[0] as any)?.count) || 0 },
        { period: 'Over 30 days ago', count: Number((syncOver30d.rows[0] as any)?.count) || 0 },
        { period: 'Never synced', count: Number((neverSynced.rows[0] as any)?.count) || 0 }
      ];

      // Retention Metrics - Correct calculation
      // 7-Day Retention: Users who signed up 7+ days ago and were active after their signup period
      const users7DaysAgoResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at <= ${day7.toISOString()}
      `);
      const users7DaysAgo = Number((users7DaysAgoResult.rows[0] as any)?.count) || 0;

      const activeUsers7DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as count FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE u.created_at <= ${day7.toISOString()}
        AND a.last_sync_at > (u.created_at + INTERVAL '7 days')
      `);
      const activeUsers7Days = Number((activeUsers7DaysResult.rows[0] as any)?.count) || 0;

      // 30-Day Retention: Users who signed up 30+ days ago and were active after their signup period
      const users30DaysAgoResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at <= ${day30.toISOString()}
      `);
      const users30DaysAgo = Number((users30DaysAgoResult.rows[0] as any)?.count) || 0;

      const activeUsers30DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as count FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE u.created_at <= ${day30.toISOString()}
        AND a.last_sync_at > (u.created_at + INTERVAL '30 days')
      `);
      const activeUsers30Days = Number((activeUsers30DaysResult.rows[0] as any)?.count) || 0;

      // 90-Day Retention: Users who signed up 90+ days ago and were active after their signup period
      const users90DaysAgoResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at <= ${day90.toISOString()}
      `);
      const users90DaysAgo = Number((users90DaysAgoResult.rows[0] as any)?.count) || 0;

      const activeUsers90DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as count FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE u.created_at <= ${day90.toISOString()}
        AND a.last_sync_at > (u.created_at + INTERVAL '90 days')
      `);
      const activeUsers90Days = Number((activeUsers90DaysResult.rows[0] as any)?.count) || 0;

      const monthlyActiveUsersResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as count FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.last_sync_at >= ${day30.toISOString()}
      `);
      const monthlyActiveUsers = Number((monthlyActiveUsersResult.rows[0] as any)?.count) || 0;

      const dailyActiveUsersResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as count FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.last_sync_at >= ${day1.toISOString()}
      `);
      const dailyActiveUsers = Number((dailyActiveUsersResult.rows[0] as any)?.count) || 0;

      return {
        conversionRates: {
          signupToFirstSync: totalUsers > 0 ? Math.round((usersWithAccounts / totalUsers) * 100) : 0,
          signupToPaidUser: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0,
          freeTrialToSubscription: trialUsers > 0 ? Math.round((subscriptionUsers / trialUsers) * 100) : 0,
        },
        engagementPerAccount: {
          averageTransactionsPerAccount: totalAccounts > 0 ? Math.round(totalTransactions / totalAccounts) : 0,
          averageAccountsPerUser: usersWithAccounts > 0 ? Math.round(totalAccounts / usersWithAccounts * 10) / 10 : 0,
          activeAccountsPercentage: totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0,
          lastSyncDistribution,
        },
        retentionMetrics: {
          userRetention7Days: users7DaysAgo > 0 ? Math.round((activeUsers7Days / users7DaysAgo) * 100) : 0,
          userRetention30Days: users30DaysAgo > 0 ? Math.round((activeUsers30Days / users30DaysAgo) * 100) : 0,
          userRetention90Days: users90DaysAgo > 0 ? Math.round((activeUsers90Days / users90DaysAgo) * 100) : 0,
          monthlyActiveUsers,
          dailyActiveUsers,
          averageSessionsPerUser: usersWithAccounts > 0 ? Math.round((totalAccounts * 2) / usersWithAccounts * 10) / 10 : 0, // Estimated sessions based on syncs
        },
      };
    } catch (error) {
      console.error("Error getting admin analytics:", error);
      throw error;
    }
  }

  async resetUserData(userId: string): Promise<void> {
    // Delete user's data but keep the user account
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(budgets).where(eq(budgets.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    
    // Reset onboarding status
    await db.update(users)
      .set({ 
        onboardingCompleted: false, 
        onboardingSkipped: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: Partial<Pick<User, 'subscriptionStatus' | 'subscriptionPlan' | 'subscriptionEndsAt' | 'trialEndsAt'>>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...subscriptionData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async getSubscriptionPlans(): Promise<any[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(id: string): Promise<any | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, id), eq(subscriptionPlans.isActive, true)));
    
    return plan || undefined;
  }

  // Recurring transaction methods
  async getRecurringTransactions(userId?: string): Promise<RecurringTransaction[]> {
    const query = db.select().from(recurringTransactions);
    
    if (userId) {
      return await query.where(eq(recurringTransactions.userId, userId));
    }
    
    return await query;
  }

  async createRecurringTransaction(transaction: InsertRecurringTransaction, userId: string): Promise<RecurringTransaction> {
    const [created] = await db
      .insert(recurringTransactions)
      .values([{ ...transaction, userId }])
      .returning();
    
    if (!created) {
      throw new Error("Failed to create recurring transaction");
    }
    
    return created;
  }

  // Manual subscription methods
  async getManualSubscriptions(userId?: string): Promise<ManualSubscription[]> {
    const query = db.select().from(manualSubscriptions);
    
    if (userId) {
      return await query.where(eq(manualSubscriptions.userId, userId));
    }
    
    return await query;
  }

  async createManualSubscription(subscription: InsertManualSubscription, userId: string): Promise<ManualSubscription> {
    const [created] = await db
      .insert(manualSubscriptions)
      .values([{ ...subscription, userId }])
      .returning();
    
    if (!created) {
      throw new Error("Failed to create manual subscription");
    }
    
    return created;
  }

  // Asset methods
  async getAssets(userId?: string): Promise<Asset[]> {
    const query = db.select().from(assets);
    if (userId) {
      return await query.where(and(eq(assets.userId, userId), eq(assets.isActive, true)));
    }
    return await query.where(eq(assets.isActive, true));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(asset: InsertAsset, userId: string): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values([{ ...asset, userId }]).returning();
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset || undefined;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.update(assets).set({ isActive: false }).where(eq(assets.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Liability methods
  async getLiabilities(userId?: string): Promise<Liability[]> {
    const query = db.select().from(liabilities);
    if (userId) {
      return await query.where(and(eq(liabilities.userId, userId), eq(liabilities.isActive, true)));
    }
    return await query.where(eq(liabilities.isActive, true));
  }

  async getLiability(id: string): Promise<Liability | undefined> {
    const [liability] = await db.select().from(liabilities).where(eq(liabilities.id, id));
    return liability || undefined;
  }

  async createLiability(liability: InsertLiability, userId: string): Promise<Liability> {
    const [newLiability] = await db.insert(liabilities).values([{ ...liability, userId }]).returning();
    return newLiability;
  }

  async updateLiability(id: string, liability: Partial<InsertLiability>): Promise<Liability | undefined> {
    const [updatedLiability] = await db
      .update(liabilities)
      .set({ ...liability, updatedAt: new Date() })
      .where(eq(liabilities.id, id))
      .returning();
    return updatedLiability || undefined;
  }

  async deleteLiability(id: string): Promise<boolean> {
    const result = await db.update(liabilities).set({ isActive: false }).where(eq(liabilities.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Transaction Tags methods
  async getTransactionTags(userId: string): Promise<TransactionTag[]> {
    return await db
      .select()
      .from(transactionTags)
      .where(and(eq(transactionTags.userId, userId), eq(transactionTags.isActive, true)))
      .orderBy(transactionTags.name);
  }

  async createTransactionTag(tag: InsertTransactionTag, userId: string): Promise<TransactionTag> {
    const [created] = await db
      .insert(transactionTags)
      .values([{ ...tag, userId }])
      .returning();
    return created;
  }

  async updateTransactionTag(tagId: string, updates: Partial<InsertTransactionTag>): Promise<TransactionTag> {
    const [updated] = await db
      .update(transactionTags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactionTags.id, tagId))
      .returning();
    return updated;
  }

  async deleteTransactionTag(tagId: string): Promise<boolean> {
    // Soft delete by marking as inactive
    const [updated] = await db
      .update(transactionTags)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(transactionTags.id, tagId))
      .returning();
    return !!updated;
  }

  // Transaction Tag Assignments methods
  async getTransactionTagAssignments(transactionId?: string): Promise<TransactionTagAssignment[]> {
    const query = db.select().from(transactionTagAssignments);
    if (transactionId) {
      return await query.where(eq(transactionTagAssignments.transactionId, transactionId));
    }
    return await query;
  }

  async createTransactionTagAssignment(assignment: InsertTransactionTagAssignment): Promise<TransactionTagAssignment> {
    const [created] = await db
      .insert(transactionTagAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async deleteTransactionTagAssignment(assignmentId: string): Promise<boolean> {
    const result = await db
      .delete(transactionTagAssignments)
      .where(eq(transactionTagAssignments.id, assignmentId));
    return (result.rowCount || 0) > 0;
  }

  // Automation Rules methods
  async getAutomationRules(userId: string): Promise<AutomationRule[]> {
    return await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.userId, userId))
      .orderBy(automationRules.priority, automationRules.name);
  }

  async createAutomationRule(rule: InsertAutomationRule, userId: string): Promise<AutomationRule> {
    const [created] = await db
      .insert(automationRules)
      .values([{ ...rule, userId }])
      .returning();
    return created;
  }

  async updateAutomationRule(ruleId: string, updates: Partial<InsertAutomationRule>): Promise<AutomationRule> {
    const [updated] = await db
      .update(automationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(automationRules.id, ruleId))
      .returning();
    return updated;
  }

  async deleteAutomationRule(ruleId: string): Promise<boolean> {
    const result = await db
      .delete(automationRules)
      .where(eq(automationRules.id, ruleId));
    return (result.rowCount || 0) > 0;
  }

  async incrementAutomationRuleAppliedCount(ruleId: string): Promise<void> {
    await db
      .update(automationRules)
      .set({ 
        appliedCount: sql`${automationRules.appliedCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(automationRules.id, ruleId));
  }

  // Transaction Splits methods
  async getTransactionSplits(originalTransactionId?: string, userId?: string): Promise<TransactionSplit[]> {
    const query = db.select().from(transactionSplits);
    
    if (originalTransactionId && userId) {
      return await query.where(
        and(
          eq(transactionSplits.originalTransactionId, originalTransactionId),
          eq(transactionSplits.userId, userId)
        )
      ).orderBy(transactionSplits.splitOrder);
    } else if (originalTransactionId) {
      return await query.where(eq(transactionSplits.originalTransactionId, originalTransactionId))
        .orderBy(transactionSplits.splitOrder);
    } else if (userId) {
      return await query.where(eq(transactionSplits.userId, userId))
        .orderBy(transactionSplits.createdAt);
    }
    
    return await query.orderBy(transactionSplits.createdAt);
  }

  async createTransactionSplits(splits: InsertTransactionSplit[], userId: string): Promise<TransactionSplit[]> {
    const splitsWithUserId = splits.map(split => ({ ...split, userId }));
    const created = await db
      .insert(transactionSplits)
      .values(splitsWithUserId)
      .returning();
    return created;
  }

  async deleteTransactionSplits(originalTransactionId: string): Promise<boolean> {
    const result = await db
      .delete(transactionSplits)
      .where(eq(transactionSplits.originalTransactionId, originalTransactionId));
    return (result.rowCount || 0) > 0;
  }

  // Widget Layout methods
  async getWidgetLayout(userId: string, deviceId?: string): Promise<WidgetLayout | undefined> {
    const query = db.select().from(widgetLayouts)
      .where(eq(widgetLayouts.userId, userId));
      
    if (deviceId) {
      const [layout] = await query.where(
        and(
          eq(widgetLayouts.userId, userId),
          eq(widgetLayouts.deviceId, deviceId)
        )
      );
      return layout;
    } else {
      // Get the most recent layout for the user (any device)
      const [layout] = await query
        .orderBy(sql`${widgetLayouts.updatedAt} DESC`)
        .limit(1);
      return layout;
    }
  }

  async saveWidgetLayout(layout: InsertWidgetLayout, userId: string): Promise<WidgetLayout> {
    const layoutWithUserId = { ...layout, userId };
    
    // Check if layout exists for this user/device combination
    const existing = await this.getWidgetLayout(userId, layout.deviceId || undefined);
    
    if (existing) {
      // Update existing layout
      const [updated] = await db
        .update(widgetLayouts)
        .set({
          layoutData: layoutWithUserId.layoutData,
          updatedAt: new Date(),
        })
        .where(eq(widgetLayouts.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new layout
      const [created] = await db
        .insert(widgetLayouts)
        .values(layoutWithUserId)
        .returning();
      return created;
    }
  }

}

export const storage = new DatabaseStorage();

