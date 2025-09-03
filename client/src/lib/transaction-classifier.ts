import type { LedgerType } from "@shared/schema";

export interface CategoryDefinition {
  id: string;
  name: string;
  ledgerType: LedgerType;
  keywords: string[];
  color: string;
}

// Default system categories with proper ledger classification
export const defaultCategories: CategoryDefinition[] = [
  // INCOME categories
  { id: "salary", name: "Salary", ledgerType: "INCOME", keywords: ["PAYROLL", "SALARY", "WAGE", "DIRECT DEPOSIT"], color: "bg-green-100 text-green-800" },
  { id: "freelance", name: "Freelance", ledgerType: "INCOME", keywords: ["FREELANCE", "CONTRACT", "CONSULTING"], color: "bg-emerald-100 text-emerald-800" },
  { id: "tips", name: "Tips", ledgerType: "INCOME", keywords: ["TIP", "GRATUITY"], color: "bg-lime-100 text-lime-800" },
  { id: "interest", name: "Interest Income", ledgerType: "INCOME", keywords: ["INTEREST", "DIVIDEND"], color: "bg-teal-100 text-teal-800" },

  // EXPENSE categories
  { id: "groceries", name: "Groceries", ledgerType: "EXPENSE", keywords: ["SAFEWAY", "TRADER JOE", "WHOLE FOODS", "COSTCO", "GROCERY"], color: "bg-blue-100 text-blue-800" },
  { id: "dining", name: "Food & Dining", ledgerType: "EXPENSE", keywords: ["RESTAURANT", "STARBUCKS", "MCDONALD", "PIZZA", "CAFE"], color: "bg-orange-100 text-orange-800" },
  { id: "gas", name: "Gas", ledgerType: "EXPENSE", keywords: ["SHELL", "CHEVRON", " 76 ", "ARCO", "EXXON", "GAS STATION"], color: "bg-red-100 text-red-800" },
  { id: "utilities", name: "Utilities", ledgerType: "EXPENSE", keywords: ["PG&E", "ELECTRIC", "WATER", "CONSERVICE"], color: "bg-yellow-100 text-yellow-800" },
  { id: "rent", name: "Rent", ledgerType: "EXPENSE", keywords: ["RENT", "LEASE"], color: "bg-purple-100 text-purple-800" },
  { id: "subscriptions", name: "Subscriptions", ledgerType: "EXPENSE", keywords: ["NETFLIX", "HULU", "SPOTIFY", "SUBSCRIPTION", "HULUPLUS", "HLU*", "DISNEY+", "PRIME VIDEO", "HBO", "APPLE TV", "PARAMOUNT", "PEACOCK", "YOUTUBE PREMIUM", "APPLE MUSIC", "AMAZON MUSIC", "TIDAL", "PANDORA", "ICLOUD", "GOOGLE ONE", "DROPBOX", "ADOBE", "MICROSOFT 365", "OFFICE 365", "CANVA", "ZOOM", "SLACK", "NOTION", "EVERNOTE"], color: "bg-pink-100 text-pink-800" },
  { id: "insurance", name: "Insurance", ledgerType: "EXPENSE", keywords: ["INSURANCE", "GEICO"], color: "bg-indigo-100 text-indigo-800" },
  { id: "shopping", name: "Shopping", ledgerType: "EXPENSE", keywords: ["AMAZON", "TARGET", "WALMART"], color: "bg-cyan-100 text-cyan-800" },

  // TRANSFER categories
  { id: "credit_payment", name: "Credit Card Payment", ledgerType: "TRANSFER", keywords: ["CREDIT CARD", "APPLECARD", "VISA PAYMENT", "MASTERCARD PAYMENT"], color: "bg-slate-100 text-slate-800" },
  { id: "savings_transfer", name: "To Savings", ledgerType: "TRANSFER", keywords: ["SAVINGS", "TRANSFER TO"], color: "bg-gray-100 text-gray-800" },
  { id: "internal_transfer", name: "Internal Transfer", ledgerType: "TRANSFER", keywords: ["TRANSFER", "INTERNAL"], color: "bg-stone-100 text-stone-800" },

  // DEBT categories
  { id: "loan_principal", name: "Loan Principal", ledgerType: "DEBT_PRINCIPAL", keywords: ["LOAN PRINCIPAL", "MORTGAGE PRINCIPAL"], color: "bg-amber-100 text-amber-800" },
  { id: "loan_interest", name: "Loan Interest", ledgerType: "DEBT_INTEREST", keywords: ["LOAN INTEREST", "MORTGAGE INTEREST"], color: "bg-red-200 text-red-900" },

  // ADJUSTMENT categories
  { id: "refund", name: "Refund", ledgerType: "ADJUSTMENT", keywords: ["REFUND", "RETURN", "CREDIT"], color: "bg-emerald-200 text-emerald-900" },
  { id: "chargeback", name: "Chargeback", ledgerType: "ADJUSTMENT", keywords: ["CHARGEBACK", "DISPUTE"], color: "bg-rose-200 text-rose-900" },

  // Fallback
  { id: "other", name: "Other", ledgerType: "EXPENSE", keywords: [], color: "bg-gray-100 text-gray-800" },
];

export function classifyTransaction(description: string, amount: number): CategoryDefinition {
  const upper = description.toUpperCase();
  
  // Check for transfer patterns first (highest priority)
  if (upper.includes("CREDIT CARD") || upper.includes("APPLECARD") || upper.includes("PAYMENT")) {
    return defaultCategories.find(c => c.id === "credit_payment")!;
  }
  
  if (upper.includes("SAVINGS") || upper.includes("TRANSFER TO")) {
    return defaultCategories.find(c => c.id === "savings_transfer")!;
  }
  
  // Check for refunds/adjustments
  if (upper.includes("REFUND") || upper.includes("RETURN") || upper.includes("CREDIT")) {
    return defaultCategories.find(c => c.id === "refund")!;
  }
  
  // Priority matching for subscriptions (exact patterns)
  const subscriptionPatterns = [
    "NETFLIX", "HLU*", "HULUPLUS", "HULU*", "SPOTIFY", "DISNEY+", "DISNEY PLUS",
    "PRIME VIDEO", "HBO", "APPLE TV", "PARAMOUNT", "PEACOCK", "YOUTUBE PREMIUM",
    "APPLE MUSIC", "AMAZON MUSIC", "TIDAL", "PANDORA", "ICLOUD", "GOOGLE ONE",
    "DROPBOX", "ADOBE", "MICROSOFT 365", "OFFICE 365", "CANVA", "ZOOM",
    "SLACK", "NOTION", "EVERNOTE"
  ];
  
  if (subscriptionPatterns.some(pattern => upper.includes(pattern))) {
    return defaultCategories.find(c => c.id === "subscriptions")!;
  }
  
  // Check other categories by keywords with improved matching
  for (const category of defaultCategories) {
    if (category.id === "subscriptions") continue; // Already handled above
    
    if (category.keywords.some(keyword => {
      // Exact match or word boundary match for better accuracy
      return upper.includes(keyword) || upper.includes(` ${keyword} `) || 
             upper.startsWith(`${keyword} `) || upper.endsWith(` ${keyword}`);
    })) {
      return category;
    }
  }
  
  // Fallback classification based on amount sign
  if (amount > 0) {
    // Positive amount is typically income
    return defaultCategories.find(c => c.ledgerType === "INCOME")!;
  } else {
    // Negative amount is typically expense
    return defaultCategories.find(c => c.id === "other")!;
  }
}

export function includeInProfitLoss(ledgerType: LedgerType): boolean {
  return ["INCOME", "EXPENSE", "DEBT_INTEREST"].includes(ledgerType);
}

export function calculateProfitLoss(transactions: any[], categories: CategoryDefinition[]) {
  let totalIncome = 0;
  let totalExpenses = 0;
  
  for (const transaction of transactions) {
    const category = categories.find(c => c.id === transaction.categoryId || c.name === transaction.category);
    if (!category || !includeInProfitLoss(category.ledgerType)) {
      continue;
    }
    
    const amount = Math.abs(parseFloat(transaction.amount));
    
    if (category.ledgerType === "INCOME") {
      totalIncome += amount;
    } else if (category.ledgerType === "EXPENSE" || category.ledgerType === "DEBT_INTEREST") {
      totalExpenses += amount;
    }
  }
  
  return {
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
  };
}

export function getLedgerTypeColor(ledgerType: LedgerType): string {
  const colors = {
    INCOME: "text-green-600",
    EXPENSE: "text-red-600", 
    TRANSFER: "text-blue-600",
    DEBT_PRINCIPAL: "text-amber-600",
    DEBT_INTEREST: "text-orange-600",
    ADJUSTMENT: "text-purple-600",
  };
  return colors[ledgerType] || "text-gray-600";
}

export function getLedgerTypeLabel(ledgerType: LedgerType): string {
  const labels = {
    INCOME: "Income",
    EXPENSE: "Expense",
    TRANSFER: "Transfer", 
    DEBT_PRINCIPAL: "Debt Principal",
    DEBT_INTEREST: "Debt Interest",
    ADJUSTMENT: "Adjustment",
  };
  return labels[ledgerType] || ledgerType;
}