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
  type LucideIcon,
} from "lucide-react";

/**
 * Returns a Lucide icon for a given category or subcategory name.
 * Performs case-insensitive partial matching.
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase();
  const iconMap: Record<string, LucideIcon> = {
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
    transportation: Car,
    gas: Fuel,
    fuel: Fuel,
    "taxi & ride shares": Car,
    uber: Car,
    lyft: Car,
    "public transportation": Car,
    parking: Car,
    "auto & transport": Car,

    // Entertainment
    entertainment: Film,
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
    travel: Plane,
    vacation: Plane,
    hotels: Home,
    flights: Plane,

    // Housing & Home
    housing: Home,
    rent: Home,
    mortgage: Home,
    "home improvement": Home,
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
    uncategorized: HelpCircle,
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return HelpCircle;
};

export default getCategoryIcon;
