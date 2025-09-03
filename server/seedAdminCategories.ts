import { db } from "./db";
import { adminCategories } from "@shared/schema";

const defaultAdminCategories = [
  // INCOME CATEGORIES (4 categories)
  { name: "Paychecks", ledgerType: "INCOME", color: "#10B981", sortOrder: 1 },
  { name: "Interest", ledgerType: "INCOME", color: "#059669", sortOrder: 2 },
  { name: "Business Income", ledgerType: "INCOME", color: "#047857", sortOrder: 3 },
  { name: "Other Income", ledgerType: "INCOME", color: "#065F46", sortOrder: 4 },
  
  // EXPENSE CATEGORIES - Gifts & Donations
  { name: "Charity", ledgerType: "EXPENSE", color: "#F59E0B", sortOrder: 10 },
  { name: "Gifts", ledgerType: "EXPENSE", color: "#D97706", sortOrder: 11 },
  
  // Auto & Transport
  { name: "Auto Payment", ledgerType: "EXPENSE", color: "#DC2626", sortOrder: 20 },
  { name: "Public Transit", ledgerType: "EXPENSE", color: "#B91C1C", sortOrder: 21 },
  { name: "Gas", ledgerType: "EXPENSE", color: "#991B1B", sortOrder: 22 },
  { name: "Auto Maintenance", ledgerType: "EXPENSE", color: "#7F1D1D", sortOrder: 23 },
  { name: "Parking & Tolls", ledgerType: "EXPENSE", color: "#DC2626", sortOrder: 24 },
  { name: "Taxi & Ride Shares", ledgerType: "EXPENSE", color: "#B91C1C", sortOrder: 25 },
  
  // Housing
  { name: "Mortgage", ledgerType: "EXPENSE", color: "#2563EB", sortOrder: 30 },
  { name: "Rent", ledgerType: "EXPENSE", color: "#1D4ED8", sortOrder: 31 },
  { name: "Home Improvement", ledgerType: "EXPENSE", color: "#1E40AF", sortOrder: 32 },
  
  // Bills & Utilities
  { name: "Garbage", ledgerType: "EXPENSE", color: "#7C3AED", sortOrder: 40 },
  { name: "Water", ledgerType: "EXPENSE", color: "#6D28D9", sortOrder: 41 },
  { name: "Gas & Electric", ledgerType: "EXPENSE", color: "#5B21B6", sortOrder: 42 },
  { name: "Internet & Cable", ledgerType: "EXPENSE", color: "#4C1D95", sortOrder: 43 },
  { name: "Phone", ledgerType: "EXPENSE", color: "#3C1574", sortOrder: 44 },
  
  // Food & Dining
  { name: "Groceries", ledgerType: "EXPENSE", color: "#16A34A", sortOrder: 50 },
  { name: "Restaurants & Bars", ledgerType: "EXPENSE", color: "#15803D", sortOrder: 51 },
  { name: "Coffee Shops", ledgerType: "EXPENSE", color: "#166534", sortOrder: 52 },
  
  // Travel & Lifestyle
  { name: "Travel & Vacation", ledgerType: "EXPENSE", color: "#0891B2", sortOrder: 60 },
  { name: "Entertainment & Recreation", ledgerType: "EXPENSE", color: "#0E7490", sortOrder: 61 },
  
  // Personal
  { name: "Pets", ledgerType: "EXPENSE", color: "#164E63", sortOrder: 70 },
  { name: "Fun Money", ledgerType: "EXPENSE", color: "#0C4A6E", sortOrder: 71 },
  
  // Shopping
  { name: "Clothing", ledgerType: "EXPENSE", color: "#7C3AED", sortOrder: 80 },
  { name: "Furniture & Housewares", ledgerType: "EXPENSE", color: "#6D28D9", sortOrder: 81 },
  { name: "Electronics", ledgerType: "EXPENSE", color: "#5B21B6", sortOrder: 82 },
  
  // Children
  { name: "Child Care", ledgerType: "EXPENSE", color: "#EC4899", sortOrder: 90 },
  { name: "Child Activities", ledgerType: "EXPENSE", color: "#DB2777", sortOrder: 91 },
  { name: "Education", ledgerType: "EXPENSE", color: "#047857", sortOrder: 92 },
  { name: "Student Loans", ledgerType: "EXPENSE", color: "#059669", sortOrder: 93 },
  
  // Health & Wellness
  { name: "Medical", ledgerType: "EXPENSE", color: "#DC2626", sortOrder: 100 },
  { name: "Dentist", ledgerType: "EXPENSE", color: "#B91C1C", sortOrder: 101 },
  { name: "Fitness", ledgerType: "EXPENSE", color: "#991B1B", sortOrder: 102 },
  
  // Financial
  { name: "Loan Repayment", ledgerType: "EXPENSE", color: "#EA580C", sortOrder: 110 },
  { name: "Financial & Legal Services", ledgerType: "EXPENSE", color: "#C2410C", sortOrder: 111 },
  { name: "Financial Fees", ledgerType: "EXPENSE", color: "#9A3412", sortOrder: 112 },
  { name: "Cash & ATM", ledgerType: "EXPENSE", color: "#7C2D12", sortOrder: 113 },
  
  // Insurance (standalone)
  { name: "Insurance", ledgerType: "EXPENSE", color: "#EA580C", sortOrder: 120 },
  
  // Taxes (standalone)
  { name: "Taxes", ledgerType: "EXPENSE", color: "#C2410C", sortOrder: 130 },
  
  // Other
  { name: "Uncategorized", ledgerType: "EXPENSE", color: "#6B7280", sortOrder: 140 },
  { name: "Check", ledgerType: "EXPENSE", color: "#4B5563", sortOrder: 141 },
  { name: "Miscellaneous", ledgerType: "EXPENSE", color: "#374151", sortOrder: 142 },
  
  // BUSINESS CATEGORIES
  { name: "Advertising & Promotion", ledgerType: "EXPENSE", color: "#F59E0B", sortOrder: 200 },
  { name: "Business Utilities & Communication", ledgerType: "EXPENSE", color: "#D97706", sortOrder: 201 },
  { name: "Employee Wages & Contract Labor", ledgerType: "EXPENSE", color: "#B45309", sortOrder: 202 },
  { name: "Business Travel & Meals", ledgerType: "EXPENSE", color: "#92400E", sortOrder: 203 },
  { name: "Business Auto Expenses", ledgerType: "EXPENSE", color: "#78350F", sortOrder: 204 },
  { name: "Business Insurance", ledgerType: "EXPENSE", color: "#451A03", sortOrder: 205 },
  { name: "Office Supplies & Expenses", ledgerType: "EXPENSE", color: "#F59E0B", sortOrder: 206 },
  { name: "Office Rent", ledgerType: "EXPENSE", color: "#D97706", sortOrder: 207 },
  { name: "Postage & Shipping", ledgerType: "EXPENSE", color: "#B45309", sortOrder: 208 },
  
  // TRANSFER CATEGORIES (3 categories)
  { name: "Transfer", ledgerType: "TRANSFER", color: "#6B7280", sortOrder: 300 },
  { name: "Credit Card Payment", ledgerType: "TRANSFER", color: "#4B5563", sortOrder: 301 },
  { name: "Balance Adjustments", ledgerType: "ADJUSTMENT", color: "#374151", sortOrder: 302 },
] as const;

export async function seedAdminCategories() {
  try {
    console.log("Seeding admin categories...");
    
    // Check if admin categories already exist
    const existingCategories = await db.select().from(adminCategories);
    
    if (existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing admin categories. Skipping seed.`);
      return;
    }
    
    // Insert default admin categories
    const insertedCategories = await db
      .insert(adminCategories)
      .values(defaultAdminCategories)
      .returning();
    
    console.log(`Successfully seeded ${insertedCategories.length} admin categories.`);
    return insertedCategories;
  } catch (error) {
    console.error("Error seeding admin categories:", error);
    throw error;
  }
}