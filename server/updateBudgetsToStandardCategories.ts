import { db } from "./db";
import { budgets, transactions } from "@shared/schema";
import { eq, isNotNull, or, like } from "drizzle-orm";

// Mapping from old categories to new standard categories
const CATEGORY_MAPPING: Record<string, string> = {
  // Current budget categories → Standard categories
  "Bills & Insurance": "General Services",
  "Entertainment & Recreation": "Entertainment",
  "Gas": "Auto & Transport",
  "Groceries": "Groceries",
  "Kids Activities": "Family Care",
  "Medical": "Medical & Healthcare", 
  "Restaurants & Bars": "Food & Drink",
  "Shopping": "Shopping",

  // Additional common mappings for transactions
  "Coffee Shops": "Food & Drink",
  "Auto & Transport": "Auto & Transport",
  "Auto Maintenance": "Auto & Transport",
  "Public Transit": "Auto & Transport", 
  "Transportation": "Auto & Transport",
  "Utilities": "General Services",
  "Bills & Utilities": "General Services",
  "Internet & Cable": "General Services",
  "Phone": "General Services",
  "Electronics": "Software & Tech",
  "Home Improvement": "Home & Garden",
  "Pets": "Pets",
  "Travel & Vacation": "Travel & Vacation",
  "Health & Wellness": "Health & Wellness",
  "Personal Care": "Personal Care",
  "Medical & Healthcare": "Medical & Healthcare",
  "Bank Fees": "Bank Fees",
  "Gifts": "Gifts",
  "Government & Non-Profit": "Government & Non-Profit",
  "General Services": "General Services",
  "Family Care": "Family Care",
  "Software & Tech": "Software & Tech",
};

export async function updateBudgetsAndTransactionsToStandardCategories() {
  console.log("🔄 Updating budgets and transactions to use standard categories...");

  try {
    // Update budgets
    const existingBudgets = await db.select().from(budgets).where(isNotNull(budgets.category));
    let budgetUpdates = 0;

    for (const budget of existingBudgets) {
      if (budget.category && CATEGORY_MAPPING[budget.category]) {
        const newCategory = CATEGORY_MAPPING[budget.category];
        await db
          .update(budgets)
          .set({ category: newCategory })
          .where(eq(budgets.id, budget.id));
        console.log(`  Budget "${budget.name}": ${budget.category} → ${newCategory}`);
        budgetUpdates++;
      }
    }

    // Update transactions  
    const existingTransactions = await db.select().from(transactions).where(isNotNull(transactions.category));
    let transactionUpdates = 0;

    for (const transaction of existingTransactions) {
      if (transaction.category && CATEGORY_MAPPING[transaction.category]) {
        const newCategory = CATEGORY_MAPPING[transaction.category];
        await db
          .update(transactions)
          .set({ category: newCategory })
          .where(eq(transactions.id, transaction.id));
        transactionUpdates++;
      }
    }

    console.log(`✅ Updated ${budgetUpdates} budgets and ${transactionUpdates} transactions`);
    
    // Show summary
    const updatedBudgets = await db.select().from(budgets).where(isNotNull(budgets.category));
    const budgetCategoriesUsed = [...new Set(updatedBudgets.map(b => b.category).filter(Boolean))];
    
    console.log("\n📊 Budget Categories Now Used:");
    budgetCategoriesUsed.forEach(cat => console.log(`  • ${cat}`));
    
    return { 
      success: true, 
      budgetUpdates, 
      transactionUpdates, 
      budgetCategoriesUsed: budgetCategoriesUsed.length 
    };
  } catch (error) {
    console.error("❌ Error updating categories:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateBudgetsAndTransactionsToStandardCategories()
    .then(() => {
      console.log("🎉 Category mapping completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to update categories:", error);
      process.exit(1);
    });
}