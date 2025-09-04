import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import * as React from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Tooltip, Pie } from 'recharts';

// Generate net worth data based on current net worth and time period
const generateNetWorthData = (currentNetWorth: number, period: '1M' | '3M' | '6M' | '1Y') => {
  const dataPoints = {
    '1M': 4,  // Weekly data points for 1 month
    '3M': 12, // Weekly data points for 3 months
    '6M': 24, // Bi-weekly data points for 6 months
    '1Y': 12  // Monthly data points for 1 year
  };

  const points = dataPoints[period];
  const data = [];
  const now = new Date();
  
  // Calculate the starting value (assume gradual growth)
  const growthRate = period === '1Y' ? 0.08 : period === '6M' ? 0.06 : period === '3M' ? 0.04 : 0.02;
  const startingValue = currentNetWorth / (1 + growthRate);
  
  for (let i = 0; i < points; i++) {
    let date: Date;
    let label: string;
    
    if (period === '1M') {
      date = new Date(now.getTime() - (points - 1 - i) * 7 * 24 * 60 * 60 * 1000); // Weekly
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (period === '3M') {
      date = new Date(now.getTime() - (points - 1 - i) * 7 * 24 * 60 * 60 * 1000); // Weekly
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (period === '6M') {
      date = new Date(now.getTime() - (points - 1 - i) * 14 * 24 * 60 * 60 * 1000); // Bi-weekly
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      date = new Date(now.getFullYear(), now.getMonth() - (points - 1 - i), 1); // Monthly
      label = date.toLocaleDateString('en-US', { month: 'short' });
    }
    
    // Add some realistic variance (±5%) around the growth trend
    const progress = i / (points - 1);
    const baseValue = startingValue + (currentNetWorth - startingValue) * progress;
    const variance = (Math.random() - 0.5) * 0.1 * baseValue; // ±5% variance
    const netWorth = Math.max(0, baseValue + variance);
    
    data.push({
      label,
      netWorth: Math.round(netWorth),
      assets: Math.round(netWorth * 1.2), // Assume 20% more in gross assets
      liabilities: Math.round(netWorth * 0.2) // Assume 20% in liabilities
    });
  }
  
  // Ensure the last point matches current net worth
  if (data.length > 0) {
    data[data.length - 1].netWorth = currentNetWorth;
    data[data.length - 1].assets = Math.round(currentNetWorth * 1.2);
    data[data.length - 1].liabilities = Math.round(currentNetWorth * 0.2);
  }
  
  return data;
};

const spendingData = [
  { category: 'Housing', amount: 2400, color: '#8B5CF6', percentage: 40, emoji: '🏠' },
  { category: 'Food', amount: 800, color: '#06B6D4', percentage: 13, emoji: '🍕' },
  { category: 'Transportation', amount: 600, color: '#10B981', percentage: 10, emoji: '🚗' },
  { category: 'Entertainment', amount: 400, color: '#F59E0B', percentage: 7, emoji: '🎮' },
  { category: 'Shopping', amount: 500, color: '#EF4444', percentage: 8, emoji: '🛍️' },
  { category: 'Other', amount: 1300, color: '#6B7280', percentage: 22, emoji: '💳' }
];

const monthlySpendingTrend = [
  { month: 'Jan', amount: 5800 },
  { month: 'Feb', amount: 6200 },
  { month: 'Mar', amount: 5900 },
  { month: 'Apr', amount: 6100 },
  { month: 'May', amount: 6000 },
  { month: 'Jun', amount: 6000 }
];

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
}

export function DashboardGraphs() {
  const [activeGraph, setActiveGraph] = useState<'networth' | 'spending'>('networth');
  const [netWorthPeriod, setNetWorthPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { data: netWorthSummary } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const currentNetWorth = netWorthSummary?.totalNetWorth || 51000;
  const netWorthChange = 2500;
  
  // Generate dynamic net worth data based on selected period
  const netWorthData = React.useMemo(() => {
    return generateNetWorthData(currentNetWorth, netWorthPeriod);
  }, [currentNetWorth, netWorthPeriod]);
  
  // Calculate real spending data from transactions
  const realSpendingData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return spendingData;
    
    console.log('Processing transactions for spending:', transactions.length);
    
    // Focus on expense transactions only for spending analysis
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    console.log('Expense transactions found:', expenseTransactions.length);
    
    const categorySpending = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      const amount = Math.abs(parseFloat(transaction.amount));
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
    console.log('Total spending by category:', categorySpending, 'Total:', total);
    
    if (total === 0) {
      console.log('No spending data, using mock data');
      return spendingData;
    }
    
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#FF6B6B', '#4ECDC4'];
    
    const result = Object.entries(categorySpending)
      .map(([category, amount], index) => ({
        category,
        amount: Math.round(amount),
        color: colors[index % colors.length],
        percentage: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    
    console.log('Final spending data:', result);
    return result;
  }, [transactions]);

  // Calculate current month vs last month spending
  const monthlySpendingComparison = React.useMemo(() => {
    if (!transactions) return { current: 0, previous: 0, change: 0 };

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const currentMonthSpending = expenseTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const lastMonthSpending = expenseTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const change = currentMonthSpending - lastMonthSpending;
    console.log('Monthly spending comparison:', { current: currentMonthSpending, previous: lastMonthSpending, change });

    return {
      current: Math.round(currentMonthSpending),
      previous: Math.round(lastMonthSpending),
      change: Math.round(change)
    };
  }, [transactions]);
  
  const totalSpending = monthlySpendingComparison.current;
  const spendingChange = monthlySpendingComparison.change;

  // Handle touch events for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeGraph === 'networth') {
      setActiveGraph('spending');
    }
    if (isRightSwipe && activeGraph === 'spending') {
      setActiveGraph('networth');
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeGraph === 'spending') {
        setActiveGraph('networth');
      }
      if (e.key === 'ArrowRight' && activeGraph === 'networth') {
        setActiveGraph('spending');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGraph]);

  const renderNetWorthGraph = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Net Worth Overview
          </CardTitle>
          <Link href="/wealth-management">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              View Net Worth <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${currentNetWorth.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {netWorthChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                netWorthChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {netWorthChange >= 0 ? '+' : ''}${Math.abs(netWorthChange).toLocaleString()} this month
              </span>
            </div>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
              <Button
                key={period}
                variant={netWorthPeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setNetWorthPeriod(period)}
                className={`px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  netWorthPeriod === period
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid={`networth-period-${period.toLowerCase()}`}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any) => [`$${(typeof value === 'number' ? value : parseFloat(value) || 0).toLocaleString()}`, 'Net Worth']}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderSpendingGraph = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Spending Analysis
          </CardTitle>
          <Link href="/spending">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              View Spending <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalSpending.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This month</p>
            <div className="flex items-center gap-2 mt-1">
              {spendingChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${
                spendingChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {spendingChange >= 0 ? '+' : ''}${Math.abs(spendingChange).toLocaleString()} vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Spending Line Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(() => {
              // Generate spending trend data for the last 6 months
              if (!transactions) return [];
              
              const now = new Date();
              const months = [];
              
              for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
                
                const expenseTransactions = transactions.filter(t => {
                  const transactionDate = new Date(t.date);
                  return t.type === 'expense' && transactionDate >= monthStart && transactionDate <= monthEnd;
                });
                
                const spending = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
                months.push({ month: monthName, spending: Math.round(spending) });
              }
              
              return months;
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any) => [`$${(typeof value === 'number' ? value : parseFloat(value) || 0).toLocaleString()}`, 'Spending']}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="spending" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Intuitive Graph Controls */}
      <Card className="p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          {/* Current Graph Title with Icon */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              activeGraph === 'networth' 
                ? 'bg-purple-100 dark:bg-purple-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {activeGraph === 'networth' ? (
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {activeGraph === 'networth' ? 'Net Worth' : 'Spending Analysis'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeGraph === 'networth' 
                  ? 'Your total wealth over time' 
                  : 'Where your money goes each month'
                }
              </p>
            </div>
          </div>

          {/* Simple Toggle Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeGraph === 'networth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveGraph('networth')}
              className={`transition-all duration-200 ${
                activeGraph === 'networth'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20'
              }`}
              data-testid="switch-to-networth"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Net Worth
            </Button>
            <Button
              variant={activeGraph === 'spending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveGraph('spending')}
              className={`transition-all duration-200 ${
                activeGraph === 'spending'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20'
              }`}
              data-testid="switch-to-spending"
            >
              <PieChart className="h-4 w-4 mr-1" />
              Spending
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => setActiveGraph('networth')}
            className={`h-2 w-8 rounded-full transition-all duration-200 ${
              activeGraph === 'networth' 
                ? 'bg-purple-600' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
            data-testid="indicator-networth"
          />
          <button
            onClick={() => setActiveGraph('spending')}
            className={`h-2 w-8 rounded-full transition-all duration-200 ${
              activeGraph === 'spending' 
                ? 'bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
            data-testid="indicator-spending"
          />
        </div>
      </Card>

      {/* Graph Container - Simplified rendering without sliding animation */}
      <div 
        className="relative rounded-lg shadow-sm"
        data-testid="graph-container"
      >
        {/* Simple conditional rendering to avoid animation conflicts */}
        <div className="w-full">
          {activeGraph === 'networth' ? renderNetWorthGraph() : renderSpendingGraph()}
        </div>
      </div>

      {/* Quick Switch Hint */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click the buttons above to switch between charts
        </p>
      </div>
    </div>
  );
}