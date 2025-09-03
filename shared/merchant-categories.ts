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
  "FasTrak": "Bills & Government",
  "E-ZPass": "Bills & Government",
  "SunPass": "Bills & Government",

  // Subscriptions
  "Netflix": "Subscriptions",
  "Hulu": "Subscriptions",
  "Disney+": "Subscriptions",
  "Max": "Subscriptions",
  "Apple TV+": "Subscriptions",
  "Amazon Prime Video": "Subscriptions",
  "Peacock": "Subscriptions",
  "Paramount+": "Subscriptions",
  "Spotify": "Subscriptions",
  "Apple Music": "Subscriptions",
  "YouTube Premium": "Subscriptions",
  "iCloud": "Subscriptions",
  "Google One": "Subscriptions",
  "Microsoft 365": "Subscriptions",
  "Adobe": "Subscriptions",
  "Dropbox": "Subscriptions",
  "GitHub": "Subscriptions",
  "Replit": "Subscriptions",
  "OpenAI": "Subscriptions",

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

  // Dining & Coffee
  "Starbucks": "Dining & Coffee",
  "McDonald's": "Dining & Coffee",
  "Chipotle": "Dining & Coffee",
  "Subway": "Dining & Coffee",
  "Chick-fil-A": "Dining & Coffee",
  "Dunkin'": "Dining & Coffee",
  "Panera": "Dining & Coffee",
  "Taco Bell": "Dining & Coffee",
  "Domino's": "Dining & Coffee",
  "Pizza Hut": "Dining & Coffee",

  // Transportation
  "Uber": "Transportation",
  "Lyft": "Transportation",
  "BART": "Transportation",
  "MTA": "Transportation",
  "Caltrain": "Transportation",
  "Shell": "Transportation",
  "Chevron": "Transportation",
  "Exxon": "Transportation",
  "BP": "Transportation",
  "ARCO": "Transportation",
  "Valero": "Transportation",
  "Tesla Supercharger": "Transportation",
  "Electrify America": "Transportation",
  "ChargePoint": "Transportation",
  "EVgo": "Transportation",
  "ParkMobile": "Transportation",
  "PayByPhone": "Transportation",

  // Travel
  "United Airlines": "Travel",
  "American Airlines": "Travel",
  "Delta Airlines": "Travel",
  "Southwest Airlines": "Travel",
  "Alaska Airlines": "Travel",
  "Marriott": "Travel",
  "Hilton": "Travel",
  "Hyatt": "Travel",
  "IHG": "Travel",
  "Airbnb": "Travel",
  "Booking.com": "Travel",
  "Expedia": "Travel",
  "Priceline": "Travel",

  // Shopping & Retail
  "Amazon": "Shopping & Retail",
  "Target": "Shopping & Retail",
  "Best Buy": "Shopping & Retail",
  "Apple Store": "Shopping & Retail",
  "Home Depot": "Shopping & Retail",
  "Lowe's": "Shopping & Retail",
  "IKEA": "Shopping & Retail",
  "eBay": "Shopping & Retail",
  "TJ Maxx": "Shopping & Retail",
  "Marshalls": "Shopping & Retail",
  "Nike": "Shopping & Retail",
  "Adidas": "Shopping & Retail",

  // Pharmacy & Health
  "CVS": "Pharmacy & Health",
  "Walgreens": "Pharmacy & Health",
  "Rite Aid": "Pharmacy & Health",
  "Kaiser Permanente": "Pharmacy & Health",
  "One Medical": "Pharmacy & Health",

  // Finance & Payments
  "PayPal": "Finance & Payments",
  "Venmo": "Finance & Payments",
  "Cash App": "Finance & Payments",
  "Stripe": "Finance & Payments",
  "Square": "Finance & Payments",
  "Robinhood": "Finance & Payments",
  "Coinbase": "Finance & Payments",

  // Fitness
  "Planet Fitness": "Fitness",
  "24 Hour Fitness": "Fitness",
  "Equinox": "Fitness",
  "ClassPass": "Fitness",
  "Peloton": "Fitness",

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
    "utility", "power", "energy", "telecom", "wireless", "fiber", "broadband"
  ],
  "Bills & Insurance": [
    "insurance", "auto insurance", "car insurance", "home insurance", 
    "health insurance", "life insurance", "coverage", "premium", "policy"
  ],
  "Bills & Government": [
    "tax", "dmv", "registration", "license", "permit", "government", 
    "municipal", "court", "fine", "penalty", "toll"
  ],
  "Subscriptions": [
    "subscription", "monthly", "premium", "pro", "plus", "unlimited", 
    "streaming", "software", "saas", "cloud storage", "membership"
  ],
  "Groceries": [
    "grocery", "supermarket", "market", "food", "organic", "fresh", 
    "produce", "deli", "bakery", "meat", "dairy"
  ],
  "Dining & Coffee": [
    "restaurant", "cafe", "coffee", "food", "dining", "takeout", "delivery", 
    "pizza", "burger", "sandwich", "breakfast", "lunch", "dinner"
  ],
  "Transportation": [
    "gas", "fuel", "parking", "toll", "metro", "transit", "taxi", "rideshare", 
    "uber", "lyft", "bus", "train", "subway", "charging", "ev"
  ],
  "Travel": [
    "hotel", "flight", "airline", "booking", "vacation", "trip", "travel", 
    "resort", "accommodation", "rental car", "cruise"
  ],
  "Shopping & Retail": [
    "store", "shop", "retail", "department", "electronics", "clothing", 
    "home improvement", "furniture", "online", "marketplace"
  ],
  "Pharmacy & Health": [
    "pharmacy", "drug", "medical", "health", "doctor", "clinic", "hospital", 
    "prescription", "wellness", "care"
  ],
  "Finance & Payments": [
    "payment", "transfer", "fee", "bank", "credit", "investment", "trading", 
    "financial", "crypto", "brokerage"
  ],
  "Fitness": [
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