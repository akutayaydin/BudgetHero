import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  CheckCircle,
  AlertTriangle,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import type { Transaction } from "@/../../shared/schema";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function MobileFriendlyReports() {
  const [timeRange, setTimeRange] = useState("3months");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: categoryData = [] } = useQuery({
    queryKey: ["/api/analytics/categories"],
  });

  const hasData = transactions && transactions.length > 0;

  // Calculate key metrics for the current period
  const currentMetrics = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0),
    transactionCount: transactions.length,
    categoryCount: new Set(transactions.map(t => t.category)).size
  };

  const savingsRate = currentMetrics.totalIncome > 0 ? 
    ((currentMetrics.totalIncome - currentMetrics.totalExpenses) / currentMetrics.totalIncome) * 100 : 0;

  // Generate insights
  const insights = [
    {
      type: savingsRate > 20 ? "positive" : savingsRate > 10 ? "neutral" : "warning",
      title: savingsRate > 20 ? "Excellent Savings Rate" : savingsRate > 10 ? "Good Savings Habit" : "Low Savings Rate",
      description: `You're saving ${savingsRate.toFixed(1)}% of your income${savingsRate > 20 ? ' - well above the recommended 20%!' : savingsRate > 10 ? '. Consider increasing to 20% for optimal financial health.' : '. Try to reach at least 20%.'}`,
      icon: savingsRate > 20 ? CheckCircle : savingsRate > 10 ? Target : AlertTriangle,
      color: savingsRate > 20 ? "text-green-600" : savingsRate > 10 ? "text-blue-600" : "text-orange-600"
    }
  ];

  // Generate trend data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const trendData = last6Months.map(month => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month.getMonth() && 
             transactionDate.getFullYear() === month.getFullYear();
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expenses,
      savings: income - expenses
    };
  });

  // Category breakdown
  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount.toString()));
      return acc;
    }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => (b.amount as number) - (a.amount as number))
    .slice(0, 8);

  if (!hasData) {
    return (
      <div className="p-4 space-y-4">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Data for Reports</h3>
            <p className="text-muted-foreground mb-6">
              Upload transaction data or connect bank accounts to generate financial reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.href = '/upload'}>
                Upload Transactions
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/accounts'}>
                Connect Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your financial data</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/20 border-green-500/20 dark:from-green-400/20 dark:to-green-500/30 dark:border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(currentMetrics.totalIncome)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/20 border-red-500/20 dark:from-red-400/20 dark:to-red-500/30 dark:border-red-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {formatCurrency(currentMetrics.totalExpenses)}
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-500/20 dark:from-blue-400/20 dark:to-blue-500/30 dark:border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Savings Rate</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-500/20 dark:from-purple-400/20 dark:to-purple-500/30 dark:border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Transactions</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {currentMetrics.transactionCount}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <insight.icon className={`h-6 w-6 mt-0.5 ${insight.color}`} />
                <div>
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Income vs Expenses Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="savings" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Category Breakdown</h4>
                  {categoryChartData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="font-medium text-foreground">{item.category}</span>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Charts
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Export your financial data and reports for external analysis or record keeping.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}