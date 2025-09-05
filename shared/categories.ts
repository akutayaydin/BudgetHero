export interface CategoryRule {
  category: string;
  keywords: string[];
  patterns?: RegExp[];
  priority?: number; // Higher priority = checked first
}

export interface CategoryTaxonomy {
  primary: string;
  detailed: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PRINCIPAL' | 'DEBT_INTEREST' | 'ADJUSTMENT';
  rules: CategoryRule[];
}

export const CATEGORY_TAXONOMY: CategoryTaxonomy[] = [
  // INCOME
  {
    primary: 'INCOME',
    detailed: 'Salary',
    type: 'INCOME',
    rules: [
      {
        category: 'Salary',
        keywords: ['payroll', 'salary', 'wages', 'direct deposit', 'paycheck', 'employer'],
        priority: 10
      }
    ]
  },
  {
    primary: 'INCOME',
    detailed: 'Tips/Gig',
    type: 'INCOME',
    rules: [
      {
        category: 'Tips/Gig',
        keywords: ['doordash', 'grubhub', 'instacart', 'freelance', 'gig', 'tips', 'upwork', 'fiverr'],
        priority: 9
      }
    ]
  },
  {
    primary: 'INCOME',
    detailed: 'Refund',
    type: 'ADJUSTMENT',
    rules: [
      {
        category: 'Refund',
        keywords: ['refund', 'return', 'credit', 'cashback', 'rebate'],
        priority: 8
      }
    ]
  },

  // EXPENSES
  {
    primary: 'EXPENSE',
    detailed: 'Rent',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Rent',
        keywords: ['rent', 'lease', 'apartment', 'housing', 'property management'],
        priority: 10
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Utilities',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Utilities',
        keywords: ['electric', 'electricity', 'gas', 'water', 'sewer', 'internet', 'cable', 'phone', 'cellular'],
        priority: 9
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Groceries',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Groceries',
        keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'whole foods', 'kroger', 'safeway'],
        priority: 8
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Dining',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Dining',
        keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza', 'food', 'dining', 'kfc', 'subway', 'taco', 'chipotle', 'wendys', 'dunkin'],
        priority: 8
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Transport',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Transport',
        keywords: ['uber', 'lyft', 'rideshare', 'taxi', 'cab', 'uber trip', 'lyft ride', 'gas', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'petro', 'parking', 'toll'],
        priority: 10  // Higher priority than Tips/Gig
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Household > Laundry',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Household > Laundry',
        keywords: ['laundry', 'dry clean', 'cleaners', 'wash'],
        priority: 7
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Insurance',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Insurance',
        keywords: ['insurance', 'premium', 'policy', 'coverage'],
        priority: 8
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Health',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Health',
        keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'vision', 'prescription'],
        priority: 8
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Subscriptions',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Subscriptions',
        keywords: ['netflix', 'spotify', 'subscription', 'monthly', 'annual', 'membership'],
        priority: 7
      }
    ]
  },
  {
    primary: 'EXPENSE',
    detailed: 'Bank Fees',
    type: 'EXPENSE',
    rules: [
      {
        category: 'Bank Fees',
        keywords: ['fee', 'charge', 'overdraft', 'atm', 'maintenance', 'service charge'],
        priority: 9
      }
    ]
  },

  // TRANSFERS
  {
    primary: 'TRANSFER',
    detailed: 'Credit Card Payment',
    type: 'TRANSFER',
    rules: [
      {
        category: 'Credit Card Payment',
        keywords: ['credit card payment', 'cc payment', 'card payment', 'payment to credit', 'payment to chase card'],
        patterns: [/payment.*credit/i, /credit.*payment/i, /payment.*chase.*card/i, /payment.*card.*ending/i],
        priority: 10
      }
    ]
  },
  {
    primary: 'TRANSFER',
    detailed: 'To/From Savings',
    type: 'TRANSFER',
    rules: [
      {
        category: 'To/From Savings',
        keywords: ['transfer', 'savings', 'deposit', 'withdrawal', 'from savings', 'to savings'],
        priority: 8
      }
    ]
  },
  {
    primary: 'TRANSFER',
    detailed: 'P2P Transfer',
    type: 'TRANSFER',
    rules: [
      {
        category: 'P2P Transfer',
        keywords: ['p2p', 'peer to peer', 'zelle', 'venmo', 'cashapp', 'paypal transfer', 'branch messenger', 'messenger p2p'],
        patterns: [/p2p/i, /peer.*to.*peer/i, /zelle/i, /venmo/i],
        priority: 11 // Higher than credit card payment
      }
    ]
  },
  {
    primary: 'TRANSFER',
    detailed: 'Internal Transfer',
    type: 'TRANSFER',
    rules: [
      {
        category: 'Internal Transfer',
        keywords: ['internal transfer', 'account transfer', 'between accounts'],
        priority: 8
      }
    ]
  },
  {
    primary: 'TRANSFER',
    detailed: 'Cash Withdrawal',
    type: 'TRANSFER',
    rules: [
      {
        category: 'Cash Withdrawal',
        keywords: ['atm', 'cash withdrawal', 'cash advance', 'withdrawal'],
        priority: 9
      }
    ]
  },

  // DEBT
  {
    primary: 'DEBT_PRINCIPAL',
    detailed: 'Loan Principal',
    type: 'DEBT_PRINCIPAL',
    rules: [
      {
        category: 'Loan Principal',
        keywords: ['loan payment', 'principal', 'auto loan', 'personal loan', 'student loan'],
        priority: 8
      }
    ]
  },
  {
    primary: 'DEBT_PRINCIPAL',
    detailed: 'Mortgage Principal',
    type: 'DEBT_PRINCIPAL',
    rules: [
      {
        category: 'Mortgage Principal',
        keywords: ['mortgage', 'home loan', 'mortgage payment'],
        priority: 9
      }
    ]
  },
  {
    primary: 'DEBT_INTEREST',
    detailed: 'Loan Interest',
    type: 'DEBT_INTEREST',
    rules: [
      {
        category: 'Loan Interest',
        keywords: ['interest', 'finance charge', 'loan interest'],
        priority: 7
      }
    ]
  },
  {
    primary: 'DEBT_INTEREST',
    detailed: 'Mortgage Interest',
    type: 'DEBT_INTEREST',
    rules: [
      {
        category: 'Mortgage Interest',
        keywords: ['mortgage interest', 'home interest'],
        priority: 8
      }
    ]
  },

  // ADJUSTMENTS
  {
    primary: 'ADJUSTMENT',
    detailed: 'Refund',
    type: 'ADJUSTMENT',
    rules: [
      {
        category: 'Refund',
        keywords: ['refund', 'return', 'reversal', 'credit adjustment'],
        priority: 9
      }
    ]
  },
  {
    primary: 'ADJUSTMENT',
    detailed: 'Chargeback',
    type: 'ADJUSTMENT',
    rules: [
      {
        category: 'Chargeback',
        keywords: ['chargeback', 'dispute', 'provisional credit'],
        priority: 9
      }
    ]
  }
];

export class TransactionCategorizer {
  private rules: CategoryRule[];

  constructor() {
    // Sort rules by priority (highest first)
    this.rules = CATEGORY_TAXONOMY
      .flatMap(taxonomy => taxonomy.rules.map(rule => ({
        ...rule,
        category: taxonomy.detailed,
        type: taxonomy.type
      })))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  categorize(description: string, amount: number, merchant?: string): {
    category: string;
    confidence: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PRINCIPAL' | 'DEBT_INTEREST' | 'ADJUSTMENT';
  } {
    const searchText = `${description} ${merchant || ''}`.toLowerCase();

    // Enhanced merchant-specific matching for new category structure
    const merchantMatchers = {
      // Income categories
      'Paychecks': ['payroll', 'salary', 'wages', 'direct deposit', 'paycheck', 'employer', 'adp', 'workday'],
      'Business Income': ['freelance', 'contractor', 'business', 'invoice', 'consulting', 'upwork', 'fiverr', 'stripe', 'paypal business'],
      'Interest': ['interest', 'dividend', 'savings', 'investment return', 'cd interest', 'bond'],
      'Other Income': ['refund', 'cashback', 'rebate', 'tax refund', 'bonus', 'gift money'],
      
      // Food & Dining
      'Restaurants & Bars': ['restaurant', 'bar', 'bistro', 'grill', 'pub', 'tavern', 'diner', 'mcdonald', 'burger king', 'kfc', 'taco bell', 'subway', 'pizza', 'chipotle', 'wendys'],
      'Coffee Shops': ['starbucks', 'dunkin', 'coffee', 'cafe', 'espresso', 'latte', 'dunkin donuts', 'tim hortons'],
      'Groceries': ['walmart', 'target', 'kroger', 'safeway', 'whole foods', 'costco', 'grocery', 'market', 'trader joe', 'publix', 'wegmans', 'aldi'],
      
      // Auto & Transport
      'Taxi & Ride Shares': ['uber', 'lyft', 'taxi', 'cab', 'rideshare', 'uber trip', 'lyft ride'],
      'Gas': ['shell', 'exxon', 'chevron', 'bp', 'mobil', 'petro', 'gas', 'fuel', 'sunoco', 'marathon', 'phillips 66'],
      'Parking': ['parking', 'meter', 'garage', 'parkwhiz', 'spotangels'],
      'Tolls': ['toll', 'fastrak', 'ezpass'],
      'Public Transit': ['metro', 'bus', 'train', 'transit', 'subway', 'mta', 'bart', 'amtrak'],
      'Auto Payment': ['car payment', 'auto loan', 'vehicle payment', 'honda financial', 'toyota financial'],
      'Auto Maintenance': ['jiffy lube', 'valvoline', 'tire', 'mechanic', 'oil change', 'car wash', 'brake'],
      
      // Shopping
      'Clothing': ['clothing', 'fashion', 'apparel', 'dress', 'shirt', 'nike', 'adidas', 'gap', 'old navy', 'zara', 'h&m'],
      'Electronics': ['best buy', 'apple', 'electronics', 'computer', 'phone', 'amazon echo', 'samsung', 'microsoft'],
      'Furniture & Housewares': ['ikea', 'home depot', 'lowes', 'bed bath beyond', 'wayfair', 'furniture'],
      
      // Bills & Utilities
      'Phone': ['verizon', 'att', 'tmobile', 'sprint', 'phone', 'cellular', 'wireless', 'at&t'],
      'Internet & Cable': ['comcast', 'internet', 'cable', 'wifi', 'broadband', 'xfinity', 'spectrum', 'cox'],
      'Gas & Electric': ['electric', 'electricity', 'gas', 'utility', 'power', 'pge', 'southern california edison'],
      'Water': ['water', 'water dept', 'water department', 'municipal water'],
      'Garbage': ['waste', 'garbage', 'trash', 'recycling', 'sanitation'],
      
      // Health & Wellness
      'Medical': ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'cvs pharmacy', 'walgreens', 'clinic'],
      'Dentist': ['dental', 'dentist', 'orthodontist', 'teeth'],
      'Fitness': ['gym', 'fitness', 'yoga', 'planet fitness', 'la fitness', 'equinox'],
      
      // Financial
      'Cash & ATM': ['atm', 'cash withdrawal', 'cash advance', 'atm fee'],
      'Financial Fees': ['fee', 'charge', 'overdraft', 'maintenance', 'monthly fee', 'service charge'],
      'Financial & Legal Services': ['lawyer', 'attorney', 'legal', 'tax prep', 'h&r block'],
      'Loan Repayment': ['loan payment', 'student loan', 'personal loan', 'navient', 'great lakes'],
      
      // Housing
      'Rent': ['rent', 'rental', 'apartment', 'lease'],
      'Mortgage': ['mortgage', 'home loan', 'wells fargo home', 'quicken loans'],
      'Home Improvement': ['home depot', 'lowes', 'contractor', 'plumber', 'electrician'],
      
      // Travel & Lifestyle
      'Travel & Vacation': ['hotel', 'airbnb', 'flight', 'airline', 'united airlines', 'delta', 'american airlines', 'southwest', 'expedia', 'booking.com'],
      'Entertainment & Recreation': ['movie', 'theater', 'netflix', 'spotify', 'hulu', 'disney plus', 'concert', 'tickets'],
      
      // Personal
      'Pets': ['pet', 'vet', 'veterinary', 'petco', 'petsmart', 'dog', 'cat'],
      'Fun Money': ['entertainment', 'fun', 'hobby', 'games', 'toys'],
      
      // Children
      'Child Care': ['daycare', 'babysitter', 'childcare', 'nanny'],
      'Child Activities': ['sports', 'lesson', 'camp', 'school activity'],
      'Education': ['school', 'tuition', 'books', 'supplies', 'education'],
      'Student Loans': ['student loan', 'navient', 'great lakes', 'fedloan'],
      
      // Gifts & Donations
      'Charity': ['donation', 'charity', 'church', 'nonprofit', 'salvation army', 'goodwill'],
      'Gifts': ['gift', 'present', 'birthday', 'wedding', 'holiday'],
      
      // Business
      'Advertising & Promotion': ['facebook ads', 'google ads', 'marketing', 'advertising'],
      'Office Supplies & Expenses': ['office supplies', 'staples', 'paper', 'printer'],
      'Business Travel & Meals': ['business travel', 'conference', 'business meal'],
      
      // Transfers
      'Credit Card Payment': ['credit card payment', 'cc payment', 'card payment', 'credit card autopay'],
      'Transfer': ['transfer', 'withdrawal', 'deposit', 'internal transfer'],
      'Balance Adjustments': ['adjustment', 'correction', 'error correction'],
      
      // Standalone categories
      'Insurance': ['insurance', 'premium', 'policy', 'coverage', 'geico', 'state farm', 'progressive'],
      'Taxes': ['tax', 'irs', 'tax payment', 'quarterly tax', 'tax prep'],
      'Uncategorized': [], // Default fallback
      'Check': ['check', 'cheque'],
      'Miscellaneous': ['misc', 'other', 'unknown']
    };

    // Check merchant-specific matches first with higher confidence
    for (const [category, keywords] of Object.entries(merchantMatchers)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          // Determine transaction type based on amount and category
          let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' = 'EXPENSE';
          
          if (['Paychecks', 'Business Income', 'Interest', 'Other Income'].includes(category)) {
            transactionType = 'INCOME';
          } else if (['Transfer', 'Credit Card Payment', 'Balance Adjustments'].includes(category)) {
            transactionType = category === 'Balance Adjustments' ? 'ADJUSTMENT' : 'TRANSFER';
          }
          
          return {
            category: category,
            confidence: 0.9, // High confidence for merchant matches
            type: transactionType
          };
        }
      }
    }
    
    // Fallback to legacy rule-based matching if no merchant match found
    // Store all potential matches to pick the best one
    const potentialMatches = [];
    
    for (const rule of this.rules) {
      let matches = 0;
      let totalChecks = 0;

      // Check keywords
      for (const keyword of rule.keywords) {
        totalChecks++;
        if (searchText.includes(keyword.toLowerCase())) {
          matches++;
          // Debug logging for specific merchants
          if (description.toLowerCase().includes('mcdonald')) {
            console.log(`🍔 McDonald's match found: "${keyword}" in "${searchText}" for category "${rule.category}"`);
          }
          if (description.toLowerCase().includes('uber')) {
            console.log(`🚗 Uber match found: "${keyword}" in "${searchText}" for category "${rule.category}" | priority: ${rule.priority}`);
          }
        }
      }

      // Check patterns
      if (rule.patterns) {
        for (const pattern of rule.patterns) {
          totalChecks++;
          if (pattern.test(searchText)) {
            matches++;
          }
        }
      }

      // Calculate confidence - boost confidence for strong keyword matches
      let confidence = totalChecks > 0 ? matches / totalChecks : 0;
      
      // Boost confidence for exact merchant name matches
      if (matches > 0) {
        const hasStrongMatch = rule.keywords.some(keyword => 
          keyword.length > 3 && searchText.includes(keyword.toLowerCase())
        );
        if (hasStrongMatch) {
          confidence = Math.min(confidence * 1.5, 1.0); // Boost but cap at 1.0
        }
      }
      
      if (confidence > 0) {
        const taxonomy = CATEGORY_TAXONOMY.find(t => 
          t.rules.some(r => r.category === rule.category)
        );
        
        potentialMatches.push({
          category: rule.category,
          confidence,
          type: taxonomy?.type || 'EXPENSE',
          priority: rule.priority || 0
        });
      }
    }
    
    // If we have matches, pick the best one based on priority and confidence
    if (potentialMatches.length > 0) {
      // Sort by priority first, then by confidence
      potentialMatches.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return b.confidence - a.confidence; // Higher confidence first
      });
      
      return potentialMatches[0];
    }

    // Default categorization based on amount and context
    if (amount > 0) {
      // For positive amounts, check if it looks like a refund or transfer first
      if (searchText.includes('refund') || searchText.includes('return') || 
          searchText.includes('credit') || searchText.includes('cashback')) {
        return {
          category: 'Balance Adjustments',
          confidence: 0.3,
          type: 'ADJUSTMENT'
        };
      }
      // Large positive amounts are more likely income
      if (amount > 1000) {
        return {
          category: 'Other Income', 
          confidence: 0.1,
          type: 'INCOME'
        };
      }
      // Small positive amounts are likely expenses (merchant names, etc.)
      return {
        category: 'Uncategorized',
        confidence: 0.1,
        type: 'EXPENSE'
      };
    }
    
    // For negative amounts (expenses), default to Uncategorized
    return {
      category: 'Uncategorized',
      confidence: 0.1,
      type: 'EXPENSE'
    };
  }

  getAllCategories(): string[] {
    return CATEGORY_TAXONOMY.map(t => t.detailed);
  }

  getCategoriesByType(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PRINCIPAL' | 'DEBT_INTEREST' | 'ADJUSTMENT'): string[] {
    return CATEGORY_TAXONOMY
      .filter(t => t.type === type)
      .map(t => t.detailed);
  }
}