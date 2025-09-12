import { db } from "./db";
import { adminCategories, plaidCategoryMap } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { PLAID_CATEGORY_MAPPINGS, UNIQUE_CATEGORIES } from "./parsePlaidMapping";

// Complete standardized category data with stable slugs
const STANDARDIZED_CATEGORIES = [
  // BUDGET CATEGORIES (17) - sortOrder 10-170
  { name: "Auto & Transport", slug: "auto-and-transport", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#3b82f6", sortOrder: 10 },
  { name: "Bank Fees", slug: "bank-fees", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#ef4444", sortOrder: 20 },
  { name: "Entertainment", slug: "entertainment", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#8b5cf6", sortOrder: 30 },
  { name: "Family Care", slug: "family-care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#ec4899", sortOrder: 40 },
  { name: "Food & Drink", slug: "food-and-drink", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f59e0b", sortOrder: 50 },
  { name: "General Services", slug: "general-services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#6b7280", sortOrder: 60 },
  { name: "Gifts", slug: "gifts", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f97316", sortOrder: 70 },
  { name: "Government & Non-Profit", slug: "government-and-non-profit", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#059669", sortOrder: 80 },
  { name: "Groceries", slug: "groceries", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#10b981", sortOrder: 90 },
  { name: "Health & Wellness", slug: "health-and-wellness", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#06b6d4", sortOrder: 100 },
  { name: "Home & Garden", slug: "home-and-garden", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#84cc16", sortOrder: 110 },
  { name: "Medical & Healthcare", slug: "medical-and-healthcare", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#dc2626", sortOrder: 120 },
  { name: "Personal Care", slug: "personal-care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#d946ef", sortOrder: 130 },
  { name: "Pets", slug: "pets", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#f472b6", sortOrder: 140 },
  { name: "Shopping", slug: "shopping", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#a855f7", sortOrder: 150 },
  { name: "Software & Tech", slug: "software-and-tech", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#3b82f6", sortOrder: 160 },
  { name: "Travel & Vacation", slug: "travel-and-vacation", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#0891b2", sortOrder: 170 },

  // TRANSACTION-SPECIFIC CATEGORIES (13) - sortOrder 200-320
  { name: "Income", slug: "income", ledgerType: "INCOME", budgetType: "NON_MONTHLY", color: "#22c55e", sortOrder: 200 },
  { name: "Bills & Utilities", slug: "bills-and-utilities", ledgerType: "EXPENSE", budgetType: "FIXED", color: "#6366f1", sortOrder: 210 },
  { name: "Legal", slug: "legal", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", color: "#7c3aed", sortOrder: 220 },
  { name: "Education", slug: "education", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#0891b2", sortOrder: 230 },
  { name: "Taxes", slug: "taxes", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", color: "#dc2626", sortOrder: 240 },
  { name: "Donations", slug: "donations", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", color: "#059669", sortOrder: 250 },
  { name: "Transfers", slug: "transfers", ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", color: "#6b7280", sortOrder: 260 },
  { name: "Credit Card Payment", slug: "credit-card-payment", ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", color: "#ef4444", sortOrder: 270 },
  { name: "Loan Payments", slug: "loan-payments", ledgerType: "TRANSFER", budgetType: "FIXED", color: "#f59e0b", sortOrder: 280 },
  { name: "Uncategorized", slug: "uncategorized", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", color: "#9ca3af", sortOrder: 290 },
  { name: "Reimbursement", slug: "reimbursement", ledgerType: "ADJUSTMENT", budgetType: "NON_MONTHLY", color: "#10b981", sortOrder: 300 },
  { name: "Savings Transfer", slug: "savings-transfer", ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", color: "#06b6d4", sortOrder: 310 },
  { name: "Investment", slug: "investment", ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", color: "#8b5cf6", sortOrder: 320 },
] as const;

export async function seedComprehensiveCategories() {
  console.log("🌱 Seeding comprehensive category and Plaid mapping system...");
  
  try {
    // Step 1: Upsert admin categories (non-destructive)
    console.log("📋 Upserting standardized categories...");
    
    for (const category of STANDARDIZED_CATEGORIES) {
      // Check if category exists by slug (or name if no slug)
      const existing = await db
        .select({ id: adminCategories.id })
        .from(adminCategories)
        .where(
          category.slug 
            ? eq(adminCategories.slug, category.slug)
            : eq(adminCategories.name, category.name)
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing category
        await db
          .update(adminCategories)
          .set({
            name: category.name,
            slug: category.slug,
            ledgerType: category.ledgerType as any,
            budgetType: category.budgetType as any,
            color: category.color,
            sortOrder: category.sortOrder,
            updatedAt: sql`now()`,
          })
          .where(eq(adminCategories.id, existing[0].id));
      } else {
        // Insert new category
        await db.insert(adminCategories).values({
          name: category.name,
          slug: category.slug,
          ledgerType: category.ledgerType as any,
          budgetType: category.budgetType as any,
          color: category.color,
          sortOrder: category.sortOrder,
          isActive: true,
        });
      }
    }

    // Step 2: Clear existing Plaid mappings to rebuild fresh
    console.log("🧹 Clearing existing Plaid mappings...");
    await db.delete(plaidCategoryMap);

    // Step 3: Insert comprehensive Plaid mappings
    console.log("🔗 Creating comprehensive Plaid category mappings...");
    
    for (const mapping of PLAID_CATEGORY_MAPPINGS) {
      await db.insert(plaidCategoryMap).values({
        plaidPrimary: mapping.plaidPrimary,
        plaidDetailed: mapping.plaidDetailed,
        adminCategorySlug: mapping.slug,
        ledgerType: mapping.ledgerType,
        confidence: "0.95", // High confidence for user-provided mappings
      });
    }

    // Step 4: Update existing admin categories with slugs if missing
    console.log("🔧 Ensuring all categories have slugs...");
    const categoriesWithoutSlugs = await db
      .select({ id: adminCategories.id, name: adminCategories.name })
      .from(adminCategories)
      .where(sql`${adminCategories.slug} IS NULL`);

    for (const cat of categoriesWithoutSlugs) {
      const slug = cat.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[&]/g, 'and')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/\-+/g, '-')
        .replace(/^\-|\-$/g, '');
        
      await db
        .update(adminCategories)
        .set({ slug, updatedAt: sql`now()` })
        .where(eq(adminCategories.id, cat.id));
    }

    // Step 5: Get final stats
    const [adminCategoriesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminCategories);
      
    const [plaidMappingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(plaidCategoryMap);

    const budgetCategoriesCount = STANDARDIZED_CATEGORIES.filter(cat => cat.sortOrder < 200).length;
    const transactionCategoriesCount = STANDARDIZED_CATEGORIES.filter(cat => cat.sortOrder >= 200).length;

    console.log(`✅ Comprehensive categorization system seeded successfully:`);
    console.log(`   • ${adminCategoriesCount.count} total admin categories`);
    console.log(`   • ${budgetCategoriesCount} budget management categories`);
    console.log(`   • ${transactionCategoriesCount} transaction-specific categories`);
    console.log(`   • ${plaidMappingsCount.count} Plaid category mappings`);
    console.log(`   • Data integrity preserved (non-destructive upserts)`);

    return { 
      success: true, 
      adminCategories: adminCategoriesCount.count,
      plaidMappings: plaidMappingsCount.count,
      budgetCategories: budgetCategoriesCount,
      transactionCategories: transactionCategoriesCount
    };
  } catch (error) {
    console.error("❌ Error seeding comprehensive categories:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedComprehensiveCategories()
    .then(() => {
      console.log("🎉 Comprehensive categorization system ready!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to seed comprehensive categories:", error);
      process.exit(1);
    });
}