import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { recurringMerchants } from '../shared/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface CategorizationResult {
  category: string;
  confidence: number;
  source: 'admin_merchant' | 'transaction_categorizer';
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PRINCIPAL' | 'DEBT_INTEREST' | 'ADJUSTMENT';
}

export class EnhancedTransactionCategorizer {
  
  /**
   * Enhanced categorization that checks Admin Merchants first, then falls back to TransactionCategorizer
   */
  async categorize(description: string, amount: number, merchant?: string): Promise<CategorizationResult> {
    // First, try to match against Admin Recurring Merchants
    const adminMatch = await this.matchAgainstAdminMerchants(description, merchant);
    if (adminMatch) {
      return adminMatch;
    }
    
    // Fall back to TransactionCategorizer
    const { TransactionCategorizer } = await import('../shared/categories');
    const categorizer = new TransactionCategorizer();
    const result = categorizer.categorize(description, amount, merchant);
    
    return {
      category: result.category,
      confidence: result.confidence,
      source: 'transaction_categorizer',
      type: result.type
    };
  }
  
  /**
   * Match transaction against Admin Recurring Merchants table
   */
  private async matchAgainstAdminMerchants(description: string, merchant?: string): Promise<CategorizationResult | null> {
    try {
      // Get all active merchants
      const merchants = await db.select().from(recurringMerchants).where(
        eq(recurringMerchants.isActive, true)
      );
      
      const searchText = merchant || description;
      const normalizedSearch = this.normalizeText(searchText);
      
      let bestMatch: { merchant: any, score: number } | null = null;
      let highestScore = 0;
      
      for (const merchantRecord of merchants) {
        const score = this.calculateMatchScore(normalizedSearch, merchantRecord);
        
        if (score > highestScore && score >= 0.3) { // Lowered threshold
          highestScore = score;
          bestMatch = { merchant: merchantRecord, score };
        }
      }
      
      if (bestMatch) {
        console.log(`✅ Admin Merchant Match: "${description}" → ${bestMatch.merchant.category} (confidence: ${(bestMatch.score * 100).toFixed(1)}%)`);
        
        return {
          category: bestMatch.merchant.category,
          confidence: bestMatch.score,
          source: 'admin_merchant'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error matching admin merchants:', error);
      return null;
    }
  }
  
  /**
   * Calculate match score between transaction and merchant
   */
  private calculateMatchScore(normalizedDescription: string, merchant: any): number {
    const merchantName = this.normalizeText(merchant.merchantName);
    const normalizedName = this.normalizeText(merchant.normalizedName || merchant.merchantName);
    
    console.log(`🔍 Matching "${normalizedDescription}" against merchant "${merchantName}" (normalized: "${normalizedName}")`);
    
    // Exact match gets highest score
    if (normalizedDescription.includes(merchantName) || normalizedDescription.includes(normalizedName)) {
      console.log(`✅ Exact match found: score = 1.0`);
      return 1.0;
    }
    
    // Check patterns if available
    if (merchant.patterns) {
      try {
        const patterns = JSON.parse(merchant.patterns);
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.replace('*', '.*'), 'i');
          if (regex.test(normalizedDescription)) {
            console.log(`✅ Pattern match found: "${pattern}" score = 0.9`);
            return 0.9;
          }
        }
      } catch (error) {
        // Invalid JSON patterns, skip
      }
    }
    
    // Enhanced keyword matching - look for individual words and abbreviations
    const merchantWords = merchantName.split(' ').filter(word => word.length > 1);
    const normalizedWords = normalizedName.split(' ').filter(word => word.length > 1);
    const descriptionWords = normalizedDescription.split(' ').filter(word => word.length > 1);
    
    // Try matching with both merchant name and normalized name
    const allMerchantWords = [...merchantWords, ...normalizedWords].filter((word, index, array) => 
      array.indexOf(word) === index // Remove duplicates
    );
    
    // Special case for abbreviations - check if description contains key abbreviations
    const hasKeyAbbreviation = allMerchantWords.some(word => {
      if (word.length <= 4) { // Likely abbreviation
        const isMatch = descriptionWords.some(dWord => 
          dWord.includes(word) || word.includes(dWord)
        );
        if (isMatch) {
          console.log(`🎯 Abbreviation match: "${word}" found in description`);
          return true;
        }
      }
      return false;
    });
    
    if (hasKeyAbbreviation) {
      console.log(`✅ Abbreviation match accepted: score = 0.8`);
      return 0.8;
    }
    
    const matchedWords = allMerchantWords.filter(word => 
      descriptionWords.some(dWord => {
        const isMatch = dWord.includes(word) || word.includes(dWord) || 
                       this.calculateFuzzyScore(dWord, word) > 0.8;
        if (isMatch) {
          console.log(`🎯 Word match: "${word}" matches "${dWord}"`);
        }
        return isMatch;
      })
    );
    
    const keywordScore = allMerchantWords.length > 0 ? matchedWords.length / allMerchantWords.length : 0;
    console.log(`📊 Keyword score: ${matchedWords.length}/${allMerchantWords.length} = ${keywordScore.toFixed(3)}`);
    
    // Lower threshold for keyword matching
    if (keywordScore >= 0.3) { // Further lowered threshold
      const finalScore = keywordScore * 0.9;
      console.log(`✅ Keyword match accepted: final score = ${finalScore.toFixed(3)}`);
      return finalScore;
    }
    
    // Fuzzy matching using Levenshtein-like approach as fallback
    const fuzzyScore = Math.max(
      this.calculateFuzzyScore(normalizedDescription, merchantName),
      this.calculateFuzzyScore(normalizedDescription, normalizedName)
    );
    
    if (fuzzyScore > 0.6) { // Lowered threshold
      console.log(`✅ Fuzzy match found: score = ${fuzzyScore.toFixed(3)}`);
      return fuzzyScore * 0.8;
    }
    
    console.log(`❌ No match found: final score = 0`);
    return 0;
  }
  
  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ')     // Multiple spaces to single space
      .trim();
  }
  
  /**
   * Calculate fuzzy match score using simple similarity
   */
  private calculateFuzzyScore(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}