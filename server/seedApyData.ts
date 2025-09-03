import { db } from "./db";
import { apyOffers } from "@shared/schema";
import { eq } from "drizzle-orm";

// APY offers data from the attached JSON file
const apyData = {
  "schema_version": "1.0",
  "last_updated_utc": "2025-08-10T18:03:18Z",
  "notes": "APYs are variable and can change at any time. Verify before using in production. Sources included per item.",
  "calculations_config": {
    "monthly_spend_buffer_multiplier": 2,
    "lookback_weeks_for_spend": 8,
    "default_current_apy_bps": 0
  },
  "apy_offers": [
    {
      "bank": "Marcus by Goldman Sachs",
      "product_name": "Online Savings Account",
      "apy_pct": 3.65,
      "apy_bps": 365,
      "min_deposit": 0,
      "direct_deposit_required": false,
      "monthly_fee": 0,
      "product_url": "https://www.marcus.com/us/en/savings/high-yield-savings",
      "source_url": "https://www.marcus.com/us/en/savings/savings1",
      "as_of_date": "2025-08-10",
      "notes": "Variable APY; maximum balance limits may apply."
    },
    {
      "bank": "Capital One",
      "product_name": "360 Performance Savings",
      "apy_pct": 3.5,
      "apy_bps": 350,
      "min_deposit": 0,
      "direct_deposit_required": false,
      "monthly_fee": 0,
      "product_url": "https://www.capitalone.com/bank/savings-accounts/online-performance-savings-account/",
      "source_url": "https://www.capitalone.com/bank/disclosures/savings-accounts/online-performance-savings-account/",
      "as_of_date": "2025-08-10",
      "notes": "Variable APY; no fees or minimums."
    },
    {
      "bank": "American Express",
      "product_name": "High Yield Savings",
      "apy_pct": 3.5,
      "apy_bps": 350,
      "min_deposit": 0,
      "direct_deposit_required": false,
      "monthly_fee": 0,
      "product_url": "https://www.americanexpress.com/en-us/banking/online-savings/high-yield-savings-account/",
      "source_url": "https://www.americanexpress.com/en-us/banking/online-savings/support/",
      "as_of_date": "2025-08-09",
      "notes": "Variable APY; no minimum balance required to earn APY."
    },
    {
      "bank": "Ally Bank",
      "product_name": "Online Savings Account",
      "apy_pct": 3.5,
      "apy_bps": 350,
      "min_deposit": 0,
      "direct_deposit_required": false,
      "monthly_fee": 0,
      "product_url": "https://www.ally.com/bank/online-savings-account/",
      "source_url": "https://www.marketwatch.com/financial-guides/banking/ally-savings-account-rates/",
      "as_of_date": "2025-08-10",
      "notes": "Rate per MarketWatch guide; verify on Ally before use."
    },
    {
      "bank": "Barclays",
      "product_name": "Online Savings",
      "apy_pct": 3.8,
      "apy_bps": 380,
      "min_deposit": 0,
      "direct_deposit_required": false,
      "monthly_fee": 0,
      "product_url": "https://www.banking.barclaysus.com/online-savings.html",
      "source_url": "https://www.marketwatch.com/financial-guides/banking/barclays-savings-rate/",
      "as_of_date": "2025-08-10",
      "notes": "Rate per MarketWatch guide; verify on Barclays before use."
    }
  ]
};

export async function seedApyOffers(): Promise<void> {
  console.log("Seeding APY offers data...");
  
  try {
    // Clear existing data
    await db.delete(apyOffers);
    
    // Insert new APY offers
    for (const offer of apyData.apy_offers) {
      await db.insert(apyOffers).values({
        bank: offer.bank,
        productName: offer.product_name,
        apyPct: offer.apy_pct.toString(),
        apyBps: offer.apy_bps,
        minDeposit: offer.min_deposit.toString(),
        directDepositRequired: offer.direct_deposit_required,
        monthlyFee: offer.monthly_fee.toString(),
        productUrl: offer.product_url,
        sourceUrl: offer.source_url,
        asOfDate: new Date(offer.as_of_date),
        notes: offer.notes,
        isActive: true,
      });
    }
    
    console.log(`Successfully seeded ${apyData.apy_offers.length} APY offers`);
  } catch (error) {
    console.error("Error seeding APY offers:", error);
    throw error;
  }
}

// Auto-seed on import in development
if (process.env.NODE_ENV === "development") {
  seedApyOffers().catch(console.error);
}