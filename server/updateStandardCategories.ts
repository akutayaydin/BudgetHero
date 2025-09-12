import { db } from "./db";
import { adminCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

// Standard 17 categories as specified by the user
const STANDARD_CATEGORIES = [
  { name: "Auto & Transport", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#3b82f6", sortOrder: 10 },
  { name: "Bank Fees", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#ef4444", sortOrder: 20 },
  { name: "Entertainment", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#8b5cf6", sortOrder: 30 },
  { name: "Family Care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#ec4899", sortOrder: 40 },
  { name: "Food & Drink", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f59e0b", sortOrder: 50 },
  { name: "General Services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#6b7280", sortOrder: 60 },
  { name: "Gifts", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f97316", sortOrder: 70 },
  { name: "Government & Non-Profit", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#059669", sortOrder: 80 },
  { name: "Groceries", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#10b981", sortOrder: 90 },
  { name: "Health & Wellness", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#06b6d4", sortOrder: 100 },
  { name: "Home & Garden", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#84cc16", sortOrder: 110 },
  { name: "Medical & Healthcare", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#dc2626", sortOrder: 120 },
  { name: "Personal Care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#d946ef", sortOrder: 130 },
  { name: "Pets", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f472b6", sortOrder: 140 },
  { name: "Shopping", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#a855f7", sortOrder: 150 },
  { name: "Software & Tech", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#3b82f6", sortOrder: 160 },
  { name: "Travel & Vacation", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#0891b2", sortOrder: 170 },
];

export async function updateStandardCategories() {
  console.log("🗂️ Updating admin categories to standard 17 categories...");

  try {
    // Clear existing categories
    await db.delete(adminCategories);
    console.log("✅ Cleared existing categories");

    // Insert standard categories
    for (const category of STANDARD_CATEGORIES) {
      await db.insert(adminCategories).values({
        name: category.name,
        ledgerType: category.ledgerType as "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_CREDIT" | "ADJUSTMENT",
        budgetType: category.budgetType as "FIXED" | "FLEXIBLE" | "NON_MONTHLY",
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: true,
      });
    }

    console.log(`✅ Created ${STANDARD_CATEGORIES.length} standard categories`);
    
    // List created categories
    const categories = await db.select().from(adminCategories).orderBy(adminCategories.sortOrder);
    console.log("\n📋 Standard Categories:");
    categories.forEach(cat => console.log(`  • ${cat.name}`));
    
    return { success: true, count: categories.length };
  } catch (error) {
    console.error("❌ Error updating standard categories:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateStandardCategories()
    .then(() => {
      console.log("🎉 Standard categories update completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to update standard categories:", error);
      process.exit(1);
    });
}