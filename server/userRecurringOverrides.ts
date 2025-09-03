import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { 
  transactions, 
  userRecurringOverrides,
  type UserRecurringOverride,
  type InsertUserRecurringOverride,
  type Transaction 
} from "@shared/schema";

// Service for managing user recurring transaction overrides
export class UserRecurringOverrideService {

  /**
   * Get all user recurring overrides for a specific user
   */
  static async getUserOverrides(userId: string): Promise<UserRecurringOverride[]> {
    return await db
      .select()
      .from(userRecurringOverrides)
      .where(
        and(
          eq(userRecurringOverrides.userId, userId),
          eq(userRecurringOverrides.isActive, true)
        )
      )
      .orderBy(desc(userRecurringOverrides.createdAt));
  }

  /**
   * Get user override for a specific merchant
   */
  static async getOverrideForMerchant(
    userId: string, 
    merchantName: string
  ): Promise<UserRecurringOverride | null> {
    const normalizedMerchant = this.normalizeMerchantName(merchantName);
    
    const overrides = await db
      .select()
      .from(userRecurringOverrides)
      .where(
        and(
          eq(userRecurringOverrides.userId, userId),
          eq(userRecurringOverrides.merchantName, normalizedMerchant),
          eq(userRecurringOverrides.isActive, true)
        )
      )
      .limit(1);
    
    return overrides[0] || null;
  }

  /**
   * Create a new user recurring override
   */
  static async createOverride(
    override: InsertUserRecurringOverride
  ): Promise<UserRecurringOverride> {
    // Normalize merchant name
    const normalizedMerchant = this.normalizeMerchantName(override.merchantName);
    
    // Get related transaction count
    const relatedCount = await this.getRelatedTransactionCount(
      override.userId, 
      normalizedMerchant
    );

    const insertData: InsertUserRecurringOverride = {
      ...override,
      merchantName: normalizedMerchant,
      relatedTransactionCount: relatedCount,
      ruleType: 'recurring_override'
    };

    const result = await db
      .insert(userRecurringOverrides)
      .values(insertData)
      .returning();

    console.log(`✅ Created recurring override: ${normalizedMerchant} -> ${override.recurringStatus} for user ${override.userId}`);
    
    return result[0];
  }

  /**
   * Update an existing override
   */
  static async updateOverride(
    id: string,
    updates: Partial<UserRecurringOverride>
  ): Promise<UserRecurringOverride | null> {
    const result = await db
      .update(userRecurringOverrides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userRecurringOverrides.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Deactivate an override (soft delete)
   */
  static async deactivateOverride(id: string): Promise<boolean> {
    const result = await db
      .update(userRecurringOverrides)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userRecurringOverrides.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Get related transactions for a merchant with enhanced grouping
   */
  static async getRelatedTransactions(
    userId: string, 
    merchantName: string
  ): Promise<Transaction[]> {
    const normalizedMerchant = this.normalizeMerchantName(merchantName);
    
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`LOWER(${transactions.merchant}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`} OR LOWER(${transactions.description}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`}`
        )
      )
      .orderBy(desc(transactions.date))
      .limit(50); // Limit to recent 50 transactions
  }

  /**
   * Get related transactions grouped by transaction patterns (recurring vs one-time)
   */
  static async getGroupedRelatedTransactions(
    userId: string, 
    merchantName: string
  ): Promise<{
    recurring: Transaction[];
    oneTime: Transaction[];
    unclear: Transaction[];
    summary: {
      total: number;
      recurringCount: number;
      oneTimeCount: number;
      unclearCount: number;
      potentialRecurringAmounts: string[];
    };
  }> {
    const normalizedMerchant = this.normalizeMerchantName(merchantName);
    
    // Get all related transactions
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`LOWER(${transactions.merchant}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`} OR LOWER(${transactions.description}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`}`
        )
      )
      .orderBy(desc(transactions.date));

    // Group transactions by analyzing patterns
    const recurring: Transaction[] = [];
    const oneTime: Transaction[] = [];
    const unclear: Transaction[] = [];
    
    // Track amounts and their frequency for pattern detection
    const amountFrequency = new Map<string, Transaction[]>();
    
    // Group by amount first
    allTransactions.forEach(tx => {
      const amount = tx.amount;
      if (!amountFrequency.has(amount)) {
        amountFrequency.set(amount, []);
      }
      amountFrequency.get(amount)!.push(tx);
    });

    // Analyze each amount group for recurring patterns
    for (const [amount, txGroup] of Array.from(amountFrequency.entries())) {
      if (txGroup.length >= 3) {
        // Potentially recurring if 3+ transactions with same amount
        
        // Check for regular intervals (for subscription services like Amazon Prime)
        const isRegularInterval = this.hasRegularInterval(txGroup);
        const hasSubscriptionKeywords = this.hasSubscriptionKeywords(txGroup);
        
        if (isRegularInterval || hasSubscriptionKeywords) {
          recurring.push(...txGroup);
        } else if (txGroup.length >= 5) {
          // Many transactions with same amount but irregular - could be unclear
          unclear.push(...txGroup);
        } else {
          oneTime.push(...txGroup);
        }
      } else if (txGroup.length === 2) {
        // Two transactions - check if they suggest a pattern
        const hasSubscriptionKeywords = this.hasSubscriptionKeywords(txGroup);
        if (hasSubscriptionKeywords) {
          recurring.push(...txGroup);
        } else {
          unclear.push(...txGroup);
        }
      } else {
        // Single transaction
        const hasSubscriptionKeywords = this.hasSubscriptionKeywords(txGroup);
        if (hasSubscriptionKeywords) {
          unclear.push(...txGroup); // Single subscription charge is unclear
        } else {
          oneTime.push(...txGroup);
        }
      }
    }

    // Get potential recurring amounts for UI hints
    const potentialRecurringAmounts = Array.from(amountFrequency.entries())
      .filter(([_, txs]) => txs.length >= 2)
      .map(([amount, _]) => amount)
      .sort();

    return {
      recurring: recurring.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      oneTime: oneTime.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      unclear: unclear.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      summary: {
        total: allTransactions.length,
        recurringCount: recurring.length,
        oneTimeCount: oneTime.length,
        unclearCount: unclear.length,
        potentialRecurringAmounts
      }
    };
  }

  /**
   * Check if transactions have regular intervals (monthly, quarterly, etc.)
   */
  private static hasRegularInterval(transactions: Transaction[]): boolean {
    if (transactions.length < 2) return false;
    
    // Sort by date
    const sorted = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = Math.abs(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }
    
    // Check for common subscription intervals (weekly, monthly, quarterly)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Allow for some variance in intervals
    const isWeekly = Math.abs(avgInterval - 7) <= 3;
    const isMonthly = Math.abs(avgInterval - 30) <= 7;
    const isQuarterly = Math.abs(avgInterval - 90) <= 14;
    const isYearly = Math.abs(avgInterval - 365) <= 30;
    
    return isWeekly || isMonthly || isQuarterly || isYearly;
  }

  /**
   * Check if transactions have subscription-related keywords
   */
  private static hasSubscriptionKeywords(transactions: Transaction[]): boolean {
    const subscriptionKeywords = [
      'prime', 'subscription', 'membership', 'premium', 'monthly', 'yearly',
      'auto', 'recurring', 'plan', 'service', 'renew'
    ];
    
    return transactions.some(tx => {
      const description = tx.description.toLowerCase();
      const merchant = (tx.merchant || '').toLowerCase();
      
      return subscriptionKeywords.some(keyword => 
        description.includes(keyword) || merchant.includes(keyword)
      );
    });
  }

  /**
   * Get count of related transactions for a merchant
   */
  static async getRelatedTransactionCount(
    userId: string, 
    merchantName: string
  ): Promise<number> {
    const normalizedMerchant = this.normalizeMerchantName(merchantName);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`LOWER(${transactions.merchant}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`} OR LOWER(${transactions.description}) LIKE ${`%${normalizedMerchant.toLowerCase()}%`}`
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Increment applied count for an override
   */
  static async incrementAppliedCount(id: string): Promise<void> {
    await db
      .update(userRecurringOverrides)
      .set({ 
        appliedCount: sql`${userRecurringOverrides.appliedCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userRecurringOverrides.id, id));
  }

  /**
   * Check if a transaction should be marked as recurring based on user overrides
   */
  static async shouldTransactionBeRecurring(
    userId: string,
    merchant: string
  ): Promise<{ isRecurring: boolean; confidence: number; source: string; override?: UserRecurringOverride }> {
    const override = await this.getOverrideForMerchant(userId, merchant);
    
    if (!override) {
      return { isRecurring: false, confidence: 0, source: 'no_override' };
    }

    // Increment usage count
    this.incrementAppliedCount(override.id);

    return {
      isRecurring: override.recurringStatus === 'recurring',
      confidence: parseFloat(override.confidence || '1.0'),
      source: 'user_override',
      override
    };
  }

  /**
   * Apply manual recurring selection
   */
  static async applyManualSelection({
    userId,
    merchantName,
    selectedTransactionIds,
    applyToFuture = true
  }: {
    userId: string;
    merchantName: string;
    selectedTransactionIds: string[];
    applyToFuture: boolean;
  }): Promise<{
    selectedCount: number;
    rulesCreated: boolean;
    affectedTransactions: number;
  }> {
    const normalizedMerchant = this.normalizeMerchantName(merchantName);
    
    // Get the selected transactions to analyze patterns
    const selectedTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.id, selectedTransactionIds)
        )
      );

    // Create amount patterns for future transaction matching
    const amountPatterns = Array.from(new Set(selectedTransactions.map(t => parseFloat(t.amount))));
    
    // Store the manual selection as a rule for future transactions
    if (applyToFuture && selectedTransactionIds.length > 0) {
      const existingOverride = await this.getOverrideForMerchant(userId, normalizedMerchant);
      
      if (existingOverride) {
        await this.updateOverride(existingOverride.id, {
          recurringStatus: 'recurring',
          applyToAll: true,
          reason: `Manual selection: ${selectedTransactionIds.length} transactions marked as recurring`
        });
      } else {
        await this.createOverride({
          userId,
          merchantName: normalizedMerchant,
          originalMerchant: merchantName,
          recurringStatus: 'recurring',
          applyToAll: true,
          reason: `Manual selection: ${selectedTransactionIds.length} transactions marked as recurring`,
          relatedTransactionCount: selectedTransactionIds.length
        });
      }
    }

    // Also create a recurring transaction record for upcoming bills display
    if (applyToFuture && selectedTransactionIds.length > 0) {
      await this.createRecurringTransactionFromManualSelection(
        userId,
        normalizedMerchant,
        merchantName,
        selectedTransactions
      );
    }

    console.log(`✅ Applied manual selection for ${merchantName}: ${selectedTransactionIds.length} transactions`);
    
    return {
      selectedCount: selectedTransactionIds.length,
      rulesCreated: applyToFuture,
      affectedTransactions: selectedTransactions.length
    };
  }

  /**
   * Get summary stats for user overrides
   */
  static async getOverrideSummary(userId: string): Promise<{
    totalOverrides: number;
    recurringCount: number;
    nonRecurringCount: number;
    totalApplications: number;
  }> {
    const overrides = await this.getUserOverrides(userId);
    
    return {
      totalOverrides: overrides.length,
      recurringCount: overrides.filter(o => o.recurringStatus === 'recurring').length,
      nonRecurringCount: overrides.filter(o => o.recurringStatus === 'non-recurring').length,
      totalApplications: overrides.reduce((sum, o) => sum + (o.appliedCount || 0), 0)
    };
  }

  /**
   * Create a recurring transaction record from manual selection
   */
  private static async createRecurringTransactionFromManualSelection(
    userId: string,
    normalizedMerchant: string,
    originalMerchant: string,
    selectedTransactions: any[]
  ): Promise<void> {
    const { recurringTransactions } = await import("@shared/schema");
    
    if (selectedTransactions.length === 0) return;

    // Calculate average amount and determine frequency from transaction patterns
    const amounts = selectedTransactions.map(t => parseFloat(t.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    
    // Sort transactions by date to analyze frequency
    const sortedTransactions = selectedTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Use the most recent transaction date and estimate next due date
    const lastTransactionDate = new Date(sortedTransactions[0].date);
    const nextDueDate = new Date(lastTransactionDate);
    
    // Assume monthly frequency for manual selections
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    
    // Generate ID for recurring transaction
    const merchantKey = Buffer.from(normalizedMerchant).toString('base64').slice(0, 8);
    const recurringId = `recurring_${userId}_${merchantKey}`;
    
    // Check if recurring transaction already exists
    const existing = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.id, recurringId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing record
      await db
        .update(recurringTransactions)
        .set({
          amount: avgAmount.toFixed(2),
          lastTransactionDate,
          nextDueDate,
          isActive: true,
          autoDetected: false, // Mark as manually created
          confidence: "1.00",
          updatedAt: new Date()
        })
        .where(eq(recurringTransactions.id, recurringId));
      
      console.log(`✅ Updated existing recurring transaction: ${originalMerchant}`);
    } else {
      // Create new recurring transaction record
      const insertData = {
        id: recurringId,
        userId,
        name: originalMerchant,
        merchant: normalizedMerchant,
        category: selectedTransactions[0].category || 'Other',
        categoryId: selectedTransactions[0].categoryId || null,
        amount: avgAmount.toFixed(2),
        frequency: 'monthly',
        frequencyDays: 30,
        nextDueDate,
        lastTransactionDate,
        isActive: true,
        isRecurring: true,
        ignoreType: 'none',
        tags: JSON.stringify(['manual-selection', 'recurring']),
        notes: `Manually selected from ${selectedTransactions.length} transactions`,
        notificationDays: 3,
        linkedTransactionIds: JSON.stringify(selectedTransactions.map(t => t.id)),
        accountId: selectedTransactions[0].accountId || null,
        autoDetected: false,
        confidence: "1.00",
        merchantLogo: null,
        excludeFromBills: false
      };
      
      await db.insert(recurringTransactions).values([insertData]);
      console.log(`✅ Created new recurring transaction: ${originalMerchant}`);
    }
  }

  /**
   * Normalize merchant name for consistent matching
   */
  private static normalizeMerchantName(merchantName: string): string {
    return merchantName
      .toLowerCase()
      .replace(/[^\w\s&+]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export service as default
export default UserRecurringOverrideService;