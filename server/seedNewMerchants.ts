import { db } from "./db";
import { recurringMerchants, adminCategories } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const newMerchantData = [
  // Medical
  { name: "1st Floor Laboratory", category: "Medical", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "1st Floor Lab,1st Floor Laboratory" },
  { name: "CVS", category: "Medical", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "CVS,CVS Pharmacy" },
  { name: "Walgreens", category: "Medical", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Walgreens,Walgreen" },
  
  // Entertainment & Recreation
  { name: "Adventureland", category: "Entertainment & Recreation", type: "expense", frequency: "seasonal", status: "active", confidence: "medium", aliases: "Adventureland" },
  { name: "Disney", category: "Entertainment & Recreation", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Disney,Disneyland" },
  { name: "Hulu", category: "Entertainment & Recreation", type: "subscription", frequency: "monthly", status: "active", confidence: "high", aliases: "Hulu" },
  { name: "Loop Neighborhood", category: "Entertainment & Recreation", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Loop Neighborhood" },
  { name: "Netflix", category: "Entertainment & Recreation", type: "subscription", frequency: "monthly", status: "active", confidence: "high", aliases: "Netflix" },
  { name: "Prime Video", category: "Entertainment & Recreation", type: "subscription", frequency: "monthly", status: "active", confidence: "high", aliases: "Amazon Prime Video,Prime Video" },
  { name: "Small Change Arcade", category: "Entertainment & Recreation", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Small Change Arcade" },
  
  // Charity
  { name: "San Francisco Zoo", category: "Charity", type: "expense", frequency: "annual", status: "active", confidence: "medium", aliases: "SF Zoo,San Francisco Zoo" },
  { name: "the YMCA", category: "Charity", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "YMCA,the YMCA" },
  
  // Travel & Vacation
  { name: "Air Canada", category: "Travel & Vacation", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Air Canada" },
  { name: "Chase Travel", category: "Travel & Vacation", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Chase Travel" },
  { name: "Wyndham Hotels & Resorts", category: "Travel & Vacation", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Wyndham Hotels,Wyndham Resorts" },
  
  // Shopping
  { name: "Amazon", category: "Shopping", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Amazon,Amazon.com" },
  { name: "Amazon Cefmk Ma Payments Jiyl Z Fo", category: "Shopping", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Amazon,Cefmk Ma Payments" },
  { name: "Elias & Co", category: "Shopping", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Elias & Co" },
  { name: "Marshalls", category: "Shopping", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Marshalls" },
  { name: "Target", category: "Shopping", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Target" },
  { name: "Walmart", category: "Shopping", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Walmart" },
  
  // Clothing
  { name: "Ross Dress for Less", category: "Clothing", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Ross Dress,Ross Dress for Less" },
  { name: "Crocs", category: "Clothing", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Crocs" },
  { name: "Dadson Laundry Mobile", category: "Clothing", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Dadson Laundry" },
  { name: "H&M", category: "Clothing", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "H&M" },
  
  // Coffee Shops
  { name: "World Market", category: "Coffee Shops", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "World Market" },
  { name: "Biscoff Coffee Corner", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Biscoff Coffee,Biscoff Coffee Corner" },
  { name: "Delah Coffee Sanso", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Delah Coffee,Delah Coffee Sanso" },
  { name: "Equator Coffees Fo", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Equator Coffees" },
  { name: "Peet's Coffee", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Peet's Coffee,Peets Coffee" },
  { name: "Philz Coffee", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Philz Coffee" },
  { name: "Starbucks", category: "Coffee Shops", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Starbucks" },
  
  // Credit Card Payment
  { name: "Apple", category: "Credit Card Payment", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "Apple,Apple Inc" },
  { name: "Chase", category: "Credit Card Payment", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "Chase Bank,Chase" },
  { name: "Payment", category: "Credit Card Payment", type: "payment", frequency: "recurring", status: "active", confidence: "medium", aliases: "Payment" },
  
  // Transfer
  { name: "Apple Pay", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Apple Pay" },
  { name: "Apple Savings Transfer Web", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Apple Savings Transfer" },
  { name: "Citi", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Citi,Citibank" },
  { name: "Coinbase", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Coinbase" },
  { name: "Exponent Member", category: "Transfer", type: "transfer", frequency: "monthly", status: "active", confidence: "medium", aliases: "Exponent Member" },
  { name: "Npa Web (Uncategorized)", category: "Transfer", type: "transfer", frequency: "occasional", status: "active", confidence: "medium", aliases: "Npa Web" },
  { name: "Real Time Payment Credit", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "medium", aliases: "Real Time Payment,RTP Credit" },
  { name: "Robinhood", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Robinhood" },
  { name: "Stripe", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Stripe" },
  { name: "Wealthfront", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Wealthfront" },
  { name: "Zelle", category: "Transfer", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "Zelle" },
  
  // Restaurants & Bars
  { name: "Applebee's", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Applebee,Applebee's" },
  { name: "Auntie Anne's", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Auntie Anne,Auntie Anne's" },
  { name: "Bakeries", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Bakery,Bakeries" },
  { name: "Cafe Daisy", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Cafe Daisy" },
  { name: "California Pizza Kitchen", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "California Pizza Kitchen,CPK" },
  { name: "Carl's Jr.", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Carl's Jr,Carls Jr." },
  { name: "Chipotle", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Chipotle,Chipotle Mexican Grill" },
  { name: "Cilantro SF Taqueria", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Cilantro,Cilantro SF" },
  { name: "City Kebabs & Gyros Inc", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "City Kebabs,Gyros Inc" },
  { name: "Denny's", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Denny's" },
  { name: "DoorDash", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "DoorDash" },
  { name: "Earl of Sandwich", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Earl of Sandwich" },
  { name: "Fior D' Italia", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Fior D' Italia,Fior D Italia" },
  { name: "Flour & Water Pizze", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Flour & Water,Flour & Water Pizza" },
  { name: "Ghirardelli", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Ghirardelli,Ghirardelli Chocolate" },
  { name: "Hayes Valley", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Hayes Valley" },
  { name: "Hole In The Wall", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Hole In The Wall" },
  { name: "Ice Cream Cart", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Ice Cream Cart" },
  { name: "IHOP", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "IHOP" },
  { name: "In-N-Out Burger", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "In-N-Out,In-N-Out Burger" },
  { name: "It'sugar Jefferson", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "It'sugar,Itsugar Jefferson" },
  { name: "Joe's Ice Cream", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Joe's Ice Cream,Joes Ice Cream" },
  { name: "Lush Gelato", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Lush Gelato" },
  { name: "Mediterranean Pizza", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Mediterranean Pizza" },
  { name: "Mod Pizza", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Mod Pizza" },
  { name: "Norman's Ice Cream &", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Norman's Ice Cream,Normans Ice Cream" },
  { name: "Pieology Pizzeria", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Pieology Pizzeria" },
  { name: "Pizza Local Venice", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Pizza Local Venice" },
  { name: "Players Sports Grill", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Players Sports Grill" },
  { name: "Stella Pastry", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Stella Pastry" },
  { name: "Subway", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Subway" },
  { name: "The Cheesecake Factory", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Cheesecake Factory,The Cheesecake Factory" },
  { name: "The Waffle Cone", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Waffle Cone,The Waffle Cone" },
  { name: "TOGO'S Sandwiches", category: "Restaurants & Bars", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "TOGO'S,Togos Sandwiches" },
  { name: "TST* SUPER DUPER - METREO", category: "Restaurants & Bars", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "TST SUPER DUPER,TST Super Duper Metreo" },
  
  // Auto Payment
  { name: "BMW", category: "Auto Payment", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "BMW" },
  { name: "Toyota", category: "Auto Payment", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "Toyota" },
  
  // Insurance
  { name: "Toyota Auto Insurance", category: "Insurance", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "Toyota Auto Insurance" },
  { name: "Geico", category: "Insurance", type: "payment", frequency: "recurring", status: "active", confidence: "high", aliases: "Geico" },
  { name: "Toggle Insurance", category: "Insurance", type: "payment", frequency: "recurring", status: "active", confidence: "medium", aliases: "Toggle Insurance" },
  
  // Auto Maintenance
  { name: "California DMV", category: "Auto Maintenance", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "DMV,California DMV" },
  { name: "Conservice", category: "Auto Maintenance", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Conservice" },
  { name: "Jiffy Lube", category: "Auto Maintenance", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Jiffy Lube" },
  { name: "O'Reilly Auto Parts", category: "Auto Maintenance", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "O'Reilly,O'Reilly Auto Parts" },
  { name: "Spot Free Car Wash", category: "Auto Maintenance", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Spot Free Car Wash" },
  
  // Gifts
  { name: "Bank of Nova Scotia", category: "Gifts", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Bank of Nova Scotia" },
  
  // Parking & Tolls
  { name: "Beverly Hills Ca", category: "Parking & Tolls", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Beverly Hills Parking" },
  { name: "City of Burlingame", category: "Parking & Tolls", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "City of Burlingame Parking" },
  { name: "FasTrak", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "FasTrak" },
  { name: "LADOT Parking", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "LADOT Parking" },
  { name: "LAZ Parking", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "LAZ Parking" },
  { name: "Metropolitan Transportation Authority", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "MTA,Metropolitan Transportation Authority" },
  { name: "Mta Meter", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "MTA Meter" },
  { name: "Park SFO", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Park SFO" },
  { name: "Parksmart Lettuce", category: "Parking & Tolls", type: "expense", frequency: "occasional", status: "active", confidence: "low", aliases: "Parksmart Lettuce" },
  { name: "Presidio Trust Parking", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Presidio Trust Parking" },
  { name: "Reef Parking", category: "Parking & Tolls", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Reef Parking" },
  
  // Cash & ATM
  { name: "ATM Withdrawal", category: "Cash & ATM", type: "withdrawal", frequency: "occasional", status: "active", confidence: "high", aliases: "ATM Withdrawal" },
  { name: "Withdrawal", category: "Cash & ATM", type: "withdrawal", frequency: "occasional", status: "active", confidence: "medium", aliases: "Cash Withdrawal" },
  
  // Other Income
  { name: "ATM Check Deposit", category: "Other Income", type: "deposit", frequency: "occasional", status: "active", confidence: "high", aliases: "ATM Deposit,ATM Check Deposit" },
  { name: "Branch", category: "Other Income", type: "deposit", frequency: "occasional", status: "active", confidence: "medium", aliases: "Branch Deposit" },
  { name: "California Franchise Tax Board", category: "Other Income", type: "payment", frequency: "annual", status: "active", confidence: "high", aliases: "California FTB,Franchise Tax Board" },
  { name: "Cash Deposit", category: "Other Income", type: "deposit", frequency: "occasional", status: "active", confidence: "medium", aliases: "Cash Deposit" },
  { name: "Cash Redemption", category: "Other Income", type: "deposit", frequency: "occasional", status: "active", confidence: "medium", aliases: "Cash Redemption" },
  { name: "Deposit #688248", category: "Other Income", type: "deposit", frequency: "occasional", status: "active", confidence: "medium", aliases: "Deposit 688248" },
  { name: "Internal Revenue Service", category: "Other Income", type: "payment", frequency: "annual", status: "active", confidence: "high", aliases: "IRS,Internal Revenue Service" },
  { name: "Online Deposit", category: "Other Income", type: "deposit", frequency: "recurring", status: "active", confidence: "medium", aliases: "Online Deposit" },
  { name: "PayPal", category: "Other Income", type: "transfer", frequency: "recurring", status: "active", confidence: "high", aliases: "PayPal" },
  
  // Gas & Electric
  { name: "Columbia", category: "Gas & Electric", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Columbia Energy,Columbia Utility" },
  { name: "Pacific Gas & Electric", category: "Gas & Electric", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "PG&E,Pacific Gas & Electric" },
  
  // Internet & Cable
  { name: "Comcast", category: "Internet & Cable", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Comcast" },
  { name: "Xfinity", category: "Internet & Cable", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Xfinity" },
  
  // Phone
  { name: "T-Mobile", category: "Phone", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "T-Mobile" },
  
  // Groceries
  { name: "Costco", category: "Groceries", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Costco" },
  { name: "Istanbul Market", category: "Groceries", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "Istanbul Market" },
  { name: "Safeway", category: "Groceries", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Safeway" },
  { name: "Trader Joe's", category: "Groceries", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Trader Joe's" },
  
  // Furniture & Housewares
  { name: "Ikea", category: "Furniture & Housewares", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Ikea" },
  { name: "Mattress Firm", category: "Furniture & Housewares", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Mattress Firm" },
  
  // Postage & Shipping
  { name: "PostalAnnex", category: "Postage & Shipping", type: "expense", frequency: "recurring", status: "active", confidence: "medium", aliases: "PostalAnnex" },
  { name: "UPS", category: "Postage & Shipping", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "UPS" },
  
  // Education
  { name: "Project Institute", category: "Education", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Project Institute" },
  
  // Taxi & Ride Shares
  { name: "Lyft", category: "Taxi & Ride Shares", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Lyft" },
  { name: "Uber", category: "Taxi & Ride Shares", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Uber" },
  
  // Home Improvement
  { name: "The Home Depot", category: "Home Improvement", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Home Depot,The Home Depot" },
  
  // Office Supplies & Expenses
  { name: "Vistaprint", category: "Office Supplies & Expenses", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Vistaprint" },
  
  // Rent
  { name: "Npa Web (Office Rent)", category: "Rent", type: "payment", frequency: "monthly", status: "active", confidence: "high", aliases: "Npa Web Rent" },
  
  // Financial & Legal Services
  { name: "Van Der Hout", category: "Financial & Legal Services", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Van Der Hout" },
  
  // Financial Fees
  { name: "Wire Fee", category: "Financial Fees", type: "expense", frequency: "recurring", status: "active", confidence: "high", aliases: "Wire Fee" },
  
  // Miscellaneous
  { name: "OpenAI", category: "Miscellaneous", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "OpenAI" },
  { name: "Seekingalpha.com", category: "Miscellaneous", type: "expense", frequency: "occasional", status: "active", confidence: "medium", aliases: "Seeking Alpha,Seekingalpha.com" }
];

export async function bulkImportMerchants(merchantsData: any[]) {
  console.log("🌱 Bulk importing merchants...");
  
  try {
    // Get all existing admin categories for mapping
    const existingCategories = await db.select().from(adminCategories);
    const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));
    
    // Get existing merchants to avoid duplicates - use both merchantName and normalizedName
    const existingMerchants = await db.select().from(recurringMerchants);
    const existingMerchantNames = new Set([
      ...existingMerchants.map(m => m.merchantName.toLowerCase()),
      ...existingMerchants.map(m => m.normalizedName.toLowerCase())
    ]);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const merchantData of merchantsData) {
      if (!merchantData.name?.trim()) {
        console.log(`Skipping merchant with missing name`);
        skippedCount++;
        continue;
      }

      const merchantName = merchantData.name.toLowerCase();
      const normalizedMerchantName = merchantData.name.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (existingMerchantNames.has(merchantName) || existingMerchantNames.has(normalizedMerchantName)) {
        console.log(`Merchant already exists, skipping: ${merchantData.name}`);
        skippedCount++;
        continue;
      }
      
      // Find matching category ID - if not found, skip this merchant
      const categoryId = categoryMap.get(merchantData.category);
      if (!categoryId) {
        console.warn(`Category not found: ${merchantData.category} for merchant: ${merchantData.name}`);
        skippedCount++;
        continue;
      }
      
      // Generate Clearbit logo URL
      const logoUrl = `https://logo.clearbit.com/${merchantData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      
      try {
        await db.insert(recurringMerchants).values({
          merchantName: merchantData.name,
          normalizedName: normalizedMerchantName,
          category: merchantData.category,
          transactionType: (merchantData.type || 'subscription') as 'utility' | 'subscription' | 'credit_card' | 'large_recurring' | 'excluded',
          frequency: merchantData.frequency || 'monthly',
          logoUrl: logoUrl,
          isActive: merchantData.status === 'active',
          autoDetected: false,
          confidence: (merchantData.confidence || 'medium') as 'high' | 'medium' | 'low',
          notes: `Bulk imported merchant`,
          patterns: merchantData.name,
          excludeFromBills: false,
          notificationDays: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Add to existing names set to prevent duplicates within this batch
        existingMerchantNames.add(merchantName);
        existingMerchantNames.add(normalizedMerchantName);
        addedCount++;
        
      } catch (error: any) {
        console.error(`Failed to add merchant ${merchantData.name}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`✅ Bulk import completed: ${addedCount} added, ${skippedCount} skipped`);
    return { added: addedCount, skipped: skippedCount };
    
  } catch (error) {
    console.error("❌ Error bulk importing merchants:", error);
    throw error;
  }
}

export async function seedNewMerchants() {
  console.log("🌱 Seeding new merchants...");
  
  try {
    // Get all existing admin categories for mapping
    const existingCategories = await db.select().from(adminCategories);
    const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));
    
    // Get existing merchants to avoid duplicates - use both merchantName and normalizedName
    const existingMerchants = await db.select().from(recurringMerchants);
    const existingMerchantNames = new Set([
      ...existingMerchants.map(m => m.merchantName.toLowerCase()),
      ...existingMerchants.map(m => m.normalizedName.toLowerCase())
    ]);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const merchantData of newMerchantData) {
      const merchantName = merchantData.name.toLowerCase();
      
      // Check if merchant already exists (check both name and normalized version)
      const normalizedMerchantName = merchantData.name.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (existingMerchantNames.has(merchantName) || existingMerchantNames.has(normalizedMerchantName)) {
        console.log(`Merchant already exists, skipping: ${merchantData.name}`);
        skippedCount++;
        continue;
      }
      
      // Find matching category ID
      const categoryId = categoryMap.get(merchantData.category);
      if (!categoryId) {
        console.warn(`Category not found: ${merchantData.category} for merchant: ${merchantData.name}`);
        continue;
      }
      
      // Generate Clearbit logo URL
      const logoUrl = `https://logo.clearbit.com/${merchantData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      
      try {
        await db.insert(recurringMerchants).values({
          merchantName: merchantData.name,
          normalizedName: merchantData.name.toLowerCase().trim().replace(/\s+/g, ' '),
          category: merchantData.category,
          transactionType: merchantData.type as 'utility' | 'subscription' | 'credit_card' | 'large_recurring' | 'excluded',
          frequency: merchantData.frequency,
          logoUrl: logoUrl,
          isActive: merchantData.status === 'active',
          autoDetected: false,
          confidence: merchantData.confidence as 'high' | 'medium' | 'low',
          notes: `Auto-generated from merchant data import`,
          patterns: merchantData.aliases,
          excludeFromBills: false,
          notificationDays: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        addedCount++;
        
      } catch (error: any) {
        console.error(`Failed to add merchant ${merchantData.name}:`, error.message);
      }
    }
    
    console.log(`✅ Merchant seeding completed: ${addedCount} added, ${skippedCount} skipped (already exist)`);
    return { added: addedCount, skipped: skippedCount };
    
  } catch (error) {
    console.error("❌ Error seeding merchants:", error);
    throw error;
  }
}