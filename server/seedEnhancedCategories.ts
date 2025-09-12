import { db } from './db';
import { adminCategories } from '../shared/schema';

// Standardized category data: 17 budget categories + 13 transaction-specific = 30 total
const enhancedCategoryData = [
  // BUDGET CATEGORIES (17) - sortOrder 10-170
  { name: "Auto & Transport", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_GAS", color: "#3b82f6", sortOrder: 10 },
  { name: "Bank Fees", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_ATM_FEES", color: "#ef4444", sortOrder: 20 },
  { name: "Entertainment", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", color: "#8b5cf6", sortOrder: 30 },
  { name: "Family Care", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "PERSONAL_CARE", plaidDetailed: "PERSONAL_CARE_OTHER_PERSONAL_CARE", color: "#ec4899", sortOrder: 40 },
  { name: "Food & Drink", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_RESTAURANT", color: "#f59e0b", sortOrder: 50 },
  { name: "General Services", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", color: "#6b7280", sortOrder: 60 },
  { name: "Gifts", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES", color: "#f97316", sortOrder: 70 },
  { name: "Government & Non-Profit", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_DONATIONS", color: "#059669", sortOrder: 80 },
  { name: "Groceries", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_GROCERIES", color: "#10b981", sortOrder: 90 },
  { name: "Health & Wellness", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "PERSONAL_CARE", plaidDetailed: "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS", color: "#06b6d4", sortOrder: 100 },
  { name: "Home & Garden", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_HARDWARE_STORES", color: "#84cc16", sortOrder: 110 },
  { name: "Medical & Healthcare", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_PRIMARY_CARE", color: "#dc2626", sortOrder: 120 },
  { name: "Personal Care", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "PERSONAL_CARE", plaidDetailed: "PERSONAL_CARE_HAIR_AND_BEAUTY", color: "#d946ef", sortOrder: 130 },
  { name: "Pets", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_VETERINARY_SERVICES", color: "#f472b6", sortOrder: 140 },
  { name: "Shopping", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", color: "#a855f7", sortOrder: 150 },
  { name: "Software & Tech", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_ELECTRONICS", color: "#3b82f6", sortOrder: 160 },
  { name: "Travel & Vacation", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRAVEL", plaidDetailed: "TRAVEL_LODGING", color: "#0891b2", sortOrder: 170 },

  // TRANSACTION-SPECIFIC CATEGORIES (13) - sortOrder 200-320
  { name: "Income", subcategory: null, ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_WAGES", color: "#22c55e", sortOrder: 200 },
  { name: "Bills & Utilities", subcategory: null, ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_RENT", color: "#6366f1", sortOrder: 210 },
  { name: "Legal", subcategory: null, ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "PROFESSIONAL_SERVICES", plaidDetailed: "PROFESSIONAL_SERVICES_LEGAL", color: "#7c3aed", sortOrder: 220 },
  { name: "Education", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", color: "#0891b2", sortOrder: 230 },
  { name: "Taxes", subcategory: null, ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_TAX_PREPARATION", color: "#dc2626", sortOrder: 240 },
  { name: "Donations", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_DONATIONS", color: "#059669", sortOrder: 250 },
  { name: "Transfers", subcategory: null, ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", plaidPrimary: "TRANSFER_IN", plaidDetailed: "TRANSFER_IN_DEPOSIT", color: "#6b7280", sortOrder: 260 },
  { name: "Credit Card Payment", subcategory: null, ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", plaidPrimary: "TRANSFER_OUT", plaidDetailed: "TRANSFER_OUT_OTHER_TRANSFER_OUT", color: "#ef4444", sortOrder: 270 },
  { name: "Loan Payments", subcategory: null, ledgerType: "TRANSFER", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_OTHER_LOAN_PAYMENTS", color: "#f59e0b", sortOrder: 280 },
  { name: "Uncategorized", subcategory: null, ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: null, plaidDetailed: null, color: "#9ca3af", sortOrder: 290 },
  { name: "Reimbursement", subcategory: null, ledgerType: "ADJUSTMENT", budgetType: "NON_MONTHLY", plaidPrimary: "TRANSFER_IN", plaidDetailed: "TRANSFER_IN_OTHER_TRANSFER_IN", color: "#10b981", sortOrder: 300 },
  { name: "Savings Transfer", subcategory: null, ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", plaidPrimary: "TRANSFER_OUT", plaidDetailed: "TRANSFER_OUT_DEPOSIT", color: "#06b6d4", sortOrder: 310 },
  { name: "Investment", subcategory: null, ledgerType: "TRANSFER", budgetType: "NON_MONTHLY", plaidPrimary: "TRANSFER_OUT", plaidDetailed: "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS", color: "#8b5cf6", sortOrder: 320 },
];

export async function seedEnhancedCategories() {
  console.log("🌱 Seeding standardized categories (30 total: 17 budget + 13 transaction-specific)...");
  
  try {
    // Clear existing admin categories for fresh seed
    console.log("Cleared existing admin categories for fresh seed...");
    await db.delete(adminCategories);
    
    // Insert all standardized categories
    await db.insert(adminCategories).values(enhancedCategoryData);
    
    // Get summary stats
    const budgetCategories = enhancedCategoryData.filter(cat => cat.sortOrder < 200);
    const transactionCategories = enhancedCategoryData.filter(cat => cat.sortOrder >= 200);
    
    console.log(`✅ Successfully seeded ${enhancedCategoryData.length} standardized categories:`);
    console.log(`   • ${budgetCategories.length} Budget categories (sortOrder < 200)`);
    console.log(`   • ${transactionCategories.length} Transaction-specific categories (sortOrder >= 200)`);
    
    // Budget type breakdown
    const budgetTypeBreakdown = enhancedCategoryData.reduce((acc, cat) => {
      acc[cat.budgetType] = (acc[cat.budgetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("   • Budget Type breakdown:");
    Object.entries(budgetTypeBreakdown).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });

    return { success: true, totalCategories: enhancedCategoryData.length };
  } catch (error) {
    console.error("Error seeding standardized categories:", error);
    throw error;
  }
}