import { db } from "./db";
import { transactions, budgets, adminCategories } from "@shared/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, format } from "date-fns";

interface FinancialTip {
  id: string;
  type: 'insight' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  amount?: number;
  percentage?: number;
  createdAt: string;
}

interface FinancialTipsResponse {
  dailyInsights: FinancialTip[];
  weeklyTrends: FinancialTip[];
  budgetAlerts: FinancialTip[];
  savingsOpportunities: FinancialTip[];
  lastUpdated: string;
}

export async function generateFinancialTips(userId: string): Promise<FinancialTipsResponse> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const currentWeekStart = startOfWeek(now);
  const currentWeekEnd = endOfWeek(now);
  const lastWeekStart = startOfWeek(subWeeks(now, 1));
  const lastWeekEnd = endOfWeek(subWeeks(now, 1));

  // Get user transactions
  const userTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date));

  // Get user budgets
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));

  // Get categories for reference
  const categories = await db.select().from(adminCategories);

  const dailyInsights = await generateDailyInsights(userTransactions, categories, now);
  const weeklyTrends = await generateWeeklyTrends(userTransactions, categories, currentWeekStart, lastWeekStart);
  const budgetAlerts = await generateBudgetAlerts(userTransactions, userBudgets, categories, currentMonthStart);
  const savingsOpportunities = await generateSavingsOpportunities(userTransactions, categories, currentMonthStart, lastMonthStart);

  return {
    dailyInsights,
    weeklyTrends,
    budgetAlerts,
    savingsOpportunities,
    lastUpdated: now.toISOString(),
  };
}

async function generateDailyInsights(userTransactions: any[], categories: any[], today: Date): Promise<FinancialTip[]> {
  const tips: FinancialTip[] = [];
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Today's transactions
  const todayTransactions = userTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= todayStart && transactionDate <= todayEnd;
  });

  const todaySpending = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  if (todaySpending > 0) {
    tips.push({
      id: `daily-spending-${today.getTime()}`,
      type: 'insight',
      title: "Today's Spending Summary",
      description: `You've spent ${formatAmount(todaySpending)} today across ${todayTransactions.length} transactions.`,
      actionable: false,
      priority: 'low',
      category: 'Daily Summary',
      amount: todaySpending,
      createdAt: new Date().toISOString(),
    });
  }

  // High-value transaction alert
  const expensiveTransactions = todayTransactions.filter(t => parseFloat(t.amount || '0') > 100);
  if (expensiveTransactions.length > 0) {
    const totalExpensive = expensiveTransactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    tips.push({
      id: `daily-expensive-${today.getTime()}`,
      type: 'warning',
      title: "Large Transactions Today",
      description: `You have ${expensiveTransactions.length} transaction(s) over $100 totaling ${formatAmount(totalExpensive)}. Consider if these were planned expenses.`,
      actionable: true,
      priority: 'medium',
      category: 'Spending Alert',
      amount: totalExpensive,
      createdAt: new Date().toISOString(),
    });
  }

  // Frequent merchant pattern
  const merchantCounts = todayTransactions.reduce((acc, t) => {
    const merchant = t.merchant || 'Unknown';
    acc[merchant] = (acc[merchant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const frequentMerchants = Object.entries(merchantCounts).filter(([_, count]) => (count as number) > 1);
  if (frequentMerchants.length > 0) {
    const [topMerchant, count] = frequentMerchants[0];
    tips.push({
      id: `daily-frequent-${today.getTime()}`,
      type: 'insight',
      title: "Frequent Merchant Alert",
      description: `You've made ${count} transactions at ${topMerchant} today. Consider if this pattern aligns with your spending goals.`,
      actionable: true,
      priority: 'low',
      category: 'Spending Pattern',
      createdAt: new Date().toISOString(),
    });
  }

  return tips;
}

async function generateWeeklyTrends(userTransactions: any[], categories: any[], currentWeekStart: Date, lastWeekStart: Date): Promise<FinancialTip[]> {
  const tips: FinancialTip[] = [];
  
  const currentWeekEnd = endOfWeek(currentWeekStart);
  const lastWeekEnd = endOfWeek(lastWeekStart);

  const currentWeekTransactions = userTransactions.filter(t => {
    const date = new Date(t.date);
    return date >= currentWeekStart && date <= currentWeekEnd;
  });

  const lastWeekTransactions = userTransactions.filter(t => {
    const date = new Date(t.date);
    return date >= lastWeekStart && date <= lastWeekEnd;
  });

  const currentWeekSpending = currentWeekTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  const lastWeekSpending = lastWeekTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  if (lastWeekSpending > 0) {
    const percentageChange = ((currentWeekSpending - lastWeekSpending) / lastWeekSpending) * 100;
    
    if (Math.abs(percentageChange) > 10) {
      tips.push({
        id: `weekly-trend-${currentWeekStart.getTime()}`,
        type: percentageChange > 0 ? 'warning' : 'achievement',
        title: `${percentageChange > 0 ? 'Increased' : 'Decreased'} Weekly Spending`,
        description: `Your spending this week is ${Math.abs(percentageChange).toFixed(1)}% ${percentageChange > 0 ? 'higher' : 'lower'} than last week. ${percentageChange > 0 ? 'Consider reviewing your expenses.' : 'Great job staying on track!'}`,
        actionable: percentageChange > 0,
        priority: Math.abs(percentageChange) > 25 ? 'high' : 'medium',
        category: 'Weekly Trends',
        percentage: percentageChange,
        amount: currentWeekSpending,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Category spending analysis
  const categorySpending = currentWeekTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + parseFloat(t.amount || '0');
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  if (topCategory && topCategory[1] > 0) {
    const [categoryName, amount] = topCategory;
    const percentage = (amount / currentWeekSpending) * 100;
    
    tips.push({
      id: `weekly-category-${currentWeekStart.getTime()}`,
      type: 'insight',
      title: "Top Spending Category",
      description: `${categoryName} accounts for ${percentage.toFixed(1)}% of your weekly spending (${formatAmount(amount)}). ${percentage > 40 ? 'Consider if this aligns with your budget priorities.' : 'This looks balanced!'}`,
      actionable: percentage > 40,
      priority: percentage > 50 ? 'high' : 'low',
      category: 'Category Analysis',
      amount: amount as number,
      percentage: percentage,
      createdAt: new Date().toISOString(),
    });
  }

  return tips;
}

async function generateBudgetAlerts(userTransactions: any[], userBudgets: any[], categories: any[], currentMonthStart: Date): Promise<FinancialTip[]> {
  const tips: FinancialTip[] = [];
  const currentMonthEnd = endOfMonth(currentMonthStart);

  for (const budget of userBudgets) {
    const categoryTransactions = userTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart && 
             date <= currentMonthEnd && 
             t.category === budget.category &&
             t.type === 'expense';
    });

    const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const budgetLimit = parseFloat(budget.limit || '0');
    const spentPercentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

    if (spentPercentage >= 90) {
      tips.push({
        id: `budget-alert-${budget.id}`,
        type: 'warning',
        title: `${budget.category} Budget Alert`,
        description: `You've spent ${spentPercentage.toFixed(1)}% of your ${budget.category} budget (${formatAmount(spent)} of ${formatAmount(budgetLimit)}). ${spentPercentage >= 100 ? 'You\'ve exceeded your budget!' : 'You\'re close to your limit.'}`,
        actionable: true,
        priority: spentPercentage >= 100 ? 'high' : 'medium',
        category: 'Budget Alert',
        amount: spent,
        percentage: spentPercentage,
        createdAt: new Date().toISOString(),
      });
    } else if (spentPercentage >= 70) {
      tips.push({
        id: `budget-warning-${budget.id}`,
        type: 'warning',
        title: `${budget.category} Budget Warning`,
        description: `You've used ${spentPercentage.toFixed(1)}% of your ${budget.category} budget. ${formatAmount(budgetLimit - spent)} remaining for this month.`,
        actionable: true,
        priority: 'medium',
        category: 'Budget Tracking',
        amount: budgetLimit - spent,
        percentage: spentPercentage,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return tips;
}

async function generateSavingsOpportunities(userTransactions: any[], categories: any[], currentMonthStart: Date, lastMonthStart: Date): Promise<FinancialTip[]> {
  const tips: FinancialTip[] = [];
  
  const currentMonthEnd = endOfMonth(currentMonthStart);
  const lastMonthEnd = endOfMonth(lastMonthStart);

  // Always include high-yield savings opportunity if user has transactions
  if (userTransactions.length > 0) {
    tips.push({
      id: `savings-apy-${currentMonthStart.getTime()}`,
      type: 'opportunity',
      title: "High-Yield Savings Opportunity",
      description: `Current high-yield savings accounts offer up to 5.15% APY. Compare your current savings rates to maximize your earnings potential.`,
      actionable: true,
      priority: 'medium',
      category: 'Investment & Savings',
      createdAt: new Date().toISOString(),
    });
  }

  // Subscription analysis (lowered threshold for better detection)
  const subscriptionKeywords = ['subscription', 'netflix', 'spotify', 'amazon', 'apple', 'google', 'monthly', 'annual', 'prime', 'disney', 'hulu', 'adobe'];
  const potentialSubscriptions = userTransactions.filter(t => {
    const description = (t.description || '').toLowerCase();
    const merchant = (t.merchant || '').toLowerCase();
    return subscriptionKeywords.some(keyword => 
      description.includes(keyword) || merchant.includes(keyword)
    ) && t.type === 'expense';
  });

  if (potentialSubscriptions.length > 0) {
    const monthlySubscriptionCost = potentialSubscriptions
      .filter(t => {
        const date = new Date(t.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

    // Lower threshold to catch smaller subscription spends
    if (monthlySubscriptionCost > 10) {
      tips.push({
        id: `savings-subscriptions-${currentMonthStart.getTime()}`,
        type: 'opportunity',
        title: "Subscription Review Opportunity",
        description: `You're spending approximately ${formatAmount(monthlySubscriptionCost)} monthly on subscriptions. Review and cancel unused services to save money.`,
        actionable: true,
        priority: 'medium',
        category: 'Subscription Management',
        amount: monthlySubscriptionCost,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Dining and food analysis (broader categories)
  const foodTransactions = userTransactions.filter(t => {
    const category = (t.category || '').toLowerCase();
    const merchant = (t.merchant || '').toLowerCase();
    const description = (t.description || '').toLowerCase();
    return (category.includes('dining') || 
           category.includes('restaurant') || 
           category.includes('food') ||
           merchant.includes('restaurant') ||
           merchant.includes('cafe') ||
           merchant.includes('starbucks') ||
           merchant.includes('mcdonald') ||
           merchant.includes('subway') ||
           merchant.includes('chipotle') ||
           description.includes('restaurant') ||
           description.includes('food')) && t.type === 'expense';
  });

  const currentMonthFood = foodTransactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    })
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

  // Lower threshold for food spending analysis
  if (currentMonthFood > 50) {
    const potentialSavings = currentMonthFood * 0.25; // Assume 25% savings potential
    tips.push({
      id: `savings-food-${currentMonthStart.getTime()}`,
      type: 'opportunity',
      title: "Food Spending Optimization",
      description: `You've spent ${formatAmount(currentMonthFood)} on food and dining this month. Meal planning could potentially save ${formatAmount(potentialSavings)}.`,
      actionable: true,
      priority: 'medium',
      category: 'Lifestyle Savings',
      amount: potentialSavings,
      createdAt: new Date().toISOString(),
    });
  }

  // Bill negotiation opportunities - detect utility/service payments
  const billKeywords = ['electric', 'gas', 'water', 'phone', 'internet', 'cable', 'insurance', 'cell', 'utility'];
  const billTransactions = userTransactions.filter(t => {
    const description = (t.description || '').toLowerCase();
    const merchant = (t.merchant || '').toLowerCase();
    return billKeywords.some(keyword => 
      description.includes(keyword) || merchant.includes(keyword)
    ) && t.type === 'expense';
  });

  if (billTransactions.length > 0) {
    const monthlyBills = billTransactions
      .filter(t => {
        const date = new Date(t.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

    if (monthlyBills > 100) {
      tips.push({
        id: `savings-bills-${currentMonthStart.getTime()}`,
        type: 'opportunity',
        title: "Bill Negotiation Opportunity",
        description: `You have ${formatAmount(monthlyBills)} in monthly bills. Contact providers to negotiate better rates - many offer promotional pricing for existing customers.`,
        actionable: true,
        priority: 'medium',
        category: 'Bill Optimization',
        amount: monthlyBills * 0.15, // Assume 15% potential savings
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Cash flow optimization - if user has positive balance trends
  const currentMonthExpenses = userTransactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart && date <= currentMonthEnd && t.type === 'expense';
    })
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

  const currentMonthIncome = userTransactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart && date <= currentMonthEnd && t.type === 'income';
    })
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

  const netCashFlow = currentMonthIncome - currentMonthExpenses;

  if (netCashFlow > 500) {
    tips.push({
      id: `savings-cashflow-${currentMonthStart.getTime()}`,
      type: 'opportunity',
      title: "Excess Cash Flow Opportunity",
      description: `You have ${formatAmount(netCashFlow)} in positive cash flow this month. Consider automating savings or investing this surplus to build wealth.`,
      actionable: true,
      priority: 'high',
      category: 'Wealth Building',
      amount: netCashFlow,
      createdAt: new Date().toISOString(),
    });
  }

  return tips;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}