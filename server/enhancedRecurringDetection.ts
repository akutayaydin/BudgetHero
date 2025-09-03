import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from './db';
import { transactions, recurringMerchants } from '../shared/schema';

interface TransactionMatch {
  merchantId: string;
  merchantName: string;
  category: string;
  transactionType: string;
  frequency: string;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy' | 'pattern' | 'keyword';
  score: number;
}

interface RecurrencePattern {
  isRecurring: boolean;
  frequency: string;
  confidence: number;
  daysBetween: number[];
  amountVariation: number;
  consistencyScore: number;
}

class EnhancedRecurringDetection {
  
  /**
   * Step A: Transaction Matching
   * Normalize transaction text and match against merchant database
   */
  async matchTransaction(
    description: string, 
    amount: number, 
    userId: string
  ): Promise<TransactionMatch | null> {
    
    // Normalize transaction description
    const normalizedDescription = this.normalizeText(description);
    
    // Get all active merchants from database
    const merchants = await db.select().from(recurringMerchants).where(
      eq(recurringMerchants.isActive, true)
    );
    
    let bestMatch: TransactionMatch | null = null;
    let highestScore = 0;
    
    for (const merchant of merchants) {
      const score = await this.calculateMatchScore(
        normalizedDescription, 
        merchant, 
        amount
      );
      
      if (score.total > highestScore && score.total >= 0.6) {
        highestScore = score.total;
        bestMatch = {
          merchantId: merchant.id,
          merchantName: merchant.merchantName,
          category: merchant.category || 'Unknown',
          transactionType: merchant.transactionType || 'subscription',
          frequency: merchant.frequency || 'monthly',
          confidence: (merchant.confidence as 'high' | 'medium' | 'low') || 'medium',
          matchType: score.type as 'exact' | 'fuzzy' | 'pattern' | 'keyword',
          score: score.total
        };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Step B: Recurrence Pattern Check
   * Analyze historical transactions to confirm recurring patterns
   */
  async analyzeRecurrencePattern(
    merchantMatch: TransactionMatch,
    userId: string,
    currentAmount: number
  ): Promise<RecurrencePattern> {
    
    // Get historical transactions for this merchant/user
    const historicalTransactions = await this.getHistoricalTransactions(
      merchantMatch.merchantName,
      userId
    );
    
    if (historicalTransactions.length < 2) {
      return {
        isRecurring: false,
        frequency: 'unknown',
        confidence: 0,
        daysBetween: [],
        amountVariation: 0,
        consistencyScore: 0
      };
    }
    
    // Analyze time-based patterns
    const timePattern = this.analyzeTimePattern(historicalTransactions);
    
    // Analyze amount-based patterns
    const amountPattern = this.analyzeAmountPattern(
      historicalTransactions, 
      currentAmount
    );
    
    // Calculate overall confidence
    const confidence = this.calculateRecurrenceConfidence(
      timePattern, 
      amountPattern, 
      historicalTransactions.length
    );
    
    return {
      isRecurring: confidence > 0.7,
      frequency: this.determineFrequency(timePattern.averageDays),
      confidence,
      daysBetween: timePattern.daysBetween,
      amountVariation: amountPattern.variation,
      consistencyScore: (timePattern.consistency + amountPattern.consistency) / 2
    };
  }
  
  /**
   * Main detection function combining both steps
   */
  async detectRecurringTransaction(
    description: string,
    amount: number,
    userId: string,
    transactionDate: Date
  ) {
    // Step A: Transaction Matching
    const merchantMatch = await this.matchTransaction(description, amount, userId);
    
    if (!merchantMatch) {
      return {
        isRecurring: false,
        merchant: null,
        pattern: null,
        suggestions: await this.generateSuggestions(description)
      };
    }
    
    // Step B: Recurrence Pattern Check
    const recurrencePattern = await this.analyzeRecurrencePattern(
      merchantMatch,
      userId,
      amount
    );
    
    // Enhanced confidence calculation
    const finalConfidence = this.calculateFinalConfidence(
      merchantMatch,
      recurrencePattern
    );
    
    return {
      isRecurring: recurrencePattern.isRecurring || finalConfidence > 0.8,
      merchant: merchantMatch,
      pattern: recurrencePattern,
      finalConfidence,
      recommendations: this.generateRecommendations(merchantMatch, recurrencePattern)
    };
  }
  
  // Helper Methods
  
  private normalizeText(text: string): string {
    const stopWords = [
      'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co',
      'store', 'shop', 'market', 'center', 'payment', 'purchase',
      'pos', 'debit', 'credit', 'online', 'www', 'com', 'net', 'org'
    ];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .join(' ')
      .trim();
  }
  
  private async calculateMatchScore(
    normalizedDescription: string,
    merchant: any,
    amount: number
  ) {
    const scores = {
      exact: 0,
      fuzzy: 0,
      pattern: 0,
      keyword: 0
    };
    
    const merchantName = this.normalizeText(merchant.merchantName);
    const patterns = merchant.patterns ? JSON.parse(merchant.patterns) : [];
    
    // Exact match
    if (normalizedDescription.includes(merchantName)) {
      scores.exact = 1.0;
    }
    
    // Fuzzy matching (Levenshtein distance)
    scores.fuzzy = this.calculateFuzzyScore(normalizedDescription, merchantName);
    
    // Pattern matching
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace('*', '.*'), 'i');
      if (regex.test(normalizedDescription)) {
        scores.pattern = Math.max(scores.pattern, 0.9);
      }
    }
    
    // Keyword matching
    const merchantWords = merchantName.split(' ');
    const descriptionWords = normalizedDescription.split(' ');
    const matchedWords = merchantWords.filter(word => 
      descriptionWords.some(dWord => dWord.includes(word) || word.includes(dWord))
    );
    scores.keyword = matchedWords.length / merchantWords.length;
    
    // Calculate final score with weights
    const finalScore = Math.max(
      scores.exact * 1.0,
      scores.fuzzy * 0.8,
      scores.pattern * 0.9,
      scores.keyword * 0.7
    );
    
    return {
      total: finalScore,
      type: scores.exact > 0 ? 'exact' : 
            scores.pattern > 0 ? 'pattern' :
            scores.fuzzy > scores.keyword ? 'fuzzy' : 'keyword'
    };
  }
  
  private calculateFuzzyScore(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }
  
  private async getHistoricalTransactions(merchantName: string, userId: string) {
    const normalizedMerchant = this.normalizeText(merchantName);
    
    const historicalTransactions = await db.select({
      amount: transactions.amount,
      date: transactions.date,
      description: transactions.description
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`LOWER(${transactions.description}) LIKE ${'%' + normalizedMerchant + '%'}`
      )
    )
    .orderBy(desc(transactions.date))
    .limit(12); // Last 12 transactions
    
    return historicalTransactions;
  }
  
  private analyzeTimePattern(transactions: any[]) {
    if (transactions.length < 2) {
      return { averageDays: 0, consistency: 0, daysBetween: [] };
    }
    
    const daysBetween: number[] = [];
    
    for (let i = 1; i < transactions.length; i++) {
      const current = new Date(transactions[i-1].date);
      const previous = new Date(transactions[i].date);
      const diffDays = Math.abs((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      daysBetween.push(diffDays);
    }
    
    const averageDays = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
    
    // Calculate consistency (lower standard deviation = higher consistency)
    const variance = daysBetween.reduce((sum, days) => sum + Math.pow(days - averageDays, 2), 0) / daysBetween.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (standardDeviation / averageDays));
    
    return { averageDays, consistency, daysBetween };
  }
  
  private analyzeAmountPattern(transactions: any[], currentAmount: number) {
    const amounts = transactions.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    
    // Calculate amount variation
    const variations = amounts.map(amt => Math.abs(amt - avgAmount) / avgAmount);
    const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
    
    // Consistency score (lower variation = higher consistency)
    const consistency = Math.max(0, 1 - avgVariation);
    
    return { variation: avgVariation, consistency };
  }
  
  private calculateRecurrenceConfidence(
    timePattern: any, 
    amountPattern: any, 
    transactionCount: number
  ): number {
    const timeWeight = 0.4;
    const amountWeight = 0.3;
    const countWeight = 0.3;
    
    const timeScore = timePattern.consistency;
    const amountScore = amountPattern.consistency;
    const countScore = Math.min(transactionCount / 6, 1); // Max score at 6+ transactions
    
    return (timeScore * timeWeight) + (amountScore * amountWeight) + (countScore * countWeight);
  }
  
  private determineFrequency(averageDays: number): string {
    if (averageDays <= 10) return 'weekly';
    if (averageDays <= 20) return 'biweekly';
    if (averageDays <= 35) return 'monthly';
    if (averageDays <= 100) return 'quarterly';
    return 'yearly';
  }
  
  private calculateFinalConfidence(match: TransactionMatch, pattern: RecurrencePattern): number {
    const matchWeight = 0.4;
    const patternWeight = 0.6;
    
    const matchScore = match.score;
    const patternScore = pattern.confidence;
    
    return (matchScore * matchWeight) + (patternScore * patternWeight);
  }
  
  private async generateSuggestions(description: string) {
    const normalized = this.normalizeText(description);
    const words = normalized.split(' ');
    
    // Find merchants with similar keywords
    const suggestions = await db.select({
      merchantName: recurringMerchants.merchantName,
      category: recurringMerchants.category
    })
    .from(recurringMerchants)
    .where(eq(recurringMerchants.isActive, true))
    .limit(5);
    
    return suggestions.filter(merchant => {
      const merchantWords = this.normalizeText(merchant.merchantName).split(' ');
      return merchantWords.some(word => words.includes(word));
    });
  }
  
  private generateRecommendations(match: TransactionMatch, pattern: RecurrencePattern) {
    const recommendations = [];
    
    if (pattern.confidence > 0.8) {
      recommendations.push(`High confidence recurring transaction detected for ${match.merchantName}`);
    }
    
    if (pattern.amountVariation > 0.2) {
      recommendations.push(`Amount varies significantly - consider setting amount range alerts`);
    }
    
    if (match.frequency !== this.determineFrequency(pattern.daysBetween.length > 0 ? 
        pattern.daysBetween.reduce((a, b) => a + b, 0) / pattern.daysBetween.length : 0)) {
      recommendations.push(`Detected frequency differs from expected - consider updating merchant profile`);
    }
    
    return recommendations;
  }
}

export const enhancedRecurringDetection = new EnhancedRecurringDetection();