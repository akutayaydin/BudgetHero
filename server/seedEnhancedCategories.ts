import { db } from './db';
import { adminCategories } from '../shared/schema';

// Enhanced category data with Plaid mapping, subcategories, and budget types
const enhancedCategoryData = [
  // INCOME
  { name: "Income", subcategory: "Paychecks", ledgerType: "INCOME", budgetType: "FIXED", plaidPrimary: "INCOME", plaidDetailed: "INCOME_WAGES", color: "#22c55e", sortOrder: 1 },
  { name: "Income", subcategory: "Interest", ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_INTEREST_EARNED", color: "#22c55e", sortOrder: 2 },
  { name: "Income", subcategory: "Dividends", ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_DIVIDENDS", color: "#22c55e", sortOrder: 3 },
  { name: "Income", subcategory: "Retirement Income", ledgerType: "INCOME", budgetType: "FIXED", plaidPrimary: "INCOME", plaidDetailed: "INCOME_RETIREMENT_PENSION", color: "#22c55e", sortOrder: 4 },
  { name: "Income", subcategory: "Tax Refund", ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_TAX_REFUND", color: "#22c55e", sortOrder: 5 },
  { name: "Income", subcategory: "Unemployment", ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_UNEMPLOYMENT", color: "#22c55e", sortOrder: 6 },
  { name: "Income", subcategory: "Other Income", ledgerType: "INCOME", budgetType: "NON_MONTHLY", plaidPrimary: "INCOME", plaidDetailed: "INCOME_OTHER_INCOME", color: "#22c55e", sortOrder: 7 },

  // TRANSPORTATION
  { name: "Transportation", subcategory: "Gas", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_GAS", color: "#3b82f6", sortOrder: 20 },
  { name: "Transportation", subcategory: "Public Transit", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_PUBLIC_TRANSIT", color: "#3b82f6", sortOrder: 21 },
  { name: "Transportation", subcategory: "Parking & Tolls", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_PARKING", color: "#3b82f6", sortOrder: 22 },
  { name: "Transportation", subcategory: "Parking & Tolls", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_TOLLS", color: "#3b82f6", sortOrder: 23 },
  { name: "Transportation", subcategory: "Taxi & Ride Shares", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", color: "#3b82f6", sortOrder: 24 },
  { name: "Transportation", subcategory: "Bikes & Scooters", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_BIKES_AND_SCOOTERS", color: "#3b82f6", sortOrder: 25 },
  { name: "Transportation", subcategory: "Auto Payment / Maintenance", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "TRANSPORTATION", plaidDetailed: "TRANSPORTATION_OTHER_TRANSPORTATION", color: "#3b82f6", sortOrder: 26 },

  // FOOD & DRINK
  { name: "Food & Drink", subcategory: "Groceries", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_GROCERIES", color: "#f59e0b", sortOrder: 30 },
  { name: "Food & Drink", subcategory: "Restaurants", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_RESTAURANT", color: "#f59e0b", sortOrder: 31 },
  { name: "Food & Drink", subcategory: "Coffee Shops", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_COFFEE", color: "#f59e0b", sortOrder: 32 },
  { name: "Food & Drink", subcategory: "Fast Food", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_FAST_FOOD", color: "#f59e0b", sortOrder: 33 },
  { name: "Food & Drink", subcategory: "Alcohol", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR", color: "#f59e0b", sortOrder: 34 },
  { name: "Food & Drink", subcategory: "Vending Machines", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "FOOD_AND_DRINK", plaidDetailed: "FOOD_AND_DRINK_VENDING_MACHINES", color: "#f59e0b", sortOrder: 35 },

  // RENT & UTILITIES
  { name: "Rent & Utilities", subcategory: "Rent", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_RENT", color: "#8b5cf6", sortOrder: 40 },
  { name: "Rent & Utilities", subcategory: "Mortgage", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_MORTGAGE", color: "#8b5cf6", sortOrder: 41 },
  { name: "Rent & Utilities", subcategory: "Gas & Electric", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", color: "#8b5cf6", sortOrder: 42 },
  { name: "Rent & Utilities", subcategory: "Internet & Cable", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", color: "#8b5cf6", sortOrder: 43 },
  { name: "Rent & Utilities", subcategory: "Phone", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_TELEPHONE", color: "#8b5cf6", sortOrder: 44 },
  { name: "Rent & Utilities", subcategory: "Water", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_WATER", color: "#8b5cf6", sortOrder: 45 },
  { name: "Rent & Utilities", subcategory: "Garbage / Waste", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "RENT_AND_UTILITIES", plaidDetailed: "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT", color: "#8b5cf6", sortOrder: 46 },

  // GENERAL MERCHANDISE
  { name: "General Merchandise", subcategory: "Clothing", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", color: "#ec4899", sortOrder: 50 },
  { name: "General Merchandise", subcategory: "Electronics", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_ELECTRONICS", color: "#ec4899", sortOrder: 51 },
  { name: "General Merchandise", subcategory: "Furniture", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_FURNITURE_AND_HOUSEWARES", color: "#ec4899", sortOrder: 52 },
  { name: "General Merchandise", subcategory: "Department Stores", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_DEPARTMENT_STORES", color: "#ec4899", sortOrder: 53 },
  { name: "General Merchandise", subcategory: "Online Marketplaces", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", color: "#ec4899", sortOrder: 54 },
  { name: "General Merchandise", subcategory: "Superstores", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_SUPERSTORES", color: "#ec4899", sortOrder: 55 },
  { name: "General Merchandise", subcategory: "Convenience Stores", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_CONVENIENCE_STORES", color: "#ec4899", sortOrder: 56 },
  { name: "General Merchandise", subcategory: "Discount Stores", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_MERCHANDISE", plaidDetailed: "GENERAL_MERCHANDISE_DISCOUNT_STORES", color: "#ec4899", sortOrder: 57 },

  // MEDICAL & HEALTHCARE
  { name: "Medical & Healthcare", subcategory: "Medical", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_PRIMARY_CARE", color: "#ef4444", sortOrder: 60 },
  { name: "Medical & Healthcare", subcategory: "Dentist", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_DENTAL_CARE", color: "#ef4444", sortOrder: 61 },
  { name: "Medical & Healthcare", subcategory: "Pharmacy & Supplements", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_PHARMACIES_AND_SUPPLEMENTS", color: "#ef4444", sortOrder: 62 },
  { name: "Medical & Healthcare", subcategory: "Eye Care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_EYE_CARE", color: "#ef4444", sortOrder: 63 },
  { name: "Medical & Healthcare", subcategory: "Nursing Care", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_NURSING_CARE", color: "#ef4444", sortOrder: 64 },
  { name: "Medical & Healthcare", subcategory: "Pets / Veterinary", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_VETERINARY_SERVICES", color: "#ef4444", sortOrder: 65 },
  { name: "Medical & Healthcare", subcategory: "Other Medical", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "MEDICAL", plaidDetailed: "MEDICAL_OTHER_MEDICAL", color: "#ef4444", sortOrder: 66 },

  // PERSONAL CARE
  { name: "Personal Care", subcategory: "Fitness / Gym", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "PERSONAL_CARE", plaidDetailed: "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS", color: "#10b981", sortOrder: 70 },

  // BANK FEES
  { name: "Bank Fees", subcategory: "ATM Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_ATM_FEES", color: "#6b7280", sortOrder: 80 },
  { name: "Bank Fees", subcategory: "Overdraft Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_OVERDRAFT_FEES", color: "#6b7280", sortOrder: 81 },
  { name: "Bank Fees", subcategory: "Foreign Transaction Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_FOREIGN_TRANSACTION_FEES", color: "#6b7280", sortOrder: 82 },
  { name: "Bank Fees", subcategory: "Service Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_OTHER_BANK_FEES", color: "#6b7280", sortOrder: 83 },
  { name: "Bank Fees", subcategory: "Interest Charges", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_INTEREST_CHARGE", color: "#6b7280", sortOrder: 84 },
  { name: "Bank Fees", subcategory: "Other Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "BANK_FEES", plaidDetailed: "BANK_FEES_OTHER_BANK_FEES", color: "#6b7280", sortOrder: 85 },

  // ENTERTAINMENT
  { name: "Entertainment", subcategory: "Casinos & Gambling", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_CASINOS_AND_GAMBLING", color: "#f97316", sortOrder: 90 },
  { name: "Entertainment", subcategory: "Music & Audio", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", color: "#f97316", sortOrder: 91 },
  { name: "Entertainment", subcategory: "TV & Movies", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_TV_AND_MOVIES", color: "#f97316", sortOrder: 92 },
  { name: "Entertainment", subcategory: "Video Games", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_VIDEO_GAMES", color: "#f97316", sortOrder: 93 },
  { name: "Entertainment", subcategory: "Streaming", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_OTHER_ENTERTAINMENT", color: "#f97316", sortOrder: 94 },
  { name: "Entertainment", subcategory: "Other Entertainment", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_OTHER_ENTERTAINMENT", color: "#f97316", sortOrder: 95 },

  // HOME IMPROVEMENT
  { name: "Home Improvement", subcategory: "Hardware Stores", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_HARDWARE", color: "#84cc16", sortOrder: 100 },
  { name: "Home Improvement", subcategory: "Home Repair", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE", color: "#84cc16", sortOrder: 101 },
  { name: "Home Improvement", subcategory: "Home Security", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_SECURITY", color: "#84cc16", sortOrder: 102 },
  { name: "Home Improvement", subcategory: "Furniture & Decor", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_FURNITURE", color: "#84cc16", sortOrder: 103 },
  { name: "Home Improvement", subcategory: "Landscaping / Outdoor", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "HOME_IMPROVEMENT", plaidDetailed: "HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT", color: "#84cc16", sortOrder: 104 },

  // GENERAL SERVICES
  { name: "General Services", subcategory: "Financial & Legal Services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING", color: "#06b6d4", sortOrder: 110 },
  { name: "General Services", subcategory: "Insurance", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_INSURANCE", color: "#06b6d4", sortOrder: 111 },
  { name: "General Services", subcategory: "Education", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_EDUCATION", color: "#06b6d4", sortOrder: 112 },
  { name: "General Services", subcategory: "Childcare", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_CHILDCARE", color: "#06b6d4", sortOrder: 113 },
  { name: "General Services", subcategory: "Automotive Services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_AUTOMOTIVE", color: "#06b6d4", sortOrder: 114 },
  { name: "General Services", subcategory: "Professional Services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", color: "#06b6d4", sortOrder: 115 },
  { name: "General Services", subcategory: "Other Services", ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", color: "#06b6d4", sortOrder: 116 },

  // GOVERNMENT & NON-PROFIT
  { name: "Government & Non-Profit", subcategory: "Taxes", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT", color: "#64748b", sortOrder: 120 },
  { name: "Government & Non-Profit", subcategory: "Donations", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_DONATIONS", color: "#64748b", sortOrder: 121 },
  { name: "Government & Non-Profit", subcategory: "Government Fees", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES", color: "#64748b", sortOrder: 122 },
  { name: "Government & Non-Profit", subcategory: "Other Non-Profit", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT", plaidDetailed: "GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT", color: "#64748b", sortOrder: 123 },

  // SUBSCRIPTIONS (New category group)
  { name: "Subscriptions", subcategory: "Streaming", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_TV_AND_MOVIES", color: "#a855f7", sortOrder: 130 },
  { name: "Subscriptions", subcategory: "Software", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", color: "#a855f7", sortOrder: 131 },
  { name: "Subscriptions", subcategory: "Media", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "ENTERTAINMENT", plaidDetailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", color: "#a855f7", sortOrder: 132 },
  { name: "Subscriptions", subcategory: "Other", ledgerType: "EXPENSE", budgetType: "FIXED", plaidPrimary: "GENERAL_SERVICES", plaidDetailed: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", color: "#a855f7", sortOrder: 133 },

  // TRAVEL
  { name: "Travel", subcategory: "Airfare", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "TRAVEL", plaidDetailed: "TRAVEL_FLIGHTS", color: "#0ea5e9", sortOrder: 140 },
  { name: "Travel", subcategory: "Hotel", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "TRAVEL", plaidDetailed: "TRAVEL_LODGING", color: "#0ea5e9", sortOrder: 141 },
  { name: "Travel", subcategory: "Car Rental", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "TRAVEL", plaidDetailed: "TRAVEL_RENTAL_CARS", color: "#0ea5e9", sortOrder: 142 },
  { name: "Travel", subcategory: "Other", ledgerType: "EXPENSE", budgetType: "NON_MONTHLY", plaidPrimary: "TRAVEL", plaidDetailed: "TRAVEL_OTHER_TRAVEL", color: "#0ea5e9", sortOrder: 143 },

  // TRANSFERS
  { name: "Transfers", subcategory: "Transfer In", ledgerType: "TRANSFER", budgetType: "FLEXIBLE", plaidPrimary: "TRANSFER_IN", plaidDetailed: "TRANSFER_IN_ACCOUNT_TRANSFER", color: "#71717a", sortOrder: 150 },
  { name: "Transfers", subcategory: "Transfer In", ledgerType: "TRANSFER", budgetType: "FLEXIBLE", plaidPrimary: "TRANSFER_IN", plaidDetailed: "TRANSFER_IN_OTHER_TRANSFER_IN", color: "#71717a", sortOrder: 151 },
  { name: "Transfers", subcategory: "Transfer Out", ledgerType: "TRANSFER", budgetType: "FLEXIBLE", plaidPrimary: "TRANSFER_OUT", plaidDetailed: "TRANSFER_OUT_ACCOUNT_TRANSFER", color: "#71717a", sortOrder: 152 },
  { name: "Transfers", subcategory: "Transfer Out", ledgerType: "TRANSFER", budgetType: "FLEXIBLE", plaidPrimary: "TRANSFER_OUT", plaidDetailed: "TRANSFER_OUT_OTHER_TRANSFER_OUT", color: "#71717a", sortOrder: 153 },

  // DEBT / CREDIT (renamed from LOAN_PAYMENTS)
  { name: "Loan Payments", subcategory: "Mortgage", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT", color: "#dc2626", sortOrder: 160 },
  { name: "Loan Payments", subcategory: "Student", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT", color: "#dc2626", sortOrder: 161 },
  { name: "Loan Payments", subcategory: "Personal", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT", color: "#dc2626", sortOrder: 162 },
  { name: "Loan Payments", subcategory: "Credit Card", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT", color: "#dc2626", sortOrder: 163 },
  { name: "Loan Payments", subcategory: "Auto", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_CAR_PAYMENT", color: "#dc2626", sortOrder: 164 },
  { name: "Loan Payments", subcategory: "Other", ledgerType: "DEBT_CREDIT", budgetType: "FIXED", plaidPrimary: "LOAN_PAYMENTS", plaidDetailed: "LOAN_PAYMENTS_OTHER_PAYMENT", color: "#dc2626", sortOrder: 165 },

  // UNCATEGORIZED (Special category for unmatched transactions)
  { name: "Uncategorized", subcategory: null, ledgerType: "EXPENSE", budgetType: "FLEXIBLE", plaidPrimary: null, plaidDetailed: null, color: "#9ca3af", sortOrder: 999 },
];

export async function seedEnhancedCategories() {
  console.log('🌱 Seeding enhanced admin categories with Plaid mapping...');
  
  try {
    // Check if enhanced categories already exist
    const existingCount = await db.select({ count: adminCategories.id }).from(adminCategories);
    if (existingCount.length > 100) {
      console.log('Enhanced categories already seeded. Skipping...');
      return;
    }

    // Clear existing categories first (in development only)
    if (process.env.NODE_ENV === 'development') {
      await db.delete(adminCategories);
      console.log('Cleared existing admin categories for fresh seed...');
    }

    // Insert all enhanced categories
    const insertedCategories = await db.insert(adminCategories).values(
      enhancedCategoryData.map(cat => ({
        name: cat.name,
        subcategory: cat.subcategory,
        ledgerType: cat.ledgerType as "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_CREDIT" | "ADJUSTMENT",
        budgetType: cat.budgetType as "FIXED" | "FLEXIBLE" | "NON_MONTHLY",
        plaidPrimary: cat.plaidPrimary,
        plaidDetailed: cat.plaidDetailed,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isActive: true,
      }))
    ).returning({ id: adminCategories.id, name: adminCategories.name, subcategory: adminCategories.subcategory });

    console.log(`✅ Successfully seeded ${insertedCategories.length} enhanced admin categories:`);
    console.log(`   • ${enhancedCategoryData.filter(c => c.ledgerType === 'INCOME').length} Income categories`);
    console.log(`   • ${enhancedCategoryData.filter(c => c.ledgerType === 'EXPENSE').length} Expense categories`);
    console.log(`   • ${enhancedCategoryData.filter(c => c.ledgerType === 'TRANSFER').length} Transfer categories`);
    console.log(`   • ${enhancedCategoryData.filter(c => c.ledgerType === 'DEBT_CREDIT').length} Debt/Credit categories`);
    console.log(`   • Budget Type breakdown:`);
    console.log(`     - Fixed: ${enhancedCategoryData.filter(c => c.budgetType === 'FIXED').length}`);
    console.log(`     - Flexible: ${enhancedCategoryData.filter(c => c.budgetType === 'FLEXIBLE').length}`);
    console.log(`     - Non-Monthly: ${enhancedCategoryData.filter(c => c.budgetType === 'NON_MONTHLY').length}`);

  } catch (error) {
    console.error('❌ Error seeding enhanced admin categories:', error);
    throw error;
  }
}