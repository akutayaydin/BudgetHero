import { db } from "./db";
import { adminCategories, plaidCategoryMap, userMerchantOverrides } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  subcategory?: string | null;
  confidence: number;
  source: "plaid_detailed" | "plaid_primary" | "merchant" | "keyword" | "uncategorized";
  budgetType: string;
  ledgerType: string;
}

export interface Transaction {
  userId?: string;
  description: string;
  merchant?: string | null;
  personalFinanceCategoryPrimary?: string | null;
  personalFinanceCategoryDetailed?: string | null;
  personalFinanceCategoryConfidence?: string | null;
  source?: string;
}

export class ComprehensiveCategorizer {
  private adminCategoriesCache: Array<{
    id: string;
    name: string;
    slug: string | null;
    subcategory: string | null;
    budgetType: string;
    ledgerType: string;
  }> = [];

  private plaidMappingCache: Array<{
    plaidDetailed: string;
    plaidPrimary: string;
    adminCategorySlug: string;
    confidence: number;
    ledgerType: string;
  }> = [];

  private merchantOverrideCache = new Map<string, Map<string, {
    adminCategoryId: string;
    subcategoryName: string | null;
    confidence: number;
  }>>();

  constructor() {
    this.loadCaches();
  }

  /**
   * Load all caches for efficient categorization
   */
  private async loadCaches(): Promise<void> {
    try {
      // Load admin categories
      this.adminCategoriesCache = await db
        .select({
          id: adminCategories.id,
          name: adminCategories.name,
          slug: adminCategories.slug,
          subcategory: adminCategories.subcategory,
          budgetType: adminCategories.budgetType,
          ledgerType: adminCategories.ledgerType,
        })
        .from(adminCategories)
        .where(eq(adminCategories.isActive, true));

      // Load Plaid mapping
      const plaidMappings = await db
        .select({
          plaidDetailed: plaidCategoryMap.plaidDetailed,
          plaidPrimary: plaidCategoryMap.plaidPrimary,
          adminCategorySlug: plaidCategoryMap.adminCategorySlug,
          confidence: plaidCategoryMap.confidence,
          ledgerType: plaidCategoryMap.ledgerType,
        })
        .from(plaidCategoryMap);

      this.plaidMappingCache = plaidMappings.map(mapping => ({
        ...mapping,
        confidence: Number(mapping.confidence) || 0.90,
      }));

      console.log(`💾 Loaded ${this.adminCategoriesCache.length} admin categories and ${this.plaidMappingCache.length} Plaid mappings`);
    } catch (error) {
      console.error("❌ Error loading comprehensive categorizer caches:", error);
    }
  }

  /**
   * Load user-specific merchant overrides
   */
  private async loadMerchantOverrides(userId: string): Promise<void> {
    // Check if this user's overrides are already loaded
    if (this.merchantOverrideCache.has(userId)) return;

    try {
      const overrides = await db
        .select({
          merchantName: userMerchantOverrides.merchantName,
          adminCategoryId: userMerchantOverrides.adminCategoryId,
          subcategoryName: userMerchantOverrides.subcategoryName,
          confidence: userMerchantOverrides.confidence,
        })
        .from(userMerchantOverrides)
        .where(eq(userMerchantOverrides.userId, userId));

      const userOverrides = new Map<string, {
        adminCategoryId: string;
        subcategoryName: string | null;
        confidence: number;
      }>();

      for (const override of overrides) {
        userOverrides.set(override.merchantName.toLowerCase(), {
          adminCategoryId: override.adminCategoryId,
          subcategoryName: override.subcategoryName,
          confidence: Number(override.confidence) || 1.0,
        });
      }

      this.merchantOverrideCache.set(userId, userOverrides);
    } catch (error) {
      console.error("❌ Error loading merchant overrides:", error);
    }
  }

  /**
   * Main categorization method with comprehensive Plaid mapping
   */
  async categorizeTransaction(transaction: Transaction): Promise<CategoryMatch | null> {
    // Refresh caches if empty
    if (this.adminCategoriesCache.length === 0 || this.plaidMappingCache.length === 0) {
      await this.loadCaches();
    }

    // Load user-specific overrides if available
    if (transaction.userId) {
      await this.loadMerchantOverrides(transaction.userId);
    }

    // Priority 1: User merchant overrides
    if (transaction.merchant && transaction.userId) {
      const merchantMatch = this.matchByMerchantOverride(transaction.merchant, transaction.userId);
      if (merchantMatch) {
        return merchantMatch;
      }
    }

    // Priority 2: Comprehensive Plaid mapping (detailed first, then primary)
    if (transaction.personalFinanceCategoryDetailed || transaction.personalFinanceCategoryPrimary) {
      const plaidMatch = this.matchByPlaidMapping(transaction);
      if (plaidMatch) {
        return plaidMatch;
      }
    }

    // Priority 3: Merchant-based keyword matching
    if (transaction.merchant) {
      const merchantMatch = this.matchByMerchantKeywords(transaction.merchant);
      if (merchantMatch) {
        return merchantMatch;
      }
    }

    // Priority 4: Description keyword matching
    const keywordMatch = this.matchByDescriptionKeywords(transaction.description);
    if (keywordMatch) {
      return keywordMatch;
    }

    // Priority 5: Return Uncategorized
    return this.getUncategorizedMatch();
  }

  /**
   * Match using user-specific merchant overrides
   */
  private matchByMerchantOverride(merchant: string, userId: string): CategoryMatch | null {
    const normalizedMerchant = merchant.toLowerCase().trim();
    const userOverrides = this.merchantOverrideCache.get(userId);
    
    if (!userOverrides) return null;
    
    const override = userOverrides.get(normalizedMerchant);
    if (!override) return null;

    const category = this.adminCategoriesCache.find(cat => cat.id === override.adminCategoryId);
    if (!category) return null;

    return {
      categoryId: category.id,
      categoryName: category.name,
      subcategory: override.subcategoryName,
      confidence: override.confidence,
      source: "merchant",
      budgetType: category.budgetType,
      ledgerType: category.ledgerType,
    };
  }

  /**
   * Match using comprehensive Plaid category mapping
   */
  private matchByPlaidMapping(transaction: Transaction): CategoryMatch | null {
    const plaidDetailed = transaction.personalFinanceCategoryDetailed;
    const plaidPrimary = transaction.personalFinanceCategoryPrimary;
    const plaidConfidence = this.getPlaidConfidenceScore(transaction.personalFinanceCategoryConfidence);

    // First try detailed match (highest precision)
    if (plaidDetailed) {
      const detailedMapping = this.plaidMappingCache.find(mapping => 
        mapping.plaidDetailed === plaidDetailed
      );
      
      if (detailedMapping) {
        const category = this.adminCategoriesCache.find(cat => 
          cat.slug === detailedMapping.adminCategorySlug && cat.slug !== null
        );
        
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: Number(detailedMapping.confidence),
            source: "plaid_detailed",
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    // Fallback to primary match
    if (plaidPrimary) {
      const primaryMapping = this.plaidMappingCache.find(mapping => 
        mapping.plaidPrimary === plaidPrimary
      );
      
      if (primaryMapping) {
        const category = this.adminCategoriesCache.find(cat => 
          cat.slug === primaryMapping.adminCategorySlug && cat.slug !== null
        );
        
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: primaryMapping.confidence * 0.9, // Slightly lower for primary fallback
            source: "plaid_primary",
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    return null;
  }

  /**
   * Match by merchant keywords (fallback for non-Plaid transactions)
   */
  private matchByMerchantKeywords(merchant: string): CategoryMatch | null {
    const normalizedMerchant = merchant.toLowerCase();
    
    // Common merchant patterns
    const merchantPatterns = [
      { keywords: ['starbucks', 'peets', 'coffee', 'cafe'], slug: 'food-and-drink', confidence: 0.85 },
      { keywords: ['mcdonalds', 'burger', 'kfc', 'subway', 'chipotle'], slug: 'food-and-drink', confidence: 0.90 },
      { keywords: ['safeway', 'kroger', 'walmart', 'target', 'costco'], slug: 'groceries', confidence: 0.85 },
      { keywords: ['shell', 'chevron', 'exxon', 'bp', 'mobil'], slug: 'auto-and-transport', confidence: 0.90 },
      { keywords: ['amazon', 'ebay', 'shopping'], slug: 'shopping', confidence: 0.75 },
      { keywords: ['netflix', 'spotify', 'hulu', 'disney'], slug: 'entertainment', confidence: 0.95 },
      { keywords: ['uber', 'lyft', 'taxi'], slug: 'auto-and-transport', confidence: 0.90 },
    ];

    for (const pattern of merchantPatterns) {
      if (pattern.keywords.some(keyword => normalizedMerchant.includes(keyword))) {
        const category = this.adminCategoriesCache.find(cat => cat.slug === pattern.slug);
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: pattern.confidence,
            source: "keyword",
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    return null;
  }

  /**
   * Match by description keywords
   */
  private matchByDescriptionKeywords(description: string): CategoryMatch | null {
    const normalizedDescription = description.toLowerCase();
    
    const descriptionPatterns = [
      { keywords: ['salary', 'payroll', 'wages'], slug: 'income', confidence: 0.95 },
      { keywords: ['grocery', 'supermarket'], slug: 'groceries', confidence: 0.85 },
      { keywords: ['gas', 'gasoline', 'fuel'], slug: 'auto-and-transport', confidence: 0.90 },
      { keywords: ['restaurant', 'dining', 'food'], slug: 'food-and-drink', confidence: 0.80 },
      { keywords: ['medical', 'doctor', 'hospital'], slug: 'medical-and-healthcare', confidence: 0.85 },
      { keywords: ['rent', 'mortgage'], slug: 'bills-and-utilities', confidence: 0.95 },
    ];

    for (const pattern of descriptionPatterns) {
      if (pattern.keywords.some(keyword => normalizedDescription.includes(keyword))) {
        const category = this.adminCategoriesCache.find(cat => cat.slug === pattern.slug);
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            subcategory: category.subcategory,
            confidence: pattern.confidence,
            source: "keyword",
            budgetType: category.budgetType,
            ledgerType: category.ledgerType,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get uncategorized match
   */
  private getUncategorizedMatch(): CategoryMatch | null {
    const uncategorized = this.adminCategoriesCache.find(cat => 
      cat.slug === 'uncategorized'
    );
    
    if (!uncategorized) {
      console.warn("⚠️ Uncategorized category not found in admin categories");
      return null;
    }

    return {
      categoryId: uncategorized.id,
      categoryName: uncategorized.name,
      subcategory: null,
      confidence: 0.0,
      source: "uncategorized",
      budgetType: uncategorized.budgetType,
      ledgerType: uncategorized.ledgerType,
    };
  }

  /**
   * Convert Plaid confidence to numeric score
   */
  private getPlaidConfidenceScore(plaidConfidence?: string | null): number {
    switch (plaidConfidence?.toUpperCase()) {
      case 'VERY_HIGH': return 0.95;
      case 'HIGH': return 0.85;
      case 'MEDIUM': return 0.75;
      case 'LOW': return 0.60;
      default: return 0.80; // Default for Plaid mappings
    }
  }

  /**
   * Get category by slug (utility method)
   */
  async getCategoryBySlug(slug: string): Promise<CategoryMatch | null> {
    if (this.adminCategoriesCache.length === 0) {
      await this.loadCaches();
    }

    const category = this.adminCategoriesCache.find(cat => cat.slug === slug);
    if (!category) return null;

    return {
      categoryId: category.id,
      categoryName: category.name,
      subcategory: category.subcategory,
      confidence: 1.0,
      source: "uncategorized",
      budgetType: category.budgetType,
      ledgerType: category.ledgerType,
    };
  }

  /**
   * Refresh all caches (useful after seeding or admin changes)
   */
  async refreshCaches(): Promise<void> {
    // Clear existing caches
    this.adminCategoriesCache = [];
    this.plaidMappingCache = [];
    this.merchantOverrideCache.clear();
    
    // Reload global caches
    await this.loadCaches();
    
    console.log("🔄 Comprehensive categorizer caches refreshed");
  }

  /**
   * Clear merchant overrides for a specific user
   */
  clearUserMerchantCache(userId: string): void {
    this.merchantOverrideCache.delete(userId);
  }

  /**
   * Clear all merchant overrides cache
   */
  clearAllMerchantCaches(): void {
    this.merchantOverrideCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { adminCategories: number; plaidMappings: number; usersWithOverrides: number } {
    return {
      adminCategories: this.adminCategoriesCache.length,
      plaidMappings: this.plaidMappingCache.length,
      usersWithOverrides: this.merchantOverrideCache.size,
    };
  }
}