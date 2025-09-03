import { db } from "./db";
import { transactions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface RecurringTransaction {
  id: string;
  name: string;
  merchant: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  nextDueDate: string;
  lastTransactionDate: string;
  isActive: boolean;
  autoDetected: boolean;
  confidence: number;
  confidenceFactors: ConfidenceFactors;
  tags: string[];
  notificationDays: number;
  accountId: string;
  occurrences: number;
  avgAmount: number;
  amountVariance: number;
  dayOfMonth?: number;
  excludeFromBills?: boolean;
  merchantLogo?: string;
  userOverride?: 'recurring' | 'non-recurring' | null;
  detectionReason: string;
}

export interface ConfidenceFactors {
  merchantType: number;
  transactionCount: number;
  amountConsistency: number;
  timingConsistency: number;
  categoryMatch: number;
  total: number;
}

export interface TransactionPattern {
  transactions: any[];
  amounts: number[];
  dates: Date[];
  avgAmount: number;
  amountVariance: number;
  dayConsistency: number;
  timeBetweenTx: number[];
  normalizedMerchant: string;
  rawMerchants: string[];
  categoryType: 'subscription' | 'utility' | 'insurance' | 'loan' | 'discretionary' | 'unknown';
}

export interface MerchantNormalization {
  normalized: string;
  confidence: number;
  originalMerchants: string[];
}

export class SmartRecurringDetector {
  
  // Improvement 1: Enhanced Merchant Normalization Patterns
  private static readonly MERCHANT_NORMALIZATION_RULES = [
    // Streaming services
    { pattern: /netflix\.com.*|netflix\s+\d+/i, normalized: 'Netflix' },
    { pattern: /spotify\.com.*|spotify\s+\d+/i, normalized: 'Spotify' },
    { pattern: /hulu\.com.*|hulu\s+\d+/i, normalized: 'Hulu' },
    { pattern: /disney\+?.*|disney\s+\d+/i, normalized: 'Disney+' },
    { pattern: /amazon\s+prime.*|amzn\s+prime/i, normalized: 'Amazon Prime' },
    
    // Utilities
    { pattern: /pg&?e.*|pacific\s+gas.*|pge\s+\d+/i, normalized: 'PG&E' },
    { pattern: /edison.*|sce\s+\d+/i, normalized: 'Edison' },
    { pattern: /comcast.*|xfinity.*|cmcsa\s+\d+/i, normalized: 'Comcast' },
    
    // Credit cards
    { pattern: /chase\s+card.*|chase\s+\d+/i, normalized: 'Chase Credit Card' },
    { pattern: /citi\s+card.*|citi\s+\d+/i, normalized: 'Citi Credit Card' },
    { pattern: /amex.*|american\s+express.*|ax\s+\d+/i, normalized: 'American Express' },
    
    // Generic cleanup patterns
    { pattern: /\s+\d{4,}/g, normalized: '' }, // Remove long numbers
    { pattern: /\s+#\d+/g, normalized: '' }, // Remove reference numbers
    { pattern: /\s+\*+.*$/g, normalized: '' }, // Remove asterisk suffixes
  ];

  // Improvement 3: Category-based exclusion patterns
  private static readonly CATEGORY_CLASSIFICATIONS = {
    subscription: {
      patterns: [/netflix|spotify|hulu|disney|amazon prime|adobe|microsoft|google|apple|gym|fitness/i],
      amountVarianceThreshold: 0.05, // ±5%
      categories: ['Subscriptions', 'Entertainment', 'Software', 'Fitness']
    },
    utility: {
      patterns: [/electric|gas|water|sewer|utility|power|energy|internet|phone|cable|comcast|verizon|at&t/i],
      amountVarianceThreshold: 0.15, // ±15%
      categories: ['Utilities', 'Internet', 'Phone']
    },
    insurance: {
      patterns: [/insurance|geico|state farm|allstate|progressive|health insurance/i],
      amountVarianceThreshold: 0.10, // ±10%
      categories: ['Insurance', 'Health Insurance', 'Auto Insurance']
    },
    loan: {
      patterns: [/loan|mortgage|credit card|payment|autopay/i],
      amountVarianceThreshold: 0.05, // ±5%
      categories: ['Credit Card', 'Loans', 'Mortgage']
    },
    discretionary: {
      patterns: [/starbucks|mcdonalds|uber|lyft|restaurant|coffee|dining|shopping|entertainment/i],
      amountVarianceThreshold: 0.50, // Variable
      categories: ['Restaurants', 'Fast Food', 'Coffee Shops', 'Transportation', 'Entertainment', 'Shopping']
    }
  };

  // Improvement 2: Enhanced frequency detection patterns
  private static readonly FREQUENCY_PATTERNS = {
    weekly: { days: 7, tolerance: 2 },
    biweekly: { days: 14, tolerance: 3 },
    monthly: { days: 30, tolerance: 7 },
    quarterly: { days: 90, tolerance: 14 },
    yearly: { days: 365, tolerance: 30 }
  };

  // Improvement 4: Minimum transaction history requirements
  private static readonly MIN_TRANSACTION_REQUIREMENTS = {
    subscription: 2, // Netflix, Spotify - consistent from start
    utility: 2, // Utilities - monthly bills
    insurance: 2, // Insurance - regular payments
    loan: 3, // Credit cards, loans - need more data
    unknown: 3, // Unknown merchants need more evidence
    discretionary: 999 // Never classify discretionary as recurring
  };

  // Improvement 1: Enhanced Merchant Normalization
  private static normalizeMerchant(description: string): MerchantNormalization {
    if (!description) return { normalized: '', confidence: 0, originalMerchants: [] };
    
    let normalized = description.trim().toLowerCase();
    let confidence = 0.7; // Base confidence
    
    // Apply normalization rules
    for (const rule of this.MERCHANT_NORMALIZATION_RULES) {
      if (rule.normalized === '') {
        // Cleanup rule
        normalized = normalized.replace(rule.pattern, '');
      } else if (rule.pattern.test(normalized)) {
        // Specific merchant rule
        normalized = rule.normalized.toLowerCase();
        confidence = 0.95;
        break;
      }
    }
    
    // Final cleanup
    normalized = normalized
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&+]/g, '')
      .trim();
    
    return {
      normalized: normalized || description.toLowerCase(),
      confidence,
      originalMerchants: [description]
    };
  }

  // Improvement 3: Smart category-based classification
  private static classifyMerchantCategory(normalizedMerchant: string, transactionCategory?: string): 'subscription' | 'utility' | 'insurance' | 'loan' | 'discretionary' | 'unknown' {
    // First check transaction category
    for (const [type, config] of Object.entries(this.CATEGORY_CLASSIFICATIONS)) {
      if (config.categories.includes(transactionCategory || '')) {
        return type as keyof typeof this.CATEGORY_CLASSIFICATIONS;
      }
    }
    
    // Then check merchant patterns
    for (const [type, config] of Object.entries(this.CATEGORY_CLASSIFICATIONS)) {
      if (config.patterns.some(pattern => pattern.test(normalizedMerchant))) {
        return type as keyof typeof this.CATEGORY_CLASSIFICATIONS;
      }
    }
    
    return 'unknown';
  }

  // Improvement 2: Enhanced frequency detection with all periods
  private static determineFrequency(timeBetweenTx: number[]): 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular' {
    if (timeBetweenTx.length === 0) return 'irregular';

    const avgDays = timeBetweenTx.reduce((a, b) => a + b, 0) / timeBetweenTx.length;
    
    // Check each frequency pattern
    for (const [frequency, pattern] of Object.entries(this.FREQUENCY_PATTERNS)) {
      if (Math.abs(avgDays - pattern.days) <= pattern.tolerance) {
        return frequency as keyof typeof this.FREQUENCY_PATTERNS;
      }
    }
    
    return 'irregular';
  }

  // Improvement 2: Enhanced day consistency calculation
  private static calculateDayConsistency(dates: Date[]): number {
    if (dates.length < 2) return 0;
    
    const days = dates.map(d => d.getDate());
    const dayGroups = new Map<number, number>();
    
    // Group days with tolerance
    days.forEach(day => {
      let found = false;
      for (const [groupDay, count] of Array.from(dayGroups.entries())) {
        if (Math.abs(day - groupDay) <= 3) { // ±3 days tolerance
          dayGroups.set(groupDay, count + 1);
          found = true;
          break;
        }
      }
      if (!found) {
        dayGroups.set(day, 1);
      }
    });
    
    const maxDayCount = Math.max(...Array.from(dayGroups.values()));
    return maxDayCount / dates.length;
  }

  // Improvement 5: Comprehensive confidence scoring
  private static calculateConfidenceScore(
    normalizedMerchant: string,
    pattern: TransactionPattern,
    frequency: string
  ): { confidence: number; factors: ConfidenceFactors; reason: string } {
    const factors: ConfidenceFactors = {
      merchantType: 0,
      transactionCount: 0,
      amountConsistency: 0,
      timingConsistency: 0,
      categoryMatch: 0,
      total: 0
    };
    
    let reasonParts: string[] = [];
    
    // Factor 1: Merchant type recognition (0-0.3)
    const categoryType = pattern.categoryType;
    if (categoryType === 'subscription') {
      factors.merchantType = 0.3;
      reasonParts.push('known subscription service');
    } else if (categoryType === 'utility') {
      factors.merchantType = 0.25;
      reasonParts.push('utility provider');
    } else if (categoryType === 'insurance' || categoryType === 'loan') {
      factors.merchantType = 0.2;
      reasonParts.push('financial service');
    } else if (categoryType === 'discretionary') {
      factors.merchantType = -0.5; // Negative score for discretionary
      reasonParts.push('discretionary spending (excluded)');
    }
    
    // Factor 2: Transaction count (0-0.25)
    const count = pattern.transactions.length;
    if (count >= 6) {
      factors.transactionCount = 0.25;
      reasonParts.push(`${count} consistent occurrences`);
    } else if (count >= 4) {
      factors.transactionCount = 0.15;
      reasonParts.push(`${count} occurrences`);
    } else if (count >= 3) {
      factors.transactionCount = 0.1;
      reasonParts.push(`${count} occurrences`);
    } else {
      factors.transactionCount = 0.05;
      reasonParts.push(`only ${count} occurrences`);
    }
    
    // Factor 3: Amount consistency (0-0.25)
    const categoryConfig = this.CATEGORY_CLASSIFICATIONS[categoryType as keyof typeof this.CATEGORY_CLASSIFICATIONS];
    const varianceThreshold = categoryConfig?.amountVarianceThreshold || 0.1;
    if (pattern.amountVariance <= varianceThreshold / 2) {
      factors.amountConsistency = 0.25;
      reasonParts.push(`very consistent amount (±${(pattern.amountVariance * 100).toFixed(1)}%)`);
    } else if (pattern.amountVariance <= varianceThreshold) {
      factors.amountConsistency = 0.15;
      reasonParts.push(`consistent amount (±${(pattern.amountVariance * 100).toFixed(1)}%)`);
    } else {
      factors.amountConsistency = 0.05;
      reasonParts.push(`variable amount (±${(pattern.amountVariance * 100).toFixed(1)}%)`);
    }
    
    // Factor 4: Timing consistency (0-0.2)
    if (frequency !== 'irregular') {
      if (pattern.dayConsistency > 0.8) {
        factors.timingConsistency = 0.2;
        reasonParts.push(`${frequency} on consistent dates`);
      } else if (pattern.dayConsistency > 0.6) {
        factors.timingConsistency = 0.15;
        reasonParts.push(`${frequency} timing`);
      } else {
        factors.timingConsistency = 0.1;
        reasonParts.push(`${frequency} but variable dates`);
      }
    }
    
    // Calculate total
    factors.total = factors.merchantType + factors.transactionCount + 
                   factors.amountConsistency + factors.timingConsistency;
    
    // Ensure bounds
    factors.total = Math.max(0, Math.min(1, factors.total));
    
    return {
      confidence: factors.total,
      factors,
      reason: reasonParts.join(', ')
    };
  }

  private static readonly MERCHANT_LOGOS = new Map<string, string>([
    // Subscription services
    ['netflix', 'https://logo.clearbit.com/netflix.com'],
    ['spotify', 'https://logo.clearbit.com/spotify.com'],
    ['hulu', 'https://logo.clearbit.com/hulu.com'],
    ['disney+', 'https://logo.clearbit.com/disney.com'],
    ['amazon prime', 'https://logo.clearbit.com/amazon.com'],
    ['chipotle', 'https://logo.clearbit.com/chipotle.com'],
    ['dominos', 'https://logo.clearbit.com/dominos.com'],
    
    // Transportation
    ['uber', 'https://logo.clearbit.com/uber.com'],
    ['lyft', 'https://logo.clearbit.com/lyft.com'],
    ['united airlines', 'https://logo.clearbit.com/united.com'],
    ['delta', 'https://logo.clearbit.com/delta.com'],
    ['american airlines', 'https://logo.clearbit.com/aa.com'],
    
    // Banks & Financial
    ['chase', 'https://logo.clearbit.com/chase.com'],
    ['bank of america', 'https://logo.clearbit.com/bankofamerica.com'],
    ['wells fargo', 'https://logo.clearbit.com/wellsfargo.com'],
    ['citi', 'https://logo.clearbit.com/citi.com'],
    ['capital one', 'https://logo.clearbit.com/capitalone.com'],
    
    // Utilities
    ['pg&e', 'https://logo.clearbit.com/pge.com'],
    ['edison', 'https://logo.clearbit.com/sce.com'],
    ['verizon', 'https://logo.clearbit.com/verizon.com'],
    ['at&t', 'https://logo.clearbit.com/att.com'],
    ['tmobile', 'https://logo.clearbit.com/t-mobile.com'],
    
    // Retail
    ['walmart', 'https://logo.clearbit.com/walmart.com'],
    ['target', 'https://logo.clearbit.com/target.com'],
    ['costco', 'https://logo.clearbit.com/costco.com'],
    ['amazon', 'https://logo.clearbit.com/amazon.com']
  ]);

  // Improvement 6: User override support with database integration
  private static async getUserOverrides(userId: string): Promise<Map<string, 'recurring' | 'non-recurring'>> {
    try {
      const { UserRecurringOverrideService } = await import('./userRecurringOverrides');
      const overrides = await UserRecurringOverrideService.getUserOverrides(userId);
      
      const overrideMap = new Map<string, 'recurring' | 'non-recurring'>();
      for (const override of overrides) {
        if (override.isActive && override.applyToAll) {
          overrideMap.set(override.merchantName.toLowerCase(), override.recurringStatus as 'recurring' | 'non-recurring');
        }
      }
      
      return overrideMap;
    } catch (error) {
      console.error('Error loading user recurring overrides:', error);
      return new Map();
    }
  }

  // Main detection method with all 8 improvements
  static async detectRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    try {
      console.log('🔍 Starting enhanced recurring transaction detection...');
      
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date));

      if (userTransactions.length === 0) {
        console.log('No transactions found for user');
        return [];
      }

      console.log(`Analyzing ${userTransactions.length} transactions for user ${userId}`);
      
      // Improvement 6: Load user overrides
      const userOverrides = await this.getUserOverrides(userId);

      // Improvement 1: Enhanced merchant normalization and grouping
      const groups = this.groupTransactionsByEnhancedPattern(userTransactions);
      const recurringTransactions: RecurringTransaction[] = [];

      console.log(`Found ${groups.size} potential merchant groups`);

      for (const [key, pattern] of Array.from(groups.entries())) {
        // Check user overrides first
        const override = userOverrides.get(key);
        if (override === 'non-recurring') {
          console.log(`Skipping ${key} due to user override: non-recurring`);
          continue;
        }

        const recurringTx = this.analyzeEnhancedTransactionPattern(key, pattern, userId, override);
        if (recurringTx) {
          recurringTransactions.push(recurringTx);
          console.log(`✅ Detected: ${recurringTx.name} (${recurringTx.frequency}, confidence: ${(recurringTx.confidence * 100).toFixed(1)}%)`);
        }
      }

      console.log(`🎯 Detected ${recurringTransactions.length} recurring transactions`);
      return recurringTransactions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error detecting recurring transactions:', error);
      return [];
    }
  }

  // Improvement 1: Enhanced merchant grouping with normalization
  private static groupTransactionsByEnhancedPattern(transactions: any[]): Map<string, TransactionPattern> {
    const groups = new Map<string, TransactionPattern>();

    transactions.forEach(tx => {
      // Skip income transactions completely
      if (tx.type === 'income') return;
      
      const normalization = this.normalizeMerchant(tx.merchant || tx.description);
      if (!normalization.normalized || normalization.normalized.length < 3) return;

      const key = normalization.normalized;
      const categoryType = this.classifyMerchantCategory(key, tx.category);

      if (!groups.has(key)) {
        groups.set(key, {
          transactions: [],
          amounts: [],
          dates: [],
          avgAmount: 0,
          amountVariance: 0,
          dayConsistency: 0,
          timeBetweenTx: [],
          normalizedMerchant: key,
          rawMerchants: [],
          categoryType
        });
      }

      const group = groups.get(key)!;
      group.transactions.push(tx);
      group.amounts.push(Math.abs(parseFloat(tx.amount)));
      group.dates.push(new Date(tx.date));
      group.rawMerchants.push(tx.merchant || tx.description);
    });

    // Calculate enhanced pattern metrics
    groups.forEach((pattern, key) => {
      this.calculateEnhancedPatternMetrics(pattern);
    });

    return groups;
  }

  private static normalizeTransactionKey(tx: any): string | null {
    const key = (tx.merchant || tx.description || '').trim().toLowerCase();
    if (!key || key.length < 3) return null;

    // Clean up common variations
    return key
      .replace(/\s+/g, ' ')
      .replace(/[#*]+/g, '')
      .replace(/\s+(auto|eft|payment|bill|monthly)\s*$/i, '')
      .replace(/^\s*(payment|bill)\s+/i, '')
      .trim();
  }

  // Improvement 2: Enhanced pattern metrics calculation
  private static calculateEnhancedPatternMetrics(pattern: TransactionPattern): void {
    pattern.avgAmount = pattern.amounts.reduce((a, b) => a + b, 0) / pattern.amounts.length;
    
    // Improved amount variance calculation
    const amountStdDev = Math.sqrt(
      pattern.amounts.reduce((sum, amt) => sum + Math.pow(amt - pattern.avgAmount, 2), 0) / pattern.amounts.length
    );
    pattern.amountVariance = pattern.avgAmount > 0 ? amountStdDev / pattern.avgAmount : 1;

    // Enhanced day consistency calculation
    pattern.dayConsistency = this.calculateDayConsistency(pattern.dates);

    // Calculate time between transactions for frequency detection
    if (pattern.dates.length > 1) {
      pattern.dates.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < pattern.dates.length; i++) {
        const daysBetween = (pattern.dates[i].getTime() - pattern.dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
        pattern.timeBetweenTx.push(daysBetween);
      }
    }
  }

  // Improvement 4 & 7: Enhanced analysis with minimum transaction requirements and edge cases
  private static analyzeEnhancedTransactionPattern(
    merchantKey: string, 
    pattern: TransactionPattern, 
    userId: string,
    userOverride?: 'recurring' | 'non-recurring' | null
  ): RecurringTransaction | null {
    const { transactions, avgAmount, amountVariance, dayConsistency, timeBetweenTx, categoryType } = pattern;
    const latestTx = transactions[0];

    // Improvement 4: Check minimum transaction requirements based on category
    const minRequired = this.MIN_TRANSACTION_REQUIREMENTS[categoryType] || this.MIN_TRANSACTION_REQUIREMENTS.unknown;
    if (transactions.length < minRequired) {
      console.log(`Skipping ${merchantKey}: only ${transactions.length} transactions, need ${minRequired} for ${categoryType}`);
      return null;
    }

    // Improvement 3: Exclude discretionary spending completely
    if (categoryType === 'discretionary') {
      console.log(`Skipping ${merchantKey}: classified as discretionary spending`);
      return null;
    }

    // Improvement 2: Enhanced frequency detection
    const frequency = this.determineFrequency(timeBetweenTx);
    if (frequency === 'irregular' && categoryType === 'unknown') {
      console.log(`Skipping ${merchantKey}: irregular timing for unknown merchant`);
      return null;
    }

    // Improvement 3: Category-specific amount variance validation
    const categoryConfigForVariance = this.CATEGORY_CLASSIFICATIONS[categoryType as keyof typeof this.CATEGORY_CLASSIFICATIONS];
    const varianceThreshold = categoryConfigForVariance?.amountVarianceThreshold || 0.1;
    if (amountVariance > varianceThreshold && categoryType !== 'utility') {
      console.log(`Skipping ${merchantKey}: amount variance ${(amountVariance * 100).toFixed(1)}% exceeds ${(varianceThreshold * 100)}% threshold for ${categoryType}`);
      return null;
    }

    // Improvement 5: Calculate comprehensive confidence score
    const confidenceResult = this.calculateConfidenceScore(merchantKey, pattern, frequency);
    
    // Apply user override bonus
    if (userOverride === 'recurring') {
      confidenceResult.confidence = Math.min(1.0, confidenceResult.confidence + 0.3);
      confidenceResult.reason += ', user confirmed recurring';
    }

    // Reject low confidence detections
    if (confidenceResult.confidence < 0.6) {
      console.log(`Skipping ${merchantKey}: confidence ${(confidenceResult.confidence * 100).toFixed(1)}% below threshold`);
      return null;
    }

    // Improvement 7: Calculate next due date with edge case handling
    const nextDueDate = this.calculateNextDueDate(
      new Date(latestTx.date), 
      frequency, 
      dayConsistency > 0.7 ? new Date(latestTx.date).getDate() : undefined
    );

    // Get merchant logo
    const merchantLogo = this.getMerchantLogo(merchantKey);

    // Improvement 8: Generate transparent detection reason
    const detectionReason = `${confidenceResult.reason}`;

    return {
      id: `recurring_${userId}_${Buffer.from(merchantKey).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
      name: this.formatMerchantName(merchantKey, latestTx),
      merchant: latestTx.merchant || merchantKey,
      category: this.mapCategoryType(categoryType, latestTx.category),
      amount: avgAmount,
      frequency,
      nextDueDate: nextDueDate.toISOString(),
      lastTransactionDate: latestTx.date,
      isActive: true,
      autoDetected: true,
      confidence: confidenceResult.confidence,
      confidenceFactors: confidenceResult.factors,
      tags: this.generateTags(categoryType, frequency),
      notificationDays: this.getNotificationDays(categoryType),
      accountId: latestTx.accountId,
      occurrences: transactions.length,
      avgAmount,
      amountVariance,
      dayOfMonth: dayConsistency > 0.7 ? new Date(latestTx.date).getDate() : undefined,
      excludeFromBills: false, // Fixed: categoryType comparison
      merchantLogo,
      userOverride,
      detectionReason
    };
  }

  // Helper methods for enhanced analysis
  private static formatMerchantName(normalizedKey: string, transaction: any): string {
    // Capitalize normalized merchant name properly
    return normalizedKey.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || transaction.description;
  }

  private static mapCategoryType(categoryType: string, originalCategory?: string): string {
    const mapping: Record<string, string> = {
      subscription: 'Subscriptions',
      utility: 'Utilities', 
      insurance: 'Insurance',
      loan: 'Credit Card',
      discretionary: originalCategory || 'Other',
      unknown: originalCategory || 'Other'
    };
    return mapping[categoryType] || originalCategory || 'Other';
  }

  private static generateTags(categoryType: string, frequency: string): string[] {
    const tags = ['auto-detected'];
    if (categoryType === 'subscription') tags.push('subscription');
    if (categoryType === 'utility') tags.push('utility', 'essential');
    if (categoryType === 'insurance') tags.push('insurance', 'essential');
    if (frequency === 'monthly') tags.push('monthly');
    return tags;
  }

  private static getNotificationDays(categoryType: string): number {
    const defaults: Record<string, number> = {
      subscription: 3,
      utility: 7,
      insurance: 14,
      loan: 5,
      discretionary: 0,
      unknown: 3
    };
    return defaults[categoryType] || 3;
  }

  // Cleanup: Remove legacy methods - all logic is now in enhanced methods above

  // Improvement 7: Enhanced next due date calculation with edge cases
  private static calculateNextDueDate(lastDate: Date, frequency: string, preferredDay?: number): Date {
    const nextDate = new Date(lastDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (preferredDay && preferredDay >= 1 && preferredDay <= 28) {
          // Safe day range to avoid month overflow issues
          nextDate.setDate(preferredDay);
        }
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        if (preferredDay && preferredDay >= 1 && preferredDay <= 28) {
          nextDate.setDate(preferredDay);
        }
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        if (preferredDay && preferredDay >= 1 && preferredDay <= 28) {
          nextDate.setDate(preferredDay);
        }
        break;
      default:
        // Default to monthly for irregular patterns
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }

  // Get merchant logo from our static map
  private static getMerchantLogo(merchantKey: string): string | undefined {
    return this.MERCHANT_LOGOS.get(merchantKey.toLowerCase());
  }

  static async detectMissedPayments(userId: string): Promise<any[]> {
    const recurringTransactions = await this.detectRecurringTransactions(userId);
    const missedPayments: any[] = [];
    const now = new Date();

    for (const recurring of recurringTransactions) {
      const nextDue = new Date(recurring.nextDueDate);
      const daysPastDue = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue > 0 && daysPastDue <= 30) { // Within 30 days past due
        missedPayments.push({
          ...recurring,
          daysPastDue,
          status: daysPastDue > 7 ? 'overdue' : 'late',
          urgency: daysPastDue > 14 ? 'high' : daysPastDue > 7 ? 'medium' : 'low'
        });
      }
    }

    return missedPayments.sort((a, b) => b.daysPastDue - a.daysPastDue);
  }
}