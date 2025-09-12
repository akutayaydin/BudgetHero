import { db } from "./db";
import { transactions } from "@shared/schema";

// Realistic transaction data for comprehensive testing
async function seedRealisticTransactions(): Promise<void> {
  console.log("🌱 Seeding realistic transaction data...");
  
  try {
    // Get a sample user ID from the database
    const existingTransactions = await db.select({
      userId: transactions.userId,
      accountId: transactions.accountId
    }).from(transactions).limit(1);
    
    // If no users exist, use a default test user ID
    const userId = existingTransactions[0]?.userId || "42553967"; // Default test user
    const checkingAccountId = existingTransactions[0]?.accountId || "checking-account-001";
    const creditCardAccountId = "credit-card-001";
    
    // Generate realistic transactions for the past 3 months
    const now = new Date();
    const realisticTransactions = [];
    
    // Current month transactions (September 2025)
    const currentMonthTransactions = [
      // Income transactions
      { date: "2025-09-01", description: "Direct Deposit - TechCorp", amount: "-4200.00", category: "Paychecks", type: "income", merchant: "TechCorp", account: checkingAccountId },
      
      // Fixed expenses
      { date: "2025-09-01", description: "Mortgage Payment", amount: "1850.00", category: "Mortgage", type: "expense", merchant: "First National Bank", account: checkingAccountId },
      { date: "2025-09-01", description: "Health Insurance Premium", amount: "485.00", category: "Medical", type: "expense", merchant: "Blue Cross Blue Shield", account: checkingAccountId },
      { date: "2025-09-01", description: "Childcare Monthly Fee", amount: "1200.00", category: "Childcare", type: "expense", merchant: "Little Learners Daycare", account: checkingAccountId },
      
      // Utilities
      { date: "2025-09-02", description: "Electric Bill", amount: "156.78", category: "Gas & Electric", type: "expense", merchant: "Pacific Gas & Electric", account: checkingAccountId },
      { date: "2025-09-03", description: "Internet Service", amount: "89.99", category: "Internet & Cable", type: "expense", merchant: "Comcast", account: checkingAccountId },
      { date: "2025-09-04", description: "Phone Bill", amount: "125.45", category: "Phone", type: "expense", merchant: "Verizon", account: creditCardAccountId },
      
      // Groceries & Food
      { date: "2025-09-02", description: "Weekly Grocery Shop", amount: "156.78", category: "Groceries", type: "expense", merchant: "Whole Foods Market", account: creditCardAccountId },
      { date: "2025-09-05", description: "Lunch Meeting", amount: "68.50", category: "Restaurants & Bars", type: "expense", merchant: "The Garden Grill", account: creditCardAccountId },
      { date: "2025-09-07", description: "Coffee & Pastry", amount: "12.45", category: "Coffee Shops", type: "expense", merchant: "Starbucks", account: creditCardAccountId },
      { date: "2025-09-08", description: "Weekend Grocery Run", amount: "92.34", category: "Groceries", type: "expense", merchant: "Trader Joe's", account: creditCardAccountId },
      
      // Transportation
      { date: "2025-09-01", description: "Gas Fill-up", amount: "48.67", category: "Gas", type: "expense", merchant: "Shell", account: creditCardAccountId },
      { date: "2025-09-04", description: "Uber to Airport", amount: "35.20", category: "Taxi & Ride Shares", type: "expense", merchant: "Uber", account: creditCardAccountId },
      { date: "2025-09-06", description: "Public Transit Monthly Pass", amount: "95.00", category: "Public Transit", type: "expense", merchant: "Metro Transit", account: checkingAccountId },
      
      // Shopping & Entertainment
      { date: "2025-09-03", description: "Clothing Purchase", amount: "127.99", category: "Shopping", type: "expense", merchant: "Nordstrom", account: creditCardAccountId },
      { date: "2025-09-05", description: "Streaming Service", amount: "15.99", category: "Entertainment & Recreation", type: "expense", merchant: "Netflix", account: creditCardAccountId },
      { date: "2025-09-07", description: "Office Supplies", amount: "45.67", category: "Shopping", type: "expense", merchant: "Staples", account: creditCardAccountId },
      
      // Recent transactions for 7-day trends
      { date: "2025-09-08", description: "Dinner Out", amount: "89.50", category: "Restaurants & Bars", type: "expense", merchant: "Olive Garden", account: creditCardAccountId },
      { date: "2025-09-09", description: "Gas Station", amount: "52.30", category: "Gas", type: "expense", merchant: "Chevron", account: creditCardAccountId },
      { date: "2025-09-10", description: "Grocery Store", amount: "73.25", category: "Groceries", type: "expense", merchant: "Safeway", account: creditCardAccountId },
      { date: "2025-09-11", description: "Coffee Shop", amount: "8.95", category: "Coffee Shops", type: "expense", merchant: "Peet's Coffee", account: creditCardAccountId },
      { date: "2025-09-12", description: "Lunch", amount: "18.75", category: "Restaurants & Bars", type: "expense", merchant: "Chipotle", account: creditCardAccountId },
      
      // Large purchases for testing largest purchases section
      { date: "2025-09-03", description: "Laptop Purchase", amount: "1299.99", category: "Electronics", type: "expense", merchant: "Best Buy", account: creditCardAccountId },
      { date: "2025-09-05", description: "Home Appliance", amount: "899.00", category: "Home Improvement", type: "expense", merchant: "Home Depot", account: creditCardAccountId },
    ];
    
    // Previous month transactions (August 2025) for comparison
    const lastMonthTransactions = [
      // Income
      { date: "2025-08-01", description: "Direct Deposit - TechCorp", amount: "-4200.00", category: "Paychecks", type: "income", merchant: "TechCorp", account: checkingAccountId },
      
      // Fixed expenses (slightly different amounts for comparison)
      { date: "2025-08-01", description: "Mortgage Payment", amount: "1850.00", category: "Mortgage", type: "expense", merchant: "First National Bank", account: checkingAccountId },
      { date: "2025-08-01", description: "Health Insurance Premium", amount: "485.00", category: "Medical", type: "expense", merchant: "Blue Cross Blue Shield", account: checkingAccountId },
      { date: "2025-08-01", description: "Childcare Monthly Fee", amount: "1200.00", category: "Childcare", type: "expense", merchant: "Little Learners Daycare", account: checkingAccountId },
      
      // Utilities (different amounts)
      { date: "2025-08-02", description: "Electric Bill", amount: "142.34", category: "Gas & Electric", type: "expense", merchant: "Pacific Gas & Electric", account: checkingAccountId },
      { date: "2025-08-03", description: "Internet Service", amount: "89.99", category: "Internet & Cable", type: "expense", merchant: "Comcast", account: checkingAccountId },
      { date: "2025-08-04", description: "Phone Bill", amount: "125.45", category: "Phone", type: "expense", merchant: "Verizon", account: creditCardAccountId },
      
      // Groceries & Food (lower spending in August)
      { date: "2025-08-05", description: "Weekly Grocery Shop", amount: "134.50", category: "Groceries", type: "expense", merchant: "Whole Foods Market", account: creditCardAccountId },
      { date: "2025-08-12", description: "Lunch", amount: "45.20", category: "Restaurants & Bars", type: "expense", merchant: "The Garden Grill", account: creditCardAccountId },
      { date: "2025-08-15", description: "Coffee", amount: "9.75", category: "Coffee Shops", type: "expense", merchant: "Starbucks", account: creditCardAccountId },
      { date: "2025-08-18", description: "Grocery Run", amount: "78.90", category: "Groceries", type: "expense", merchant: "Trader Joe's", account: creditCardAccountId },
      
      // Transportation (lower gas prices in August)
      { date: "2025-08-03", description: "Gas Fill-up", amount: "45.89", category: "Gas", type: "expense", merchant: "Shell", account: creditCardAccountId },
      { date: "2025-08-08", description: "Uber Ride", amount: "28.50", category: "Taxi & Ride Shares", type: "expense", merchant: "Uber", account: creditCardAccountId },
      { date: "2025-08-10", description: "Public Transit Pass", amount: "95.00", category: "Public Transit", type: "expense", merchant: "Metro Transit", account: checkingAccountId },
      
      // Shopping & Entertainment (less spending)
      { date: "2025-08-07", description: "Clothing", amount: "85.99", category: "Shopping", type: "expense", merchant: "Target", account: creditCardAccountId },
      { date: "2025-08-15", description: "Netflix", amount: "15.99", category: "Entertainment & Recreation", type: "expense", merchant: "Netflix", account: creditCardAccountId },
      { date: "2025-08-20", description: "Office Supplies", amount: "23.45", category: "Shopping", type: "expense", merchant: "Office Depot", account: creditCardAccountId },
    ];
    
    // July 2025 transactions (for additional history)
    const july2025Transactions = [
      // Income
      { date: "2025-07-01", description: "Direct Deposit - TechCorp", amount: "-4200.00", category: "Paychecks", type: "income", merchant: "TechCorp", account: checkingAccountId },
      
      // Summer vacation expenses
      { date: "2025-07-15", description: "Hotel Stay", amount: "450.00", category: "Travel & Vacation", type: "expense", merchant: "Marriott", account: creditCardAccountId },
      { date: "2025-07-16", description: "Flight Tickets", amount: "680.00", category: "Travel & Vacation", type: "expense", merchant: "American Airlines", account: creditCardAccountId },
      { date: "2025-07-18", description: "Vacation Dining", amount: "125.50", category: "Restaurants & Bars", type: "expense", merchant: "Seaside Restaurant", account: creditCardAccountId },
      
      // Regular monthly expenses
      { date: "2025-07-01", description: "Mortgage Payment", amount: "1850.00", category: "Mortgage", type: "expense", merchant: "First National Bank", account: checkingAccountId },
      { date: "2025-07-01", description: "Health Insurance", amount: "485.00", category: "Medical", type: "expense", merchant: "Blue Cross Blue Shield", account: checkingAccountId },
      { date: "2025-07-05", description: "Groceries", amount: "145.30", category: "Groceries", type: "expense", merchant: "Whole Foods Market", account: creditCardAccountId },
    ];
    
    // Combine all transactions
    const allTransactions = [...currentMonthTransactions, ...lastMonthTransactions, ...july2025Transactions];
    
    // Convert to database format
    for (const txn of allTransactions) {
      const isIncome = txn.type === "income";
      const rawAmount = isIncome ? Math.abs(parseFloat(txn.amount)) : -Math.abs(parseFloat(txn.amount));
      
      realisticTransactions.push({
        date: new Date(txn.date),
        description: txn.description,
        rawAmount: rawAmount.toString(),
        amount: Math.abs(parseFloat(txn.amount)).toString(),
        category: txn.category,
        type: txn.type as "income" | "expense",
        merchant: txn.merchant,
        accountId: txn.account,
        userId: userId,
        source: "manual",
        isPending: false,
        paymentChannel: txn.category.includes("Online") || txn.merchant.includes("Netflix") ? "online" : "in store",
        ignoreType: "none",
      });
    }
    
    // Insert all realistic transactions
    await db.insert(transactions).values(realisticTransactions);
    
    console.log(`✅ Successfully seeded ${realisticTransactions.length} realistic transactions`);
    console.log("📊 Data includes:");
    console.log("   • Recent transactions for 7-day spending trends");
    console.log("   • Current month vs last month data for comparisons");
    console.log("   • Various categories for donut chart testing");
    console.log("   • Different merchants for frequent spend analysis");
    console.log("   • Large purchases for largest purchases section");
    console.log("   • Realistic amounts and dates");
    
  } catch (error) {
    console.error("❌ Error seeding realistic transactions:", error);
    throw error;
  }
}

// Export function for use in routes
export { seedRealisticTransactions };

// Run the seeding if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  seedRealisticTransactions().catch(console.error);
}