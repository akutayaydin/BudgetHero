import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  CreditCard,
  Building2
} from "lucide-react";

interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  categories: { name: string; amount: number; count: number }[];
}

interface CategoryReport {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averagePerTransaction: number;
  monthlyAverage: number;
  percentOfTotal: number;
}

export default function FinancialReports() {
  const [selectedReportType, setSelectedReportType] = useState("monthly");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["/api/budgets"],
  });

  // Generate Monthly Report
  const generateMonthlyReport = (): MonthlyReport[] => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];

    const monthlyData: { [key: string]: { income: number; expenses: number; categories: { [key: string]: { amount: number; count: number } } } } = {};

    transactions.forEach((tx: any) => {
      const month = new Date(tx.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, categories: {} };
      }

      const amount = Math.abs(parseFloat(tx.amount));
      if (tx.type === 'income') {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expenses += amount;
        
        // Track category spending
        if (!monthlyData[month].categories[tx.category]) {
          monthlyData[month].categories[tx.category] = { amount: 0, count: 0 };
        }
        monthlyData[month].categories[tx.category].amount += amount;
        monthlyData[month].categories[tx.category].count += 1;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses,
        categories: Object.entries(data.categories)
          .map(([name, info]) => ({ name, amount: info.amount, count: info.count }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);
  };

  // Generate Category Report
  const generateCategoryReport = (): CategoryReport[] => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];

    const categoryData: { [key: string]: { total: number; count: number } } = {};
    let totalExpenses = 0;

    transactions.forEach((tx: any) => {
      if (tx.type === 'expense') {
        const amount = Math.abs(parseFloat(tx.amount));
        totalExpenses += amount;
        
        if (!categoryData[tx.category]) {
          categoryData[tx.category] = { total: 0, count: 0 };
        }
        categoryData[tx.category].total += amount;
        categoryData[tx.category].count += 1;
      }
    });

    const monthsOfData = new Set(transactions.map((tx: any) => new Date(tx.date).toISOString().slice(0, 7))).size || 1;

    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        totalSpent: data.total,
        transactionCount: data.count,
        averagePerTransaction: data.total / data.count,
        monthlyAverage: data.total / monthsOfData,
        percentOfTotal: (data.total / totalExpenses) * 100
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  };

  // Generate Budget Performance Report
  const generateBudgetReport = () => {
    if (!Array.isArray(budgets) || budgets.length === 0) return [];

    return budgets.map((budget: any) => {
      const spent = parseFloat(budget.spent) || 0;
      const limit = parseFloat(budget.limit) || 0;
      const remaining = limit - spent;
      const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        ...budget,
        spent,
        limit,
        remaining,
        percentUsed,
        status: percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good'
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    return new Date(monthStr + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const monthlyReport = generateMonthlyReport();
  const categoryReport = generateCategoryReport();
  const budgetReport = generateBudgetReport();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-slate-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Financial Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transaction Data</h3>
            <p className="text-gray-500">Upload transactions or connect your bank account to generate reports.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financial Reports
            </CardTitle>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={selectedReportType} onValueChange={setSelectedReportType}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="budgets">Budget Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4">
            {monthlyReport.map((report) => (
              <Card key={report.month}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatMonth(report.month)}
                    </div>
                    <Badge variant={report.netFlow >= 0 ? "default" : "destructive"}>
                      Net: {formatCurrency(report.netFlow)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-300 font-medium">Income</p>
                        <p className="text-xl font-bold text-green-900 dark:text-green-100">{formatCurrency(report.income)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-300 font-medium">Expenses</p>
                        <p className="text-xl font-bold text-red-900 dark:text-red-100">{formatCurrency(report.expenses)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Cash Flow</p>
                        <p className={`text-xl font-bold ${report.netFlow >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                          {formatCurrency(report.netFlow)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {report.categories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-foreground">Top Spending Categories</h4>
                      <div className="space-y-2">
                        {report.categories.map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                            <span className="font-medium text-foreground">{cat.name}</span>
                            <div className="text-right">
                              <div className="font-semibold text-foreground">{formatCurrency(cat.amount)}</div>
                              <div className="text-xs text-muted-foreground">{cat.count} transactions</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Category Spending Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryReport.map((cat, index) => (
                  <div key={cat.category} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{cat.category}</span>
                        <Badge variant="secondary">{cat.percentOfTotal.toFixed(1)}%</Badge>
                      </div>
                      <span className="font-bold text-lg text-foreground">{formatCurrency(cat.totalSpent)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">{cat.transactionCount}</span> transactions
                      </div>
                      <div>
                        Avg per transaction: <span className="font-medium text-foreground">{formatCurrency(cat.averagePerTransaction)}</span>
                      </div>
                      <div>
                        Monthly avg: <span className="font-medium text-foreground">{formatCurrency(cat.monthlyAverage)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(cat.percentOfTotal, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Budget Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetReport.length > 0 ? (
                <div className="space-y-4">
                  {budgetReport.map((budget: any) => (
                    <div key={budget.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{budget.name}</h4>
                        <Badge variant={budget.status === 'over' ? 'destructive' : budget.status === 'warning' ? 'default' : 'secondary'}>
                          {budget.percentUsed.toFixed(1)}% used
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Spent:</span> <span className="font-medium text-foreground">{formatCurrency(budget.spent)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span> <span className="font-medium text-foreground">{formatCurrency(budget.limit)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Remaining:</span> 
                          <span className={`font-medium ml-1 ${budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(budget.remaining)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            budget.status === 'over' ? 'bg-red-500' : 
                            budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Budgets Set</h3>
                  <p className="text-muted-foreground">Create budgets to track your spending performance.</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/budgets'}>
                    Create Budget
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}