import {
  Utensils,
  ShoppingCart,
  ShoppingBag,
  Car,
  Fuel,
  Film,
  Receipt,
  Stethoscope,
  Plane,
  Home,
  Book,
  Heart,
  Baby,
  Briefcase,
  PiggyBank,
  RotateCcw,
  Landmark,
  CreditCard,
  Coffee,
  Beer,
  Music,
  Shield,
  HelpCircle,
  Hammer,
  Wrench,
  Repeat,
  type LucideIcon,
} from "lucide-react";

/**
 * Returns a Lucide icon for a given category or subcategory name.
 * Performs case-insensitive partial matching.
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase();
  const iconMap: Record<string, LucideIcon> = {
    // Top-level categories
    transportation: Car,
    "food & drink": Utensils,
    "rent & utilities": Home,
    "general merchandise": ShoppingBag,
    "medical & healthcare": Stethoscope,
    "bank fees": Receipt,
    entertainment: Film,
    "home improvement": Hammer,
    "general services": Wrench,
    "government & non-profit": Landmark,
    subscriptions: Repeat,
    travel: Plane,
    transfers: RotateCcw,
    "loan payments": CreditCard,
    uncategorized: HelpCircle,

    // Food & Dining
    "food & dining": Utensils,
    "fast food": Utensils,
    restaurants: Utensils,
    "coffee shops": Coffee,
    "bars & nightlife": Beer,
    dining: Utensils,

    // Groceries & Shopping
    groceries: ShoppingCart,
    grocery: ShoppingCart,
    shopping: ShoppingBag,
    retail: ShoppingBag,
    clothing: ShoppingBag,
    electronics: ShoppingBag,
    "home & garden": Home,

    // Transportation
    gas: Fuel,
    fuel: Fuel,
    "taxi & ride shares": Car,
    uber: Car,
    lyft: Car,
    "public transportation": Car,
    parking: Car,
    "auto & transport": Car,

    // Entertainment
    movies: Film,
    music: Music,
    streaming: Film,
    "subscriptions & entertainment": Film,
    hobbies: Film,
    sports: Film,

    // Bills & Utilities
    "bills & utilities": Receipt,
    utilities: Receipt,
    electricity: Receipt,
    water: Receipt,
    internet: Receipt,
    phone: Receipt,
    "mobile phone": Receipt,
    cable: Receipt,

    // Healthcare
    healthcare: Stethoscope,
    medical: Stethoscope,
    pharmacy: Stethoscope,
    dentist: Stethoscope,
    fitness: Stethoscope,
    gym: Stethoscope,

    // Travel & Vacation
    "travel & vacation": Plane,
    vacation: Plane,
    hotels: Home,
    flights: Plane,

    // Housing & Home
    housing: Home,
    rent: Home,
    mortgage: Home,
    maintenance: Home,

    // Education
    education: Book,
    school: Book,
    books: Book,
    courses: Book,

    // Personal Care
    "personal care": Heart,
    beauty: Heart,
    haircare: Heart,
    spa: Heart,

    // Family & Kids
    "family & kids": Baby,
    childcare: Baby,
    toys: Baby,
    family: Baby,

    // Business & Services
    "business services": Briefcase,
    "professional services": Briefcase,
    legal: Briefcase,
    consulting: Briefcase,

    // Financial & Banking
    financial: PiggyBank,
    banking: PiggyBank,
    fees: Receipt,
    "credit card payment": CreditCard,
    investment: PiggyBank,
    insurance: Shield,

    // Income
    income: PiggyBank,
    salary: Briefcase,
    bonus: PiggyBank,
    freelance: Briefcase,
    interest: PiggyBank,
    paycheck: Briefcase,
    dividend: PiggyBank,
    retirement: PiggyBank,
    "tax refund": RotateCcw,
    unemployment: RotateCcw,
    "other income": PiggyBank,

    // Government & Taxes
    government: Landmark,
    taxes: Landmark,
    tax: Landmark,

    // Other / Default
    transfer: RotateCcw,
    other: HelpCircle,
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return HelpCircle;
};

export const getCategoryColor = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  const colorMap: Record<string, string> = {
    transportation: "text-blue-600",
    "food & drink": "text-orange-600",
    "rent & utilities": "text-purple-600",
    "general merchandise": "text-teal-600",
    "medical & healthcare": "text-red-600",
    "bank fees": "text-yellow-600",
    entertainment: "text-pink-600",
    "home improvement": "text-emerald-600",
    "general services": "text-indigo-600",
    "government & non-profit": "text-lime-600",
    subscriptions: "text-cyan-600",
    travel: "text-violet-600",
    transfers: "text-amber-600",
    "loan payments": "text-fuchsia-600",
    uncategorized: "text-gray-500",
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (name.includes(key)) return color;
  }
  return "text-muted-foreground";
};

export default getCategoryIcon;
