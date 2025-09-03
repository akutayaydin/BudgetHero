import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { transactions, type Transaction } from "@shared/schema";
import { categorizeTransaction } from "./enhancedCategorization";
import UserRecurringOverrideService from "./userRecurringOverrides";
import { SmartRecurringDetector } from "./smartRecurringDetection";

// Enhanced transaction classification result
export interface ClassificationResult {
  // Category classification
  categoryId?: string;
  categoryName?: string;
  subcategoryName?: string;
  categoryConfidence: number;
  categorySource: 'user_override' | 'merchant_match' | 'keyword_match' | 'fallback';
  
  // Recurring classification
  isRecurring: boolean;
  recurringConfidence: number;
  recurringSource: 'user_override' | 'auto_detection' | 'pattern_analysis' | 'none';
  recurringFrequency?: string;
  
  // Additional context
  relatedTransactionCount?: number;
  merchantLogo?: string;
  suggestions?: string[];
}

/**
 * Enhanced Transaction Classification Service
 * Combines category detection with recurring transaction detection
 * Applies user overrides and maintains classification consistency
 */
export class TransactionClassificationService {

  /**
   * Classify a single transaction for category and recurring status
   */
  static async classifyTransaction(
    transaction: Pick<Transaction, 'id' | 'description' | 'merchant' | 'userId' | 'amount'>,
    userId: string
  ): Promise<ClassificationResult> {
    const merchant = transaction.merchant || transaction.description;
    const result: ClassificationResult = {
      categoryConfidence: 0,
      categorySource: 'fallback',
      isRecurring: false,
      recurringConfidence: 0,
      recurringSource: 'none'
    };

    try {
      // 1. Category Classification
      const categoryResult = await categorizeTransaction(transaction, userId);
      result.categoryId = categoryResult.adminCategoryId;
      result.categoryName = categoryResult.adminCategoryName;
      result.subcategoryName = categoryResult.subcategoryName;
      result.categoryConfidence = categoryResult.confidence;
      result.categorySource = categoryResult.source;

      // 2. Recurring Classification
      const recurringResult = await this.classifyRecurringStatus(userId, merchant, transaction);
      result.isRecurring = recurringResult.isRecurring;
      result.recurringConfidence = recurringResult.confidence;
      result.recurringSource = recurringResult.source;
      result.recurringFrequency = recurringResult.frequency;
      result.relatedTransactionCount = recurringResult.relatedCount;

      // 3. Enhanced Context
      result.merchantLogo = this.getMerchantLogo(merchant);
      result.suggestions = await this.generateSuggestions(transaction, result);

      return result;

    } catch (error) {
      console.error('Error classifying transaction:', error);
      return result;
    }
  }

  /**
   * Classify recurring status for a transaction
   */
  static async classifyRecurringStatus(
    userId: string, 
    merchant: string, 
    transaction: Pick<Transaction, 'id' | 'amount'>
  ): Promise<{
    isRecurring: boolean;
    confidence: number;
    source: 'user_override' | 'auto_detection' | 'pattern_analysis' | 'none';
    frequency?: string;
    relatedCount?: number;
  }> {
    
    // 1. Check user overrides first (highest priority)
    const overrideResult = await UserRecurringOverrideService.shouldTransactionBeRecurring(
      userId, 
      merchant
    );

    if (overrideResult.source === 'user_override') {
      return {
        isRecurring: overrideResult.isRecurring,
        confidence: overrideResult.confidence,
        source: 'user_override',
        relatedCount: overrideResult.override?.relatedTransactionCount
      };
    }

    // 2. Run smart detection for pattern analysis
    try {
      const detectedTransactions = await SmartRecurringDetector.detectRecurringTransactions(userId);
      const merchantNormalized = this.normalizeMerchantName(merchant);
      
      const matchingDetection = detectedTransactions.find(dt => 
        dt.merchant?.toLowerCase().includes(merchantNormalized) ||
        merchantNormalized.includes(dt.merchant?.toLowerCase() || '') ||
        dt.name?.toLowerCase().includes(merchantNormalized)
      );

      if (matchingDetection && matchingDetection.confidence > 0.6) {
        return {
          isRecurring: true,
          confidence: matchingDetection.confidence,
          source: 'auto_detection',
          frequency: matchingDetection.frequency,
          relatedCount: matchingDetection.occurrences
        };
      }

      // 3. Basic pattern analysis as fallback
      const relatedCount = await UserRecurringOverrideService.getRelatedTransactionCount(
        userId, 
        merchant
      );

      if (relatedCount >= 3) {
        return {
          isRecurring: true,
          confidence: Math.min(0.5 + (relatedCount * 0.05), 0.8), // Max 0.8 for pattern analysis
          source: 'pattern_analysis',
          relatedCount
        };
      }

      return {
        isRecurring: false,
        confidence: 0,
        source: 'none',
        relatedCount
      };

    } catch (error) {
      console.error('Error in recurring classification:', error);
      return {
        isRecurring: false,
        confidence: 0,
        source: 'none'
      };
    }
  }

  /**
   * Batch classify multiple transactions
   */
  static async classifyTransactions(
    transactionIds: string[], 
    userId: string
  ): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>();

    // Get transactions from database
    const txs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          // Filter by IDs if provided
          transactionIds.length > 0 
            ? sql`${transactions.id} = ANY(${transactionIds})`
            : undefined
        )
      )
      .limit(100);

    // Classify each transaction
    for (const tx of txs) {
      const classification = await this.classifyTransaction(tx, userId);
      results.set(tx.id, classification);
    }

    return results;
  }

  /**
   * Get merchant logo URL
   */
  private static getMerchantLogo(merchant: string): string | undefined {
    const merchantKey = this.normalizeMerchantName(merchant);
    const logoMap = new Map([
      ['netflix', 'https://logo.clearbit.com/netflix.com'],
      ['spotify', 'https://logo.clearbit.com/spotify.com'],
      ['hulu', 'https://logo.clearbit.com/hulu.com'],
      ['disney+', 'https://logo.clearbit.com/disney.com'],
      ['amazon', 'https://logo.clearbit.com/amazon.com'],
      ['verizon', 'https://logo.clearbit.com/verizon.com'],
      ['att', 'https://logo.clearbit.com/att.com'],
      ['geico', 'https://logo.clearbit.com/geico.com'],
      ['chase', 'https://logo.clearbit.com/chase.com']
    ]);

    return logoMap.get(merchantKey);
  }

  /**
   * Generate suggestions for transaction management
   */
  private static async generateSuggestions(
    transaction: Pick<Transaction, 'description' | 'merchant'>,
    classification: ClassificationResult
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Recurring suggestions
    if (classification.recurringConfidence > 0.7) {
      suggestions.push(`This appears to be a recurring ${classification.recurringFrequency} transaction`);
    } else if (classification.relatedTransactionCount && classification.relatedTransactionCount >= 2) {
      suggestions.push(`You have ${classification.relatedTransactionCount} similar transactions - consider marking as recurring`);
    }

    // Category suggestions
    if (classification.categoryConfidence < 0.7) {
      suggestions.push('Review category assignment for accuracy');
    }

    return suggestions;
  }

  /**
   * Normalize merchant name for consistent matching
   */
  private static normalizeMerchantName(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/[^\w\s&+]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default TransactionClassificationService;