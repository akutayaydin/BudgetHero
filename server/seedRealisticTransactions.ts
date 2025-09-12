import { db } from "./db";
import { transactions, budgets, budgetPlans, accounts, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Comprehensive family of 4 financial data generator
async function seedRealisticTransactions(): Promise<void> {
  console.log("🌱 Seeding comprehensive family of 4 financial data...");
  
  const batchId = new Date().toISOString();
  console.log(`📋 Batch ID: ${batchId}`);
  
  try {
    // Create/update test family user
    const familyUserId = "family4-test-user";
    
    // Clear existing seed data for idempotency
    await db.delete(transactions).where(eq(transactions.source, "seed"));
    await db.delete(budgets).where(eq(budgets.budgetType, "seed"));
    // Fix budget plan cleanup - delete by userId, not month
    await db.delete(budgetPlans).where(eq(budgetPlans.userId, familyUserId));
    const [familyUser] = await db.select().from(users).where(eq(users.id, familyUserId));
    
    if (!familyUser) {
      await db.insert(users).values({
        id: familyUserId,
        email: "family4@test.local",
        firstName: "Sarah",
        lastName: "Johnson",
        username: "family4test",
        password: "test-password", // In real app this would be hashed
        onboardingCompleted: true,
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
      });
    }
    
    // Create family accounts
    const checkingAccountId = "family4-checking";
    const savingsAccountId = "family4-savings";
    const creditCardAccountId = "family4-credit";
    
    const familyAccounts = [
      {
        id: checkingAccountId,
        userId: familyUserId,
        name: "Family Checking",
        type: "depository" as const,
        subtype: "checking",
        currentBalance: "12850.75",
        availableBalance: "12850.75",
        isActive: true,
      },
      {
        id: savingsAccountId,
        userId: familyUserId,
        name: "Emergency Savings",
        type: "depository" as const,
        subtype: "savings",
        currentBalance: "25480.20",
        availableBalance: "25480.20",
        isActive: true,
      },
      {
        id: creditCardAccountId,
        userId: familyUserId,
        name: "Family Credit Card",
        type: "credit" as const,
        subtype: "credit card",
        currentBalance: "-2387.45", // Credit card balance (negative = owe money)
        availableBalance: "7612.55", // Available credit
        creditLimit: "10000.00",
        isActive: true,
      },
    ];
    
    for (const account of familyAccounts) {
      const [existingAccount] = await db.select().from(accounts).where(eq(accounts.id, account.id));
      if (!existingAccount) {
        await db.insert(accounts).values(account);
      }
    }
    // Helper functions for realistic data generation
    const randomBetween = (min: number, max: number, variance = 0.1) => {
      const base = min + Math.random() * (max - min);
      const adjustedVariance = base * variance * (Math.random() - 0.5) * 2;
      return Math.max(min, base + adjustedVariance);
    };
    
    const getBusinessDay = (year: number, month: number, targetDay: number) => {
      const date = new Date(year, month - 1, targetDay);
      const dayOfWeek = date.getDay();
      // If weekend, move to Friday (5) or Monday (1)
      if (dayOfWeek === 0) date.setDate(targetDay - 2); // Sunday -> Friday
      if (dayOfWeek === 6) date.setDate(targetDay - 1); // Saturday -> Friday
      return date;
    };
    
    const getBiWeeklyPaydays = (year: number, month: number) => {
      // Sarah gets paid every other Friday, Mike every other Wednesday
      const sarahPaydays = [];
      const mikePaydays = [];
      
      // Start from first Friday/Wednesday of the month
      for (let week = 1; week <= 4; week += 2) {
        const sarahDate = new Date(year, month - 1, (week - 1) * 7 + 5); // Fridays
        const mikeDate = new Date(year, month - 1, (week - 1) * 7 + 3); // Wednesdays
        
        if (sarahDate.getMonth() === month - 1) sarahPaydays.push(sarahDate);
        if (mikeDate.getMonth() === month - 1) mikePaydays.push(mikeDate);
      }
      
      return { sarahPaydays, mikePaydays };
    };
    
    // Generate 6 months of comprehensive transaction data
    const transactionsBatch = [];
    const currentDate = new Date();
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const targetMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + monthOffset, 1);
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth() + 1;
      const monthTransactions = [];
      
      console.log(`📅 Generating data for ${year}-${month.toString().padStart(2, '0')}...`);
      
      // === INCOME TRANSACTIONS ===
      const { sarahPaydays, mikePaydays } = getBiWeeklyPaydays(year, month);
      
      // Sarah's bi-weekly salary (Senior Marketing Manager)
      sarahPaydays.forEach(payDate => {
        monthTransactions.push({
          date: payDate,
          description: "Direct Deposit - TechCorps Inc",
          rawAmount: randomBetween(3800, 4200).toFixed(2),
          amount: randomBetween(3800, 4200).toFixed(2),
          category: "Paychecks",
          type: "income" as const,
          merchant: "TechCorps Inc",
          accountId: checkingAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: "other",
          ignoreType: "none",
        });
      });
      
      // Mike's bi-weekly salary (Software Engineer)
      mikePaydays.forEach(payDate => {
        monthTransactions.push({
          date: payDate,
          description: "Direct Deposit - DevSolutions LLC",
          rawAmount: randomBetween(4500, 5200).toFixed(2),
          amount: randomBetween(4500, 5200).toFixed(2),
          category: "Paychecks",
          type: "income" as const,
          merchant: "DevSolutions LLC",
          accountId: checkingAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: "other",
          ignoreType: "none",
        });
      });
      
      // Occasional freelance income for Sarah (quarterly)
      if (month % 3 === 1) {
        monthTransactions.push({
          date: new Date(year, month - 1, 15 + Math.floor(Math.random() * 10)),
          description: "Freelance Project Payment - Creative Studios",
          rawAmount: randomBetween(1200, 2500).toFixed(2),
          amount: randomBetween(1200, 2500).toFixed(2),
          category: "Business Income",
          type: "income" as const,
          merchant: "Creative Studios",
          accountId: checkingAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: "online",
          ignoreType: "none",
        });
      }
      
      // === RECURRING BILLS & FIXED EXPENSES ===
      const monthlyBills = [
        { date: 1, desc: "Mortgage Payment", amount: [3450, 3450], category: "Mortgage", merchant: "First National Bank", account: checkingAccountId },
        { date: 1, desc: "Property Tax", amount: [680, 680], category: "Property Tax", merchant: "County Tax Office", account: checkingAccountId },
        { date: 1, desc: "Childcare - Emma & Liam", amount: [2400, 2400], category: "Childcare", merchant: "Little Explorers Academy", account: checkingAccountId },
        { date: 5, desc: "Health Insurance Premium", amount: [850, 850], category: "Medical", merchant: "Blue Cross Blue Shield", account: checkingAccountId },
        { date: 8, desc: "Car Insurance", amount: [245, 265], category: "Insurance", merchant: "State Farm", account: checkingAccountId },
        { date: 10, desc: "Electric & Gas Bill", amount: [180, 320], category: "Gas & Electric", merchant: "Pacific Gas & Electric", account: checkingAccountId },
        { date: 12, desc: "Water & Sewer", amount: [85, 120], category: "Water & Sewer", merchant: "City Water Department", account: checkingAccountId },
        { date: 15, desc: "Internet & Cable", amount: [149, 149], category: "Internet & Cable", merchant: "Xfinity", account: checkingAccountId },
        { date: 18, desc: "Phone Plan", amount: [165, 165], category: "Phone", merchant: "Verizon Wireless", account: creditCardAccountId },
        { date: 20, desc: "Netflix", amount: [18.99, 18.99], category: "Entertainment & Recreation", merchant: "Netflix", account: creditCardAccountId },
        { date: 20, desc: "Spotify Family", amount: [15.99, 15.99], category: "Entertainment & Recreation", merchant: "Spotify", account: creditCardAccountId },
        { date: 22, desc: "Amazon Prime", amount: [14.99, 14.99], category: "Subscriptions", merchant: "Amazon", account: creditCardAccountId },
        { date: 25, desc: "iCloud Storage", amount: [9.99, 9.99], category: "Technology", merchant: "Apple", account: creditCardAccountId },
      ];
      
      monthlyBills.forEach(bill => {
        const billDate = getBusinessDay(year, month, bill.date);
        const amount = randomBetween(bill.amount[0], bill.amount[1], 0.05);
        
        monthTransactions.push({
          date: billDate,
          description: bill.desc,
          rawAmount: (-amount).toFixed(2),
          amount: amount.toFixed(2),
          category: bill.category,
          type: "expense" as const,
          merchant: bill.merchant,
          accountId: bill.account,
          userId: familyUserId,
          source: "seed",
          paymentChannel: bill.merchant.includes("Netflix") || bill.merchant.includes("Amazon") ? "online" : "other",
          ignoreType: "none",
        });
      });
      
      // Credit Card Payment (monthly transfer)
      if (month > startMonth.getMonth() + 1) { // Start from second month
        monthTransactions.push({
          date: new Date(year, month - 1, 28),
          description: "Credit Card Payment",
          rawAmount: (-randomBetween(1800, 2500)).toFixed(2),
          amount: randomBetween(1800, 2500).toFixed(2),
          category: "Transfer",
          type: "expense" as const,
          merchant: "Chase Credit Card",
          accountId: checkingAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: "online",
          ignoreType: "everything", // Exclude from analytics
        });
      }
      
      // === VARIABLE FAMILY SPENDING ===
      
      // Groceries (3-4 times per week - increased frequency)
      const groceryDays = [2, 5, 9, 13, 17, 20, 24, 27, 30];
      groceryDays.slice(0, 4 + Math.floor(Math.random() * 2)).forEach(day => {
        if (day <= 31) {
          const stores = ["Whole Foods Market", "Trader Joe's", "Safeway", "Costco"];
          const store = stores[Math.floor(Math.random() * stores.length)];
          const amount = store === "Costco" ? randomBetween(180, 320) : randomBetween(85, 185);
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: `Grocery Shopping - ${store}`,
            rawAmount: (-amount).toFixed(2),
            amount: amount.toFixed(2),
            category: "Groceries",
            type: "expense" as const,
            merchant: store,
            accountId: Math.random() > 0.7 ? checkingAccountId : creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Restaurants & Family dining (increased frequency)
      const diningDays = [4, 7, 12, 16, 19, 23, 26, 30];
      diningDays.slice(0, 5 + Math.floor(Math.random() * 3)).forEach(day => {
        if (day <= 31) {
          const restaurants = ["Olive Garden", "Chipotle", "Red Robin", "Local Bistro", "Pizza Palace"];
          const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: `Family Dinner - ${restaurant}`,
            rawAmount: (-randomBetween(45, 95)).toFixed(2),
            amount: randomBetween(45, 95).toFixed(2),
            category: "Restaurants & Bars",
            type: "expense" as const,
            merchant: restaurant,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Coffee shops (Sarah's near-daily weekday habit - increased frequency)
      const coffeeDays = [1, 3, 4, 6, 8, 10, 11, 13, 15, 17, 18, 20, 22, 24, 25, 27, 29, 31];
      coffeeDays.slice(0, 12 + Math.floor(Math.random() * 6)).forEach(day => {
        if (day <= 31) {
          const coffeeShops = ["Starbucks", "Peet's Coffee", "Local Coffee Co"];
          const shop = coffeeShops[Math.floor(Math.random() * coffeeShops.length)];
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: `Coffee - ${shop}`,
            rawAmount: (-randomBetween(4.50, 12.95)).toFixed(2),
            amount: randomBetween(4.50, 12.95).toFixed(2),
            category: "Coffee Shops",
            type: "expense" as const,
            merchant: shop,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Gas & Transportation
      const gasDays = [6, 14, 24];
      gasDays.forEach(day => {
        if (day <= 31) {
          const gasStations = ["Shell", "Chevron", "Mobil", "Arco"];
          const station = gasStations[Math.floor(Math.random() * gasStations.length)];
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: `Gas Fill-up - ${station}`,
            rawAmount: (-randomBetween(48, 78)).toFixed(2),
            amount: randomBetween(48, 78).toFixed(2),
            category: "Gas",
            type: "expense" as const,
            merchant: station,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Shopping & Kids Activities
      if (Math.random() > 0.3) { // 70% chance of shopping each month
        const shoppingStores = ["Target", "Nordstrom", "Amazon", "Kids' Clothing Store", "Sports Authority"];
        const store = shoppingStores[Math.floor(Math.random() * shoppingStores.length)];
        const amount = store === "Amazon" ? randomBetween(35, 125) : randomBetween(85, 245);
        
        monthTransactions.push({
          date: new Date(year, month - 1, 8 + Math.floor(Math.random() * 15)),
          description: `Shopping - ${store}`,
          rawAmount: (-amount).toFixed(2),
          amount: amount.toFixed(2),
          category: "Shopping",
          type: "expense" as const,
          merchant: store,
          accountId: creditCardAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: store === "Amazon" ? "online" : "in store",
          ignoreType: "none",
        });
      }
      
      // Kids Activities & Medical
      if (Math.random() > 0.6) { // 40% chance each month
        const activities = [
          { desc: "Kids Soccer Registration", amount: [85, 125], category: "Kids Activities", merchant: "Youth Sports League" },
          { desc: "Piano Lessons", amount: [120, 160], category: "Kids Activities", merchant: "Music Academy" },
          { desc: "Doctor Visit Copay", amount: [35, 50], category: "Medical", merchant: "Family Health Center" },
          { desc: "Dentist Visit", amount: [85, 145], category: "Medical", merchant: "Bright Smiles Dental" },
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const amount = randomBetween(activity.amount[0], activity.amount[1]);
        
        monthTransactions.push({
          date: new Date(year, month - 1, 10 + Math.floor(Math.random() * 15)),
          description: activity.desc,
          rawAmount: (-amount).toFixed(2),
          amount: amount.toFixed(2),
          category: activity.category,
          type: "expense" as const,
          merchant: activity.merchant,
          accountId: checkingAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: "other",
          ignoreType: "none",
        });
      }
      
      // Large purchases (occasionally)
      if (Math.random() > 0.8) { // 20% chance each month
        const largePurchases = [
          { desc: "New Laptop", amount: [1200, 1800], category: "Electronics", merchant: "Best Buy" },
          { desc: "Home Appliance", amount: [650, 1200], category: "Home Improvement", merchant: "Home Depot" },
          { desc: "Family Vacation Booking", amount: [1500, 2800], category: "Travel & Vacation", merchant: "Expedia" },
          { desc: "Car Repair", amount: [450, 850], category: "Auto Maintenance", merchant: "Joe's Auto Shop" },
        ];
        
        const purchase = largePurchases[Math.floor(Math.random() * largePurchases.length)];
        const amount = randomBetween(purchase.amount[0], purchase.amount[1]);
        
        monthTransactions.push({
          date: new Date(year, month - 1, 15 + Math.floor(Math.random() * 10)),
          description: purchase.desc,
          rawAmount: (-amount).toFixed(2),
          amount: amount.toFixed(2),
          category: purchase.category,
          type: "expense" as const,
          merchant: purchase.merchant,
          accountId: creditCardAccountId,
          userId: familyUserId,
          source: "seed",
          paymentChannel: purchase.merchant === "Expedia" ? "online" : "in store",
          ignoreType: "none",
        });
      }
      
      // Additional regular family spending to increase transaction volume
      
      // Pharmacy/Health purchases (weekly)
      const pharmacyDays = [6, 14, 21, 28];
      pharmacyDays.slice(0, 2 + Math.floor(Math.random() * 2)).forEach(day => {
        if (day <= 31) {
          const pharmacies = ["CVS Pharmacy", "Walgreens", "Rite Aid"];
          const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: `Pharmacy - ${pharmacy}`,
            rawAmount: (-randomBetween(15, 85)).toFixed(2),
            amount: randomBetween(15, 85).toFixed(2),
            category: "Medical",
            type: "expense" as const,
            merchant: pharmacy,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // School/Office supplies and small errands
      const errandDays = [8, 15, 22, 29];
      errandDays.slice(0, 2 + Math.floor(Math.random() * 2)).forEach(day => {
        if (day <= 31) {
          const errands = [
            { desc: "School Supplies", category: "Kids Activities", merchant: "Staples", amount: [25, 75] },
            { desc: "Office Supplies", category: "Shopping", merchant: "OfficeMax", amount: [15, 55] },
            { desc: "Hardware Store", category: "Home Improvement", merchant: "Home Depot", amount: [30, 120] },
            { desc: "Pet Supplies", category: "Pets", merchant: "Petco", amount: [40, 95] },
            { desc: "Car Wash", category: "Auto Maintenance", merchant: "QuickWash", amount: [15, 25] },
          ];
          
          const errand = errands[Math.floor(Math.random() * errands.length)];
          const amount = randomBetween(errand.amount[0], errand.amount[1]);
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: errand.desc,
            rawAmount: (-amount).toFixed(2),
            amount: amount.toFixed(2),
            category: errand.category,
            type: "expense" as const,
            merchant: errand.merchant,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Weekend activities and entertainment (weekly)
      const weekendDays = [5, 6, 12, 13, 19, 20, 26, 27];
      weekendDays.slice(0, 4 + Math.floor(Math.random() * 4)).forEach(day => {
        if (day <= 31) {
          const activities = [
            { desc: "Movie Theater", category: "Entertainment & Recreation", merchant: "AMC Theaters", amount: [45, 85] },
            { desc: "Mini Golf", category: "Kids Activities", merchant: "Fun Zone", amount: [35, 65] },
            { desc: "Ice Cream", category: "Restaurants & Bars", merchant: "Baskin Robbins", amount: [15, 35] },
            { desc: "Park Entry Fee", category: "Entertainment & Recreation", merchant: "State Park", amount: [10, 20] },
            { desc: "Arcade Games", category: "Kids Activities", merchant: "Chuck E. Cheese", amount: [25, 55] },
            { desc: "Fast Food", category: "Restaurants & Bars", merchant: "McDonald's", amount: [12, 28] },
          ];
          
          const activity = activities[Math.floor(Math.random() * activities.length)];
          const amount = randomBetween(activity.amount[0], activity.amount[1]);
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: activity.desc,
            rawAmount: (-amount).toFixed(2),
            amount: amount.toFixed(2),
            category: activity.category,
            type: "expense" as const,
            merchant: activity.merchant,
            accountId: creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Small daily purchases (convenience stores, snacks, parking, etc.)
      const dailyDays = [1, 3, 5, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28, 30];
      dailyDays.slice(0, 8 + Math.floor(Math.random() * 6)).forEach(day => {
        if (day <= 31) {
          const dailyPurchases = [
            { desc: "Convenience Store", category: "Shopping", merchant: "7-Eleven", amount: [3, 15] },
            { desc: "Parking Meter", category: "Transportation", merchant: "City Parking", amount: [2, 8] },
            { desc: "Snacks", category: "Groceries", merchant: "Corner Market", amount: [5, 18] },
            { desc: "Energy Drink", category: "Groceries", merchant: "Gas Station", amount: [3, 12] },
            { desc: "ATM Fee", category: "Bank Fees", merchant: "Bank ATM", amount: [3, 5] },
          ];
          
          const purchase = dailyPurchases[Math.floor(Math.random() * dailyPurchases.length)];
          const amount = randomBetween(purchase.amount[0], purchase.amount[1]);
          
          monthTransactions.push({
            date: new Date(year, month - 1, day),
            description: purchase.desc,
            rawAmount: (-amount).toFixed(2),
            amount: amount.toFixed(2),
            category: purchase.category,
            type: "expense" as const,
            merchant: purchase.merchant,
            accountId: Math.random() > 0.5 ? checkingAccountId : creditCardAccountId,
            userId: familyUserId,
            source: "seed",
            paymentChannel: "in store",
            ignoreType: "none",
          });
        }
      });
      
      // Monthly Savings Transfer
      monthTransactions.push({
        date: new Date(year, month - 1, 25),
        description: "Monthly Savings Transfer",
        rawAmount: (-randomBetween(800, 1200)).toFixed(2),
        amount: randomBetween(800, 1200).toFixed(2),
        category: "Transfer",
        type: "expense" as const,
        merchant: "Internal Transfer",
        accountId: checkingAccountId,
        userId: familyUserId,
        source: "seed",
        paymentChannel: "online",
        ignoreType: "budget", // Exclude from budget analytics
      });
      
      // Add month's transactions to batch
      transactionsBatch.push(...monthTransactions);
    }
    
    // Insert all transactions
    const allTransactionData = transactionsBatch.map(txn => ({
      ...txn,
      isPending: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    console.log(`💾 Inserting ${allTransactionData.length} transactions...`);
    await db.insert(transactions).values(allTransactionData);
    
    // === SEED SUPPORTING DATA ===
    
    // Create family budgets
    const familyBudgets = [
      { name: "Groceries", limit: 800, category: "Groceries" },
      { name: "Restaurants & Dining", limit: 400, category: "Restaurants & Bars" },
      { name: "Gas & Transportation", limit: 250, category: "Gas" },
      { name: "Shopping", limit: 300, category: "Shopping" },
      { name: "Kids Activities", limit: 200, category: "Kids Activities" },
      { name: "Medical & Health", limit: 150, category: "Medical" },
      { name: "Entertainment", limit: 100, category: "Entertainment & Recreation" },
    ];
    
    const budgetData = familyBudgets.map(budget => ({
      name: budget.name,
      limit: budget.limit.toString(),
      spent: "0",
      userId: familyUserId,
      category: budget.category,
      budgetType: "seed",
      isPinned: Math.random() > 0.5, // Randomly pin some budgets
      createdAt: new Date(),
    }));
    
    console.log(`💰 Creating ${budgetData.length} budgets...`);
    await db.insert(budgets).values(budgetData);
    
    // Create budget plan for current month
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const budgetPlan = {
      userId: familyUserId,
      month: currentMonth,
      expectedEarnings: "16800.00", // ~$17k/month for family
      expectedBills: "8500.00", // Fixed expenses
      savingsRate: 15,
      savingsReserve: "1000.00",
      spendingBudget: "2500.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("📋 Creating budget plan for current month...");
    await db.insert(budgetPlans).values(budgetPlan);
    
    // Success summary
    console.log("\n✅ Family of 4 financial data seeded successfully!");
    console.log("📊 Summary:");
    console.log(`   • ${allTransactionData.length} transactions over 6 months`);
    console.log(`   • Income: Bi-weekly salaries + occasional freelance`);
    console.log(`   • Fixed expenses: Mortgage, insurance, childcare, utilities`);
    console.log(`   • Variable spending: Groceries, dining, gas, shopping`);
    console.log(`   • Family activities: Kids activities, medical, entertainment`);
    console.log(`   • ${budgetData.length} budgets created for major categories`);
    console.log(`   • Budget plan created for ${currentMonth}`);
    console.log(`   • 3 accounts: Checking, Savings, Credit Card`);
    console.log(`   • Batch ID: ${batchId}`);
    
  } catch (error) {
    console.error("❌ Error seeding family financial data:", error);
    throw error;
  }
}

// Run the seeding if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  seedRealisticTransactions().catch(console.error);
}

// Export function for use in routes
export { seedRealisticTransactions };