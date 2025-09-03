// Frontend service for transaction classification
// This mirrors the backend TransactionClassificationService but for client-side usage

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

export class TransactionClassificationService {
  
  /**
   * Classify a transaction via API
   */
  static async classifyTransaction(transaction: {
    id: string;
    description: string;
    merchant?: string;
    userId: string;
    amount: string;
  }, userId: string): Promise<ClassificationResult> {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Classification API error: ${response.status}`);
      }

      const result = await response.json();
      return result.classification as ClassificationResult;
    } catch (error) {
      console.error('Error classifying transaction:', error);
      // Return default classification result
      return {
        categoryConfidence: 0,
        categorySource: 'fallback',
        isRecurring: false,
        recurringConfidence: 0,
        recurringSource: 'none'
      };
    }
  }

  /**
   * Get recurring status for a merchant
   */
  static async getMerchantRecurringStatus(merchantName: string): Promise<{
    isRecurring: boolean;
    confidence: number;
    source: string;
    hasUserOverride: boolean;
  }> {
    try {
      const response = await fetch(`/api/user/recurring-overrides/related-transactions?merchant=${encodeURIComponent(merchantName)}`);
      if (!response.ok) throw new Error('Failed to fetch merchant status');

      const data = await response.json();
      return {
        isRecurring: false,
        confidence: 0,
        source: 'none',
        hasUserOverride: false,
        // Additional data from API response can be processed here
        ...data
      };
    } catch (error) {
      console.error('Error fetching merchant recurring status:', error);
      return {
        isRecurring: false,
        confidence: 0,
        source: 'error',
        hasUserOverride: false
      };
    }
  }

  /**
   * Helper to determine if a transaction needs user review
   */
  static needsUserReview(classification: ClassificationResult): boolean {
    const lowRecurringConfidence = classification.recurringConfidence < 0.5 && classification.recurringConfidence > 0;
    const lowCategoryConfidence = classification.categoryConfidence < 0.7;
    const noRecurringData = classification.recurringSource === 'none';
    
    return lowRecurringConfidence || lowCategoryConfidence || noRecurringData;
  }

  /**
   * Get classification confidence color for UI
   */
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    if (confidence >= 0.3) return 'orange';
    return 'red';
  }

  /**
   * Format confidence score for display
   */
  static formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }
}

export default TransactionClassificationService;