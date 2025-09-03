import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TransactionClassificationService from '@/services/transactionClassificationService';

// Hook to automatically classify transactions when they are imported or created
export function useAutoTransactionClassification() {
  const queryClient = useQueryClient();

  const classifyNewTransactions = async (transactionIds: string[]) => {
    if (!transactionIds.length) return;

    try {
      console.log(`🤖 Auto-classifying ${transactionIds.length} new transactions...`);
      
      const classificationPromises = transactionIds.map(async (id) => {
        const response = await fetch(`/api/transactions/${id}/classify`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const result = await response.json();
          return { id, ...result };
        }
        return null;
      });

      const results = await Promise.all(classificationPromises);
      const successful = results.filter(r => r !== null);

      console.log(`✅ Successfully classified ${successful.length}/${transactionIds.length} transactions`);

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });

      return successful;
    } catch (error) {
      console.error('Error in auto-classification:', error);
      return [];
    }
  };

  return { classifyNewTransactions };
}

// Integration service for handling transaction classification in the import process
export class TransactionClassificationIntegration {
  
  /**
   * Enhance transaction data with classification results during import
   */
  static async enhanceTransactionOnImport(transactionData: any, userId: string) {
    try {
      const classification = await TransactionClassificationService.classifyTransaction({
        id: transactionData.id,
        description: transactionData.description,
        merchant: transactionData.merchant || transactionData.description,
        userId,
        amount: transactionData.amount
      }, userId);

      // Return enhanced transaction with classification metadata
      return {
        ...transactionData,
        // Add classification metadata
        _classification: {
          categoryConfidence: classification.categoryConfidence,
          categorySource: classification.categorySource,
          isRecurring: classification.isRecurring,
          recurringConfidence: classification.recurringConfidence,
          recurringSource: classification.recurringSource,
          suggestions: classification.suggestions || []
        }
      };
    } catch (error) {
      console.error('Error enhancing transaction with classification:', error);
      return transactionData;
    }
  }

  /**
   * Batch classify transactions after bulk import
   */
  static async classifyBulkImport(transactionIds: string[], userId: string) {
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < transactionIds.length; i += batchSize) {
      const batch = transactionIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (id) => {
        try {
          const response = await fetch(`/api/transactions/${id}/classify`, {
            method: 'POST'
          });
          return response.ok ? await response.json() : null;
        } catch (error) {
          console.error(`Failed to classify transaction ${id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < transactionIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`📊 Bulk classification complete: ${successful}/${transactionIds.length} transactions processed`);
    
    return results;
  }
}

export default TransactionClassificationIntegration;