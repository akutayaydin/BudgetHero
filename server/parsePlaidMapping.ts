// Parse the provided Plaid mapping data and create structured mappings

// Raw mapping data from user's file - parsing the tab-separated format
const rawMappingData = `Ledger 
BudgetHero Category 
Plaid Primary 
Plaid Detailed 
Income 
Income 
INCOME 
INCOME_WAGES 
Income 
Income 
INCOME 
INCOME_INTEREST_EARNED 
Income 
Income 
INCOME 
INCOME_DIVIDENDS 
Income 
Income 
INCOME 
INCOME_RETIREMENT_PENSION 
Income 
Income 
INCOME 
INCOME_TAX_REFUND 
Income 
Income 
INCOME 
INCOME_UNEMPLOYMENT 
Income 
Income 
INCOME 
INCOME_OTHER_INCOME 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_GAS 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_PUBLIC_TRANSIT 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_PARKING 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_TOLLS 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_TAXIS_AND_RIDE_SHARES 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_BIKES_AND_SCOOTERS 
Expenses 
Auto & Transport 
TRANSPORTATION 
TRANSPORTATION_OTHER_TRANSPORTATION 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_GROCERIES 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_RESTAURANT 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_COFFEE 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_FAST_FOOD 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR 
Expenses 
Food & Drink 
FOOD_AND_DRINK 
FOOD_AND_DRINK_VENDING_MACHINES 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_RENT 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_GAS_AND_ELECTRICITY 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_INTERNET_AND_CABLE 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_TELEPHONE 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_WATER 
Expenses 
Bills & Utilities 
RENT_AND_UTILITIES 
RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT 
Expenses 
Shopping  
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES 
Expenses 
Shopping 
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_ELECTRONICS 
Expenses 
Shopping  
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_FURNITURE_AND_HOUSEWARES 
Expenses 
Shopping 
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_DEPARTMENT_STORES 
Expenses 
Shopping  
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_ONLINE_MARKETPLACES 
Expenses 
Shopping  
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_SUPERSTORES 
Expenses 
Shopping  
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_CONVENIENCE_STORES 
Expenses 
Shopping 
GENERAL_MERCHANDISE 
GENERAL_MERCHANDISE_DISCOUNT_STORES 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_PRIMARY_CARE 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_DENTAL_CARE 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_PHARMACIES_AND_SUPPLEMENTS 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_EYE_CARE 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_NURSING_CARE 
Expenses 
Pets 
MEDICAL 
MEDICAL_VETERINARY_SERVICES 
Expenses 
Medical & Healthcare 
MEDICAL 
MEDICAL_OTHER_MEDICAL 
Expenses 
Health & Wellness 
PERSONAL_CARE 
PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS 
Expenses 
Bank Fees 
BANK_FEES 
ATM_FEES 
Expenses 
Bank Fees 
BANK_FEES 
OVERDRAFT_FEES 
Expenses 
Bank Fees 
BANK_FEES 
FOREIGN_TRANSACTION_FEES 
Expenses 
Bank Fees 
BANK_FEES 
SERVICE_FEES 
Expenses 
Bank Fees 
BANK_FEES 
INTEREST_CHARGES 
Expenses 
Bank Fees 
BANK_FEES 
OTHER_FEES 
Expenses 
Entertainment 
ENTERTAINMENT 
CASINOS_AND_GAMBLING 
Expenses 
Entertainment 
ENTERTAINMENT 
MUSIC_AND_AUDIO 
Expenses 
Entertainment 
ENTERTAINMENT 
TV_AND_MOVIES 
Expenses 
Entertainment 
ENTERTAINMENT 
VIDEO_GAMES 
Expenses 
Entertainment 
ENTERTAINMENT 
STREAMING_SERVICES 
Expenses 
Entertainment 
ENTERTAINMENT 
OTHER_ENTERTAINMENT 
Expenses 
Home & Garden 
HOME_IMPROVEMENT 
HARDWARE_STORES 
Expenses 
Home & Garden 
HOME_IMPROVEMENT 
HOME_REPAIRS 
Expenses 
Home & Garden 
HOME_IMPROVEMENT 
SECURITY_SERVICES 
Expenses 
Home & Garden 
HOME_IMPROVEMENT 
FURNITURE_AND_DECOR 
Expenses 
Home & Garden 
HOME_IMPROVEMENT 
LANDSCAPING 
Expenses 
Legal 
GENERAL_SERVICES 
FINANCIAL_AND_LEGAL_SERVICES 
Expenses 
Bills & Utilities 
GENERAL_SERVICES 
INSURANCE 
Expenses 
Education 
GENERAL_SERVICES 
EDUCATION 
Expenses 
Family Care  
GENERAL_SERVICES 
CHILDCARE 
Expenses 
Auto & Transport 
GENERAL_SERVICES 
AUTOMOTIVE_SERVICES 
Expenses 
General Services  
GENERAL_SERVICES 
PROFESSIONAL_SERVICES 
Expenses 
General Services 
GENERAL_SERVICES 
OTHER_SERVICES 
Expenses 
Taxes  
GOVERNMENT_AND_NON_PROFIT 
TAXES 
Expenses 
Donations  
GOVERNMENT_AND_NON_PROFIT 
DONATIONS 
Expenses 
Government & Non-Profit 
GOVERNMENT_AND_NON_PROFIT 
GOVERNMENT_FEES 
Expenses 
Government & Non-Profit 
GOVERNMENT_AND_NON_PROFIT 
OTHER_NON_PROFIT 
Expenses 
Bills & Utilities 
SUBSCRIPTIONS 
SUBSCRIPTIONS_STREAMING 
Expenses 
Software & Tech 
SUBSCRIPTIONS 
SUBSCRIPTIONS_SOFTWARE 
Expenses 
Bills & Utilities 
SUBSCRIPTIONS 
SUBSCRIPTIONS_MEDIA 
Expenses 
Bills & Utilities 
SUBSCRIPTIONS 
SUBSCRIPTIONS_OTHER 
Expenses 
Travel & Vacation 
TRAVEL 
TRAVEL_AIRFARE 
Expenses 
Travel & Vacation  
TRAVEL 
TRAVEL_HOTEL 
Expenses 
Travel & Vacation 
TRAVEL 
TRAVEL_CAR_RENTAL 
Expenses 
Travel & Vacation  
TRAVEL 
TRAVEL_OTHER 
Income 
Transfers 
TRANSFER_IN 
TRANSFER_IN_DIRECT_DEPOSIT 
Income 
Transfers 
TRANSFER_IN 
TRANSFER_IN_OTHER 
Expenses 
Transfers 
TRANSFER_OUT 
TRANSFER_OUT_TO_BANK 
Expenses 
Transfers 
TRANSFER_OUT 
TRANSFER_OUT_OTHER 
Expenses 
Loan Payments 
LOAN_PAYMENTS 
LOAN_PAYMENT_MORTGAGE 
Expenses  
Loan Payments 
LOAN_PAYMENTS 
LOAN_PAYMENT_STUDENT 
Expenses  
Loan Payments 
LOAN_PAYMENTS 
LOAN_PAYMENT_PERSONAL 
Expenses  
Credit Card Payment 
LOAN_PAYMENTS 
LOAN_PAYMENT_CREDIT_CARD 
Expenses 
Loan Payments 
LOAN_PAYMENTS 
LOAN_PAYMENT_AUTO 
Expenses  
Loan Payments 
LOAN_PAYMENTS 
LOAN_PAYMENT_OTHER`;

// Function to convert category name to slug
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '');
}

// Function to parse the raw mapping data
function parseMappingData() {
  const lines = rawMappingData.trim().split('\n');
  const mappings: Array<{
    ledger: string;
    budgetHeroCategory: string;
    plaidPrimary: string;
    plaidDetailed: string;
    ledgerType: "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_CREDIT" | "ADJUSTMENT";
    slug: string;
  }> = [];

  // Skip the header (first 4 lines)
  for (let i = 4; i < lines.length; i += 4) {
    if (i + 3 < lines.length) {
      const ledger = lines[i].trim();
      const budgetHeroCategory = lines[i + 1].trim();
      const plaidPrimary = lines[i + 2].trim();
      const plaidDetailed = lines[i + 3].trim();

      // Skip empty entries
      if (!ledger || !budgetHeroCategory || !plaidPrimary || !plaidDetailed) {
        continue;
      }

      // Convert ledger to ledgerType
      let ledgerType: "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_CREDIT" | "ADJUSTMENT" = "EXPENSE";
      if (ledger === "Income") {
        ledgerType = "INCOME";
      } else if (budgetHeroCategory === "Transfers" || budgetHeroCategory === "Credit Card Payment" || budgetHeroCategory === "Loan Payments") {
        ledgerType = "TRANSFER";
      }

      // Fix inconsistencies in category names
      let correctedCategory = budgetHeroCategory;
      
      // Fix specific mappings that don't match our standard categories
      if (plaidDetailed === "FOOD_AND_DRINK_GROCERIES") {
        correctedCategory = "Groceries"; // Should map to Groceries, not Food & Drink
      }

      // Clean up trailing spaces and inconsistencies
      correctedCategory = correctedCategory.trim();
      if (correctedCategory === "Family Care ") correctedCategory = "Family Care";
      if (correctedCategory === "Shopping ") correctedCategory = "Shopping";
      if (correctedCategory === "General Services ") correctedCategory = "General Services";
      if (correctedCategory === "Travel & Vacation ") correctedCategory = "Travel & Vacation";

      mappings.push({
        ledger,
        budgetHeroCategory: correctedCategory,
        plaidPrimary,
        plaidDetailed,
        ledgerType,
        slug: nameToSlug(correctedCategory)
      });
    }
  }

  return mappings;
}

// Get the complete mapping structure
export const PLAID_CATEGORY_MAPPINGS = parseMappingData();

// Get unique categories for seeding admin categories
export const UNIQUE_CATEGORIES = Array.from(
  new Map(
    PLAID_CATEGORY_MAPPINGS.map(mapping => [
      mapping.slug,
      {
        name: mapping.budgetHeroCategory,
        slug: mapping.slug,
        ledgerType: mapping.ledgerType,
      }
    ])
  ).values()
);

// Export for debugging/validation
export function validateMappings() {
  console.log(`📊 Parsed ${PLAID_CATEGORY_MAPPINGS.length} Plaid category mappings`);
  console.log(`📋 Found ${UNIQUE_CATEGORIES.length} unique categories`);
  
  const categoryBreakdown = UNIQUE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.ledgerType] = (acc[cat.ledgerType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("📈 Category breakdown:");
  Object.entries(categoryBreakdown).forEach(([type, count]) => {
    console.log(`   • ${type}: ${count}`);
  });

  console.log("\n📝 Sample mappings:");
  PLAID_CATEGORY_MAPPINGS.slice(0, 5).forEach(mapping => {
    console.log(`   ${mapping.plaidDetailed} → ${mapping.budgetHeroCategory} (${mapping.slug})`);
  });

  return {
    totalMappings: PLAID_CATEGORY_MAPPINGS.length,
    uniqueCategories: UNIQUE_CATEGORIES.length,
    breakdown: categoryBreakdown
  };
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateMappings();
}