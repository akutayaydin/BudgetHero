// Merchant category mapping for smart auto-categorization
export const MERCHANT_CATEGORIES = {
  // Bills & Utilities
  "PG&E": "Bills & Utilities",
  "Con Edison": "Bills & Utilities", 
  "SDG&E": "Bills & Utilities",
  "LADWP": "Bills & Utilities",
  "National Grid": "Bills & Utilities",
  "Xfinity": "Bills & Utilities",
  "Comcast": "Bills & Utilities",
  "Spectrum": "Bills & Utilities",
  "AT&T Internet": "Bills & Utilities",
  "Verizon Fios": "Bills & Utilities",
  "Google Fiber": "Bills & Utilities",
  "Verizon Wireless": "Bills & Utilities",
  "T-Mobile": "Bills & Utilities",
  "Visible": "Bills & Utilities",
  "Mint Mobile": "Bills & Utilities",
  "Google Fi": "Bills & Utilities",

  // Bills & Insurance
  "GEICO": "Bills & Insurance",
  "Progressive": "Bills & Insurance",
  "State Farm": "Bills & Insurance",
  "Allstate": "Bills & Insurance",
  "USAA": "Bills & Insurance",
  "Farmers Insurance": "Bills & Insurance",
  "Liberty Mutual": "Bills & Insurance",
  "Nationwide": "Bills & Insurance",
  "Travelers": "Bills & Insurance",

  // Bills & Government
  "IRS": "Bills & Government",
  "California FTB": "Bills & Government",
  "DMV": "Bills & Government",

  // Tolls
  "FasTrak": "Tolls",
  "E-ZPass": "Tolls",
  "SunPass": "Tolls",

  // Streaming services (Bills & Utilities)
  "Netflix": "Bills & Utilities",
  "Hulu": "Bills & Utilities",
  "Disney+": "Bills & Utilities",
  "Max": "Bills & Utilities",
  "Apple TV+": "Bills & Utilities",
  "Amazon Prime Video": "Bills & Utilities",
  "Peacock": "Bills & Utilities",
  "Paramount+": "Bills & Utilities",
  "Spotify": "Bills & Utilities",
  "Apple Music": "Bills & Utilities",
  "YouTube Premium": "Bills & Utilities",

  // Software & Tech subscriptions
  "iCloud": "Software & Tech",
  "Google One": "Software & Tech",
  "Microsoft 365": "Software & Tech",
  "Adobe": "Software & Tech",
  "Dropbox": "Software & Tech",
  "GitHub": "Software & Tech",
  "Replit": "Software & Tech",
  "OpenAI": "Software & Tech",

  // Groceries
  "Walmart": "Groceries",
  "Costco": "Groceries",
  "Sam's Club": "Groceries",
  "Kroger": "Groceries",
  "Ralphs": "Groceries",
  "Fred Meyer": "Groceries",
  "Fry's": "Groceries",
  "Safeway": "Groceries",
  "Albertsons": "Groceries",
  "Trader Joe's": "Groceries",
  "Whole Foods": "Groceries",
  "H-E-B": "Groceries",

  // Food & Drink
  "Starbucks": "Food & Drink",
  "McDonald's": "Food & Drink",
  "Chipotle": "Food & Drink",
  "Subway": "Food & Drink",
  "Chick-fil-A": "Food & Drink",
  "Dunkin'": "Food & Drink",
  "Panera": "Food & Drink",
  "Taco Bell": "Food & Drink",
  "Domino's": "Food & Drink",
  "Pizza Hut": "Food & Drink",

  // Auto & Transport
  "Uber": "Auto & Transport",
  "Lyft": "Auto & Transport",
  "BART": "Auto & Transport",
  "MTA": "Auto & Transport",
  "Caltrain": "Auto & Transport",
  "Shell": "Auto & Transport",
  "Chevron": "Auto & Transport",
  "Exxon": "Auto & Transport",
  "BP": "Auto & Transport",
  "ARCO": "Auto & Transport",
  "Valero": "Auto & Transport",
  "Tesla Supercharger": "Auto & Transport",
  "Electrify America": "Auto & Transport",
  "ChargePoint": "Auto & Transport",
  "EVgo": "Auto & Transport",
  "ParkMobile": "Auto & Transport",
  "PayByPhone": "Auto & Transport",

  // Travel & Vacation
  "United Airlines": "Travel & Vacation",
  "American Airlines": "Travel & Vacation",
  "Delta Airlines": "Travel & Vacation",
  "Southwest Airlines": "Travel & Vacation",
  "Alaska Airlines": "Travel & Vacation",
  "Marriott": "Travel & Vacation",
  "Hilton": "Travel & Vacation",
  "Hyatt": "Travel & Vacation",
  "IHG": "Travel & Vacation",
  "Airbnb": "Travel & Vacation",
  "Booking.com": "Travel & Vacation",
  "Expedia": "Travel & Vacation",
  "Priceline": "Travel & Vacation",
  
  // Shopping
  "Amazon": "Shopping",
  "Target": "Shopping",
  "Best Buy": "Shopping",
  "Apple Store": "Shopping",
  "Home Depot": "Shopping",
  "Lowe's": "Shopping",
  "IKEA": "Shopping",
  "eBay": "Shopping",
  "TJ Maxx": "Shopping",
  "Marshalls": "Shopping",
  "Nike": "Shopping",
  "Adidas": "Shopping",

  // Medical & Healthcare
  "CVS": "Medical & Healthcare",
  "Walgreens": "Medical & Healthcare",
  "Rite Aid": "Medical & Healthcare",
  "Kaiser Permanente": "Medical & Healthcare",
  "One Medical": "Medical & Healthcare",

  // Finance & Payments
  "PayPal": "Finance & Payments",
  "Venmo": "Finance & Payments",
  "Cash App": "Finance & Payments",
  "Stripe": "Finance & Payments",
  "Square": "Finance & Payments",
  "Robinhood": "Finance & Payments",
  "Coinbase": "Finance & Payments",

  // Health & Wellness
  "Planet Fitness": "Health & Wellness",
  "24 Hour Fitness": "Health & Wellness",
  "Equinox": "Health & Wellness",
  "ClassPass": "Health & Wellness",
  "Peloton": "Health & Wellness",

  // Education & Learning
  "Udemy": "Education & Learning",
  "Coursera": "Education & Learning",
  "LinkedIn Learning": "Education & Learning",
  "Chegg": "Education & Learning",

  // Hosting/DevOps
  "AWS": "Hosting/DevOps",
  "Azure": "Hosting/DevOps",
  "Google Cloud": "Hosting/DevOps",
  "DigitalOcean": "Hosting/DevOps",
  "Vercel": "Hosting/DevOps",
  "Netlify": "Hosting/DevOps",
  "Heroku": "Hosting/DevOps"
} as const;

// Category keywords for fuzzy matching
export const CATEGORY_KEYWORDS = {
  "Bills & Utilities": [
    "electric", "gas", "water", "sewer", "trash", "internet", "cable", "phone",
    "utility", "power", "energy", "telecom", "wireless", "fiber", "broadband",
    "subscription", "streaming", "media", "tv", "music"
  ],
  "Bills & Insurance": [
    "insurance", "auto insurance", "car insurance", "home insurance",
    "health insurance", "life insurance", "coverage", "premium", "policy"
  ],
  "Bills & Government": [
    "tax", "dmv", "registration", "license", "permit", "government",
    "municipal", "court", "fine", "penalty"
  ],
  "Software & Tech": [
    "software", "saas", "cloud", "storage", "membership", "api", "developer"
  ],
  "Groceries": [
    "grocery", "supermarket", "market", "food", "organic", "fresh", 
    "produce", "deli", "bakery", "meat", "dairy"
  ],
  "Food & Drink": [
    "restaurant", "cafe", "coffee", "food", "dining", "takeout", "delivery",
    "pizza", "burger", "sandwich", "breakfast", "lunch", "dinner"
  ],
  "Auto & Transport": [
    "gas", "fuel", "parking", "toll", "fastrak", "ezpass", "sunpass", "metro", "transit", "taxi", "rideshare",
    "uber", "lyft", "bus", "train", "subway", "charging", "ev"
  ],
  "Travel & Vacation": [
    "hotel", "flight", "airline", "booking", "vacation", "trip", "travel",
    "resort", "accommodation", "rental car", "cruise"
  ],
  "Shopping": [
    "store", "shop", "retail", "department", "electronics", "clothing",
    "home improvement", "furniture", "online", "marketplace"
  ],
  "Medical & Healthcare": [
    "pharmacy", "drug", "medical", "health", "doctor", "clinic", "hospital",
    "prescription", "wellness", "care"
  ],
  "Finance & Payments": [
    "payment", "transfer", "fee", "bank", "credit", "investment", "trading", 
    "financial", "crypto", "brokerage"
  ],
  "Health & Wellness": [
    "gym", "fitness", "workout", "exercise", "health club", "training",
    "sport", "yoga", "pilates"
  ],
  "Education & Learning": [
    "education", "learning", "course", "training", "school", "university", 
    "online learning", "certification", "tutorial"
  ],
  "Hosting/DevOps": [
    "hosting", "cloud", "server", "domain", "ssl", "cdn", "database", 
    "deployment", "infrastructure", "devops"
  ]
} as const;

/**
 * Smart categorization function that uses merchant mapping and keyword matching
 */
export function smartCategorize(description: string, merchant?: string): string {
  if (!description) return "Other";

  // Clean the description
  const cleanDesc = description.toLowerCase().trim();
  
  // First, try exact merchant match
  if (merchant) {
    const exactMatch = MERCHANT_CATEGORIES[merchant as keyof typeof MERCHANT_CATEGORIES];
    if (exactMatch) return exactMatch;
  }

  // Try partial merchant match from description
  for (const [merchantName, category] of Object.entries(MERCHANT_CATEGORIES)) {
    if (cleanDesc.includes(merchantName.toLowerCase())) {
      return category;
    }
  }

  // Keyword-based categorization
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (cleanDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  // Fallback categorization based on common patterns
  if (cleanDesc.includes("payment") || cleanDesc.includes("transfer")) {
    return "Finance & Payments";
  }
  if (cleanDesc.includes("deposit") || cleanDesc.includes("salary") || cleanDesc.includes("payroll")) {
    return "Income";
  }
  if (cleanDesc.includes("atm") || cleanDesc.includes("withdrawal")) {
    return "Finance & Payments";
  }

  return "Other";
}

/**
 * Get category confidence score (0-1) based on matching strength
 */
export function getCategoryConfidence(description: string, merchant?: string, assignedCategory?: string): number {
  if (!description || !assignedCategory) return 0;

  const cleanDesc = description.toLowerCase().trim();
  
  // Exact merchant match = highest confidence
  if (merchant && MERCHANT_CATEGORIES[merchant as keyof typeof MERCHANT_CATEGORIES] === assignedCategory) {
    return 1.0;
  }

  // Partial merchant match = high confidence
  for (const [merchantName, category] of Object.entries(MERCHANT_CATEGORIES)) {
    if (cleanDesc.includes(merchantName.toLowerCase()) && category === assignedCategory) {
      return 0.9;
    }
  }

  // Keyword match = medium confidence
  const keywords = CATEGORY_KEYWORDS[assignedCategory as keyof typeof CATEGORY_KEYWORDS] || [];
  for (const keyword of keywords) {
    if (cleanDesc.includes(keyword.toLowerCase())) {
      return 0.7;
    }
  }

  // Manual assignment = low confidence (needs verification)
  return 0.3;
}