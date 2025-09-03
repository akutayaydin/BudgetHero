import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");
  
  // Check if plans already exist
  const existingPlans = await db.select().from(subscriptionPlans);
  
  if (existingPlans.length > 0) {
    console.log(`Found ${existingPlans.length} existing subscription plans. Skipping seed.`);
    return;
  }

  const plans = [
    {
      name: "Free",
      description: "Basic financial tracking with essential features",
      price: "0.00",
      currency: "USD",
      interval: "month",
      trialDays: 0,
      stripePriceId: null,
      features: JSON.stringify([
        "Up to 3 bank accounts",
        "6-month transaction history",
        "Basic categorization",
        "Simple budgets",
        "Monthly reports"
      ]),
      isActive: true,
      sortOrder: 1
    },
    {
      name: "Pro",
      description: "Advanced financial analytics with premium insights",
      price: "9.99",
      currency: "USD", 
      interval: "month",
      trialDays: 14,
      stripePriceId: null, // Will be set when Stripe product is created
      features: JSON.stringify([
        "Unlimited bank accounts",
        "2-year transaction history",
        "Smart AI categorization",
        "Advanced budgets & goals",
        "Real-time insights",
        "Custom reports",
        "Priority support",
        "Bill negotiation tips",
        "Investment tracking"
      ]),
      isActive: true,
      sortOrder: 2
    }
  ];

  try {
    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan);
    }
    console.log("✅ Subscription plans seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}