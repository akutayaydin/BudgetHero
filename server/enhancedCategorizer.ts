import { storage } from './storage';

interface Transaction {
  id: string;
  description: string;
  merchant?: string | null;
  source: string;
  personalFinanceCategoryPrimary?: string | null;
  personalFinanceCategoryDetailed?: string | null;
  personalFinanceCategoryConfidence?: string | null;
  category?: string;
  categoryId?: string | null;
}

interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  subcategory: string | null;
  confidence: number;
  source: 'plaid' | 'merchant' | 'keyword' | 'uncategorized';
  budgetType: string;
  ledgerType: string;
}

export class EnhancedCategorizer {
  private adminCategoriesCache: Array<{
    id: string;
    name: string;
    subcategory: string | null;
    ledgerType: string;
    budgetType: string;
    plaidPrimary: string | null;
    plaidDetailed: string | null;
    color: string;
  }> = [];

  constructor() {
    this.loadCategoriesCache();
  }

  private async loadCategoriesCache() {
    try {
      this.adminCategoriesCache = await storage.getAdminCategories() as any[];
      
      console.log(`📋 Loaded ${this.adminCategoriesCache.length} active admin categories for enhanced categorization`);
    } catch (error) {
      console.error('❌ Failed to load admin categories cache:', error);
    }
  }

  /**
   * Main categorization method - prioritizes Plaid categories for connected accounts
   */
  async categorizeTransaction(transaction: Transaction): Promise<CategoryMatch | null> {
    // Refresh cache if empty
    if (this.adminCategoriesCache.length === 0) {
      await this.loadCategoriesCache();
    }

    // Priority 1: Plaid categorization for connected accounts
    if (transaction.source === 'plaid' && transaction.personalFinanceCategoryDetailed) {
      const plaidMatch = this.matchByPlaidCategory(transaction);
      if (plaidMatch) {
        return plaidMatch;
      }
    }

    // Priority 2: Merchant-based categorization (existing flow for manual imports)
    if (transaction.merchant) {
      const merchantMatch = await this.matchByMerchant(transaction.merchant);
      if (merchantMatch) {
        return merchantMatch;
      }
    }

    // Priority 3: Description keyword matching (existing flow)
    const keywordMatch = this.matchByKeywords(transaction.description);
    if (keywordMatch) {
      return keywordMatch;
    }

    // Priority 4: Return Uncategorized for manual review
    return this.getUncategorizedMatch();
  }

  /**
   * Match transaction using Plaid's Personal Finance Categories
   */
  private matchByPlaidCategory(transaction: Transaction): CategoryMatch | null {
    const plaidDetailed = transaction.personalFinanceCategoryDetailed;
    const plaidPrimary = transaction.personalFinanceCategoryPrimary;
    const confidence = this.getPlaidConfidenceScore(transaction.personalFinanceCategoryConfidence);

    // First try exact detailed match
    let category = this.adminCategoriesCache.find(cat => 
      cat.plaidDetailed === plaidDetailed
    );

    // Fallback to primary category match
    if (!category && plaidPrimary) {
      category = this.adminCategoriesCache.find(cat => 
        cat.plaidPrimary === plaidPrimary
      );
    }

    if (category) {
      return {
        categoryId: category.id,
        categoryName: category.name,
        subcategory: category.subcategory,
        confidence,
        source: 'plaid',
        budgetType: category.budgetType,
        ledgerType: category.ledgerType,
      };
    }

    return null;
  }

  /**
   * Convert Plaid confidence levels to numeric scores
   */
  private getPlaidConfidenceScore(confidenceLevel?: string | null): number {
    switch (confidenceLevel?.toUpperCase()) {
      case 'VERY_HIGH': return 0.95;
      case 'HIGH': return 0.85;
      case 'MEDIUM': return 0.75;
      case 'LOW': return 0.65;
      default: return 0.80; // Default for Plaid categorization
    }
  }

  /**
   * Match by merchant name (existing logic)
   */
  private async matchByMerchant(merchant: string): Promise<CategoryMatch | null> {
    // Merchant matching logic - could be expanded with user overrides table
    const normalizedMerchant = merchant.toLowerCase().trim();
    
    // Common merchant patterns
    const merchantPatterns = [
      // Food & Drink
      { patterns: ['starbucks', 'dunkin', 'coffee'], category: 'Coffee Shops', name: 'Food & Drink' },
      { patterns: ['mcdonalds', 'burger king', 'taco bell', 'kfc'], category: 'Fast Food', name: 'Food & Drink' },
      { patterns: ['walmart', 'target', 'costco', 'safeway', 'kroger'], category: null, name: 'Groceries' },
      
      // Auto & Transport
      { patterns: ['shell', 'exxon', 'chevron', 'bp', 'gas'], category: 'Gas', name: 'Auto & Transport' },
      { patterns: ['uber', 'lyft', 'taxi'], category: 'Taxi & Ride Shares', name: 'Auto & Transport' },

      // Shopping
      { patterns: ['amazon', 'ebay'], category: 'Online Marketplaces', name: 'Shopping' },
      { patterns: ['best buy', 'apple store'], category: 'Electronics', name: 'Shopping' },

      // Streaming
      { patterns: ['netflix', 'hulu', 'disney+', 'spotify'], category: 'Streaming', name: 'Bills & Utilities' },

      // Bills & Utilities
      { patterns: ['electric', 'gas company', 'power'], category: 'Gas & Electric', name: 'Bills & Utilities' },
      { patterns: ['internet', 'comcast', 'verizon'], category: 'Internet & Cable', name: 'Bills & Utilities' },
    ];

    for (const pattern of merchantPatterns) {
      if (pattern.patterns.some(p => normalizedMerchant.includes(p))) {
        const category = this.adminCategoriesCache.find(cat => 
          cat.name === pattern.name && cat.subcategory === pattern.category
        );
        
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: 0.75, // High confidence for merchant matching
            source: 'merchant',
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    return null;
  }

  /**
   * Match by description keywords (existing logic)
   */
  private matchByKeywords(description: string): CategoryMatch | null {
    const normalizedDesc = description.toLowerCase().trim();
    
    // Keyword patterns
    const keywordPatterns = [
      // Income
      { keywords: ['salary', 'paycheck', 'wages', 'direct deposit'], category: 'Paychecks', name: 'Income' },
      { keywords: ['interest', 'dividend'], category: 'Interest', name: 'Income' },
      
      // Auto & Transport
      { keywords: ['gas station', 'fuel', 'gasoline'], category: 'Gas', name: 'Auto & Transport' },
      { keywords: ['parking', 'garage', 'meter'], category: 'Parking', name: 'Auto & Transport' },
      { keywords: ['toll', 'fastrak', 'ezpass'], category: 'Tolls', name: 'Auto & Transport' },
      
      // Food
      { keywords: ['restaurant', 'cafe', 'diner'], category: 'Restaurants', name: 'Food & Drink' },
      { keywords: ['grocery', 'supermarket'], category: null, name: 'Groceries' },
      
      // Utilities
      { keywords: ['electric bill', 'electricity'], category: 'Gas & Electric', name: 'Bills & Utilities' },
      { keywords: ['water bill'], category: 'Water', name: 'Bills & Utilities' },
      { keywords: ['phone bill', 'cellular'], category: 'Phone', name: 'Bills & Utilities' },
      
      // Banking
      { keywords: ['atm fee', 'overdraft', 'bank fee'], category: 'ATM Fees', name: 'Bank Fees' },
      
      // Transfer/Payment
      { keywords: ['transfer', 'payment', 'ach'], category: 'Transfer In', name: 'Transfers' },
      { keywords: ['credit card payment'], category: null, name: 'Credit Card Payment' },
    ];

    for (const pattern of keywordPatterns) {
      if (pattern.keywords.some(keyword => normalizedDesc.includes(keyword))) {
        const category = this.adminCategoriesCache.find(cat => 
          cat.name === pattern.name && cat.subcategory === pattern.category
        );
        
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: 0.65, // Medium confidence for keyword matching
            source: 'keyword',
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    return null;
  }

  /**
   * Return uncategorized match for manual review
   */
  private getUncategorizedMatch(): CategoryMatch {
    const uncategorized = this.adminCategoriesCache.find(cat => 
      cat.name === 'Uncategorized'
    );

    if (!uncategorized) {
      // Fallback if uncategorized doesn't exist
      return {
        categoryId: '',
        categoryName: 'Uncategorized',
        subcategory: null,
        confidence: 0.0,
        source: 'uncategorized',
        budgetType: 'FLEXIBLE',
        ledgerType: 'EXPENSE',
      };
    }

    return {
      categoryId: uncategorized.id,
      categoryName: uncategorized.name,
      subcategory: uncategorized.subcategory,
      confidence: 0.0, // No confidence - needs manual review
      source: 'uncategorized',
      budgetType: uncategorized.budgetType,
      ledgerType: uncategorized.ledgerType,
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  async batchCategorize(transactions: Transaction[]): Promise<Map<string, CategoryMatch | null>> {
    const results = new Map<string, CategoryMatch | null>();
    
    for (const transaction of transactions) {
      const match = await this.categorizeTransaction(transaction);
      results.set(transaction.id, match);
    }
    
    return results;
  }

  /**
   * Get categorization statistics
   */
  getCategorizationStats(results: Map<string, CategoryMatch | null>): {
    total: number;
    plaid: number;
    merchant: number;
    keyword: number;
    uncategorized: number;
    averageConfidence: number;
  } {
    const stats = {
      total: results.size,
      plaid: 0,
      merchant: 0,
      keyword: 0,
      uncategorized: 0,
      averageConfidence: 0,
    };

    let totalConfidence = 0;
    let validMatches = 0;

    results.forEach((match) => {
      if (match) {
        switch (match.source) {
          case 'plaid': stats.plaid++; break;
          case 'merchant': stats.merchant++; break;
          case 'keyword': stats.keyword++; break;
          case 'uncategorized': stats.uncategorized++; break;
        }
        totalConfidence += match.confidence;
        validMatches++;
      }
    });

    stats.averageConfidence = validMatches > 0 ? totalConfidence / validMatches : 0;

    return stats;
  }
}

// Export singleton instance
export const enhancedCategorizer = new EnhancedCategorizer();