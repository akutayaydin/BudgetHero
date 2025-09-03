import { db } from "./db";
import { syncStatus, subscriptions, accounts } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedSampleSyncData(): Promise<void> {
  console.log("Seeding sample sync and subscription data...");
  
  try {
    // Get a user ID from existing accounts
    const existingAccounts = await db.select().from(accounts).limit(1);
    if (existingAccounts.length === 0) {
      console.log("No user accounts found - skipping sync data seeding");
      return;
    }
    
    const userId = existingAccounts[0].userId;
    const institutionId = existingAccounts[0].institutionId || "inst_chase";
    
    // Clear existing sync status for this user
    await db.delete(syncStatus).where(eq(syncStatus.userId, userId));
    
    // Insert sample sync status data
    await db.insert(syncStatus).values([
      {
        userId,
        institutionId,
        status: "success",
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastSuccessAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        retryCount: 0,
        maxRetries: 3,
        newTransactionsCount: 5,
        updatedTransactionsCount: 2,
        duplicatesRemovedCount: 1,
      },
      {
        userId,
        institutionId: "inst_amex",
        status: "reauth_required",
        lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        lastSuccessAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        retryCount: 3,
        maxRetries: 3,
        errorMessage: "Item requires user interaction to continue",
        newTransactionsCount: 0,
        updatedTransactionsCount: 0,
        duplicatesRemovedCount: 0,
      }
    ]);
    
    // Clear existing subscriptions for this user
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    
    // Insert sample subscription data
    await db.insert(subscriptions).values([
      {
        userId,
        name: "Netflix Premium",
        type: "subscription",
        amount: "15.99",
        frequency: "monthly",
        nextDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        isActive: true,
        autoDetected: true,
        merchantName: "Netflix",
      },
      {
        userId,
        name: "Spotify Family",
        type: "subscription",
        amount: "19.99",
        frequency: "monthly",
        nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
        autoDetected: true,
        merchantName: "Spotify",
      },
      {
        userId,
        name: "Electric Bill",
        type: "bill",
        amount: "125.00",
        frequency: "monthly",
        nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        isActive: true,
        autoDetected: false,
        merchantName: "PG&E",
      },
      {
        userId,
        name: "Internet Service",
        type: "bill",
        amount: "89.99",
        frequency: "monthly",
        nextDueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        isActive: true,
        autoDetected: false,
        merchantName: "Comcast",
      },
      {
        userId,
        name: "Planet Fitness",
        type: "subscription",
        amount: "22.99",
        frequency: "monthly",
        nextDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        isActive: true,
        autoDetected: true,
        merchantName: "Planet Fitness",
      }
    ]);
    
    console.log("Successfully seeded sample sync and subscription data");
  } catch (error) {
    console.error("Error seeding sample data:", error);
    throw error;
  }
}

// Auto-seed in development
if (process.env.NODE_ENV === "development") {
  // Wait a bit for APY seeding to complete
  setTimeout(() => {
    seedSampleSyncData().catch(console.error);
  }, 2000);
}