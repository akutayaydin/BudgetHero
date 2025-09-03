import { smartCategorize, getCategoryConfidence } from "@shared/merchant-categories";
import { db } from "./db";
import { transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Auto-categorize a transaction using smart categorization
 */
export async function autoCategorizeTransaction(transactionId: string): Promise<string> {
  try {
    // Get the transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Use smart categorization
    const suggestedCategory = smartCategorize(
      transaction.description || "",
      transaction.merchant || undefined
    );

    // Update the transaction with the suggested category
    await db
      .update(transactions)
      .set({ 
        category: suggestedCategory
      })
      .where(eq(transactions.id, transactionId));

    return suggestedCategory;
  } catch (error) {
    console.error("Error auto-categorizing transaction:", error);
    throw error;
  }
}

/**
 * Bulk auto-categorize multiple transactions
 */
export async function bulkAutoCategorizeTransactions(transactionIds: string[]): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const id of transactionIds) {
    try {
      await autoCategorizeTransaction(id);
      success++;
    } catch (error) {
      console.error(`Failed to categorize transaction ${id}:`, error);
      errors++;
    }
  }

  return { success, errors };
}

/**
 * Auto-categorize all uncategorized transactions for a user
 */
export async function autoCategorizeUserTransactions(userId: string): Promise<{ categorized: number; total: number }> {
  try {
    // Get all uncategorized transactions for the user
    const uncategorizedTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    // Filter for transactions that need categorization
    const needsCategorization = uncategorizedTransactions.filter(tx => 
      !tx.category || tx.category === "Other" || tx.category === "Uncategorized"
    );

    let categorized = 0;

    for (const transaction of needsCategorization) {
      try {
        const suggestedCategory = smartCategorize(
          transaction.description || "",
          transaction.merchant || undefined
        );

        // Only update if we found a better category
        if (suggestedCategory !== "Other") {
          await db
            .update(transactions)
            .set({ 
              category: suggestedCategory
            })
            .where(eq(transactions.id, transaction.id));
          
          categorized++;
        }
      } catch (error) {
        console.error(`Failed to categorize transaction ${transaction.id}:`, error);
      }
    }

    return {
      categorized,
      total: needsCategorization.length
    };
  } catch (error) {
    console.error("Error in bulk auto-categorization:", error);
    throw error;
  }
}

/**
 * Get categorization suggestions for a transaction
 */
export function getCategorySuggestions(description: string, merchant?: string): { 
  category: string; 
  confidence: number; 
  reason: string 
}[] {
  const suggestions = [];
  
  // Primary suggestion
  const primaryCategory = smartCategorize(description, merchant);
  const primaryConfidence = getCategoryConfidence(description, merchant, primaryCategory);
  
  suggestions.push({
    category: primaryCategory,
    confidence: primaryConfidence,
    reason: primaryConfidence >= 0.9 ? "Exact merchant match" : 
            primaryConfidence >= 0.7 ? "Keyword match" : "Pattern match"
  });

  // Add alternative suggestions based on partial keyword matches
  // This could be expanded to provide multiple options to users
  
  return suggestions;
}