import { db } from "./db";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import { 
  transactions, 
  adminCategories, 
  userMerchantOverrides, 
  transactionCategorizationMeta,
  type Transaction,
  type AdminCategory,
  type UserMerchantOverride
} from "@shared/schema";
import { MERCHANT_CATEGORIES } from "@shared/merchant-categories";

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,      // User override or exact merchant match
  MEDIUM: 0.6,    // Partial merchant match or strong keyword match
  LOW: 0.3,       // Weak keyword match
  REVIEW: 0.70    // Below this threshold needs review
} as const;

// Enhanced categorization result
interface CategorizationResult {
  adminCategoryId: string;
  adminCategoryName: string;
  subcategoryName?: string;
  confidence: number;
  source: 'user_override' | 'merchant_match' | 'keyword_match' | 'fallback';
  userMerchantOverrideId?: string;
}

// Get admin categories (cached for performance)
let adminCategoriesCache: AdminCategory[] | null = null;
async function getAdminCategories(): Promise<AdminCategory[]> {
  if (!adminCategoriesCache) {
    adminCategoriesCache = await db
      .select()
      .from(adminCategories)
      .where(eq(adminCategories.isActive, true))
      .orderBy(adminCategories.sortOrder);
  }
  return adminCategoriesCache;
}

// Get user merchant overrides for a specific user
async function getUserMerchantOverrides(userId: string): Promise<UserMerchantOverride[]> {
  return await db
    .select()
    .from(userMerchantOverrides)
    .where(eq(userMerchantOverrides.userId, userId));
}

// Find admin category by name (case-insensitive)
async function findAdminCategoryByName(categoryName: string): Promise<AdminCategory | null> {
  const categories = await getAdminCategories();
  return categories.find(cat => 
    cat.name.toLowerCase() === categoryName.toLowerCase()
  ) || null;
}

// Enhanced transaction categorization
export async function categorizeTransaction(
  transaction: Pick<Transaction, 'id' | 'description' | 'merchant' | 'userId'>,
  userId?: string
): Promise<CategorizationResult> {
  
  const merchant = transaction.merchant || transaction.description;
  const description = transaction.description.toLowerCase();
  
  // 1. Check for user merchant override (highest priority)
  if (userId) {
    const userOverrides = await getUserMerchantOverrides(userId);
    const override = userOverrides.find(override => 
      merchant.toLowerCase().includes(override.merchantName.toLowerCase()) ||
      override.merchantName.toLowerCase().includes(merchant.toLowerCase())
    );
    
    if (override) {
      const adminCategory = await db
        .select()
        .from(adminCategories)
        .where(eq(adminCategories.id, override.adminCategoryId))
        .limit(1);
      
      if (adminCategory[0]) {
        return {
          adminCategoryId: adminCategory[0].id,
          adminCategoryName: adminCategory[0].name,
          subcategoryName: override.subcategoryName || undefined,
          confidence: 1.0,
          source: 'user_override',
          userMerchantOverrideId: override.id
        };
      }
    }
  }
  
  // 2. Check merchant categories for exact match
  const transactionMerchant = merchant.toLowerCase();
  const merchantEntry = Object.entries(MERCHANT_CATEGORIES).find(([merchantPattern, category]: [string, string]) => {
    const pattern = merchantPattern.toLowerCase();
    
    // Exact match or contains match
    return transactionMerchant.includes(pattern) || 
           pattern.includes(transactionMerchant);
  });
  
  if (merchantEntry) {
    const adminCategory = await findAdminCategoryByName(merchantEntry[1]);
    if (adminCategory) {
      return {
        adminCategoryId: adminCategory.id,
        adminCategoryName: adminCategory.name,
        confidence: 0.9,
        source: 'merchant_match'
      };
    }
  }
  
  // 3. Keyword-based categorization
  const keywordCategories = {
    'Bills & Utilities': [
      'electric', 'electricity', 'gas', 'water', 'sewer', 'trash', 'garbage',
      'internet', 'cable', 'phone', 'utility', 'utilities', 'comcast', 'verizon',
      'at&t', 'spectrum', 'xfinity'
    ],
    'Subscriptions': [
      'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'apple music',
      'subscription', 'monthly', 'premium', 'plus', 'pro'
    ],
    'Transportation': [
      'uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'parking', 'toll',
      'dmv', 'registration'
    ],
    'Gas & Fuel': [
      'shell', 'exxon', 'bp', 'chevron', 'mobil', 'gas', 'fuel', 'petrol',
      'gasoline'
    ],
    'Groceries': [
      'safeway', 'kroger', 'walmart', 'target', 'whole foods', 'trader joe',
      'costco', 'grocery', 'market', 'food', 'supermarket'
    ],
    'Dining & Coffee': [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin', 'mcdonald',
      'burger', 'pizza', 'dining', 'eatery', 'bistro'
    ],
    'Insurance': [
      'insurance', 'allstate', 'geico', 'progressive', 'state farm',
      'auto insurance', 'health insurance'
    ],
    'Bank Fees': [
      'fee', 'overdraft', 'maintenance', 'service charge', 'atm fee'
    ],
    'Refunds & Compensation': [
      'refund', 'return', 'compensation', 'reimbursement', 'credit', 'chargeback', 'reversal', 'cashback'
    ]
  };
  
  for (const [categoryName, keywords] of Object.entries(keywordCategories)) {
    const matchedKeywords = keywords.filter(keyword => 
      description.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      const adminCategory = await findAdminCategoryByName(categoryName);
      if (adminCategory) {
        const confidence = Math.min(0.8, 0.4 + (matchedKeywords.length * 0.1));
        return {
          adminCategoryId: adminCategory.id,
          adminCategoryName: adminCategory.name,
          confidence,
          source: 'keyword_match'
        };
      }
    }
  }
  
  // 4. Fallback to "Other" category
  const otherCategory = await findAdminCategoryByName('Other');
  if (otherCategory) {
    return {
      adminCategoryId: otherCategory.id,
      adminCategoryName: otherCategory.name,
      confidence: 0.1,
      source: 'fallback'
    };
  }
  
  throw new Error('No fallback category found. Please ensure "Other" admin category exists.');
}

// Bulk categorize transactions for a user
export async function bulkCategorizeUserTransactions(userId: string) {
  const userTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));
  
  let categorizedCount = 0;
  let needsReviewCount = 0;
  
  for (const transaction of userTransactions) {
    try {
      const result = await categorizeTransaction(transaction, userId);
      const needsReview = result.confidence < CONFIDENCE_THRESHOLDS.REVIEW;
      
      // Update transaction category
      await db
        .update(transactions)
        .set({ 
          category: result.subcategoryName 
            ? `${result.adminCategoryName} > ${result.subcategoryName}`
            : result.adminCategoryName
        })
        .where(eq(transactions.id, transaction.id));
      
      // Create or update categorization metadata
      await db
        .insert(transactionCategorizationMeta)
        .values({
          transactionId: transaction.id,
          adminCategoryId: result.adminCategoryId,
          userMerchantOverrideId: result.userMerchantOverrideId,
          confidence: result.confidence.toString(),
          categorizedBy: 'system',
          needsReview
        })
.onConflictDoNothing();
      
      categorizedCount++;
      if (needsReview) needsReviewCount++;
      
    } catch (error) {
      console.error(`Failed to categorize transaction ${transaction.id}:`, error);
    }
  }
  
  return {
    success: true,
    categorized: categorizedCount,
    total: userTransactions.length,
    needsReview: needsReviewCount,
    message: `Categorized ${categorizedCount} transactions. ${needsReviewCount} need review.`
  };
}

// Get transactions that need review for a user
export async function getTransactionsNeedingReview(userId: string) {
  const reviewTransactions = await db
    .select({
      transaction: transactions,
      meta: transactionCategorizationMeta,
      adminCategory: adminCategories
    })
    .from(transactions)
    .leftJoin(transactionCategorizationMeta, eq(transactions.id, transactionCategorizationMeta.transactionId))
    .leftJoin(adminCategories, eq(transactionCategorizationMeta.adminCategoryId, adminCategories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.category, 'Other') // Only include transactions categorized as 'Other'
      )
    )
    .orderBy(desc(transactions.date));
  
  // Enhance results with suggested categories for transactions that need review
  const enhancedResults = await Promise.all(
    reviewTransactions.map(async (item) => {
      const suggestedCategories = await generateCategorySuggestions(item.transaction.description, item.transaction.merchant || '');
      
      return {
        transaction: item.transaction,
        suggestedCategories,
        meta: item.meta || {
          confidence: 0,
          needsReview: true,
          source: 'uncategorized'
        },
        adminCategory: item.adminCategory || null
      };
    })
  );
  
  return enhancedResults;
}

// Generate AI-powered category suggestions for a transaction
async function generateCategorySuggestions(description: string, merchant?: string) {
  const adminCats = await getAdminCategories();
  const suggestions = [];
  
  // Generate smart suggestions based on transaction description
  const desc = description.toLowerCase();
  const merchantLower = (merchant || '').toLowerCase();
  
  // Transportation patterns
  if (desc.includes('uber') || desc.includes('lyft') || merchantLower.includes('uber') || merchantLower.includes('lyft')) {
    suggestions.push({
      adminCategoryId: adminCats.find(c => c.name === 'Transportation')?.id || '',
      adminCategoryName: 'Transportation',
      confidence: 0.95,
      reasoning: 'Rideshare service detected'
    });
  }
  
  // Suggest categories with confidence scores
  if (desc.includes('airline') || desc.includes('flight') || desc.includes('united airlines')) {
    // Check if it's a positive amount (deposit/refund) vs negative (expense)
    const isPositive = description.includes('+') || description.includes('deposit') || description.includes('refund');
    if (isPositive) {
      suggestions.push({
        adminCategoryId: adminCats.find(c => c.name === 'Refunds & Compensation')?.id || '',
        adminCategoryName: 'Refunds & Compensation',
        confidence: 0.95,
        reasoning: 'Airline deposit/refund detected'
      });
    } else {
      suggestions.push({
        adminCategoryId: adminCats.find(c => c.name === 'Transportation')?.id || '',
        adminCategoryName: 'Transportation',
        confidence: 0.9,
        reasoning: 'Airline transaction detected'
      });
    }
  }
  
  if (desc.includes('sparkfun') || desc.includes('electronics') || desc.includes('tech')) {
    suggestions.push({
      adminCategoryId: adminCats.find(c => c.name === 'Shopping')?.id || '',
      adminCategoryName: 'Shopping',
      confidence: 0.8,
      reasoning: 'Electronics/tech purchase'
    });
  }
  
  if (desc.includes('interest') || desc.includes('payment') || desc.includes('pymnt')) {
    suggestions.push({
      adminCategoryId: adminCats.find(c => c.name === 'Interest & Finance')?.id || '',
      adminCategoryName: 'Interest & Finance',
      confidence: 0.85,
      reasoning: 'Financial transaction detected'
    });
  }
  
  if (desc.includes('refund') || desc.includes('return') || desc.includes('compensation') || desc.includes('reimbursement')) {
    suggestions.push({
      adminCategoryId: adminCats.find(c => c.name === 'Refunds & Compensation')?.id || '',
      adminCategoryName: 'Refunds & Compensation',
      confidence: 0.9,
      reasoning: 'Refund or compensation transaction'
    });
  }
  
  // Add fallback suggestions if no specific matches
  if (suggestions.length === 0) {
    suggestions.push(
      {
        adminCategoryId: adminCats.find(c => c.name === 'Shopping')?.id || '',
        adminCategoryName: 'Shopping',
        confidence: 0.5,
        reasoning: 'General purchase'
      },
      {
        adminCategoryId: adminCats.find(c => c.name === 'Dining & Coffee')?.id || '',
        adminCategoryName: 'Dining & Coffee',
        confidence: 0.3,
        reasoning: 'Possible dining expense'
      }
    );
  }
  
  return suggestions.filter(s => s.adminCategoryId); // Remove any with empty IDs
}

// Create user merchant override
export async function createUserMerchantOverride(
  userId: string,
  merchantName: string,
  parentCategoryId: string,
  subcategoryName?: string
): Promise<UserMerchantOverride> {
  // Validate that the category ID exists and is not null
  if (!parentCategoryId || parentCategoryId.trim() === '') {
    throw new Error('Admin category ID cannot be null or empty');
  }
  
  const [override] = await db
    .insert(userMerchantOverrides)
    .values({
      userId,
      merchantName,
      adminCategoryId: parentCategoryId,
      confidence: "1.0",
      subcategoryName
    })
    .returning();
  
  return override;
}

// Apply user category fix (creates override and updates transaction)
export async function applyUserCategoryFix(
  userId: string,
  transactionId: string,
  adminCategoryId: string,
  subcategoryName?: string
) {
  // Get the transaction
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  // Create merchant override
  const merchantName = transaction.merchant || transaction.description;
  const override = await createUserMerchantOverride(
    userId,
    merchantName,
    adminCategoryId,
    subcategoryName
  );
  
  // Get admin category name
  const [adminCategory] = await db
    .select()
    .from(adminCategories)
    .where(eq(adminCategories.id, adminCategoryId))
    .limit(1);
  
  if (!adminCategory) {
    throw new Error('Admin category not found');
  }
  
  // Update transaction
  const categoryDisplay = subcategoryName 
    ? `${adminCategory.name} > ${subcategoryName}`
    : adminCategory.name;
  
  await db
    .update(transactions)
    .set({ category: categoryDisplay })
    .where(eq(transactions.id, transactionId));
  
  // Update categorization metadata
  await db
    .insert(transactionCategorizationMeta)
    .values({
      transactionId,
      adminCategoryId,
      userMerchantOverrideId: override.id,
      confidence: "1.00",
      categorizedBy: 'user',
      needsReview: false,
      reviewedAt: new Date()
    })
.onConflictDoNothing();
  
  return {
    success: true,
    transaction,
    override,
    categoryDisplay
  };
}