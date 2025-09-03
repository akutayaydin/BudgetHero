import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank, 
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  BarChart3,
  RefreshCw,
  Download,
  Share,
  Eye,
  EyeOff
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";

interface HealthMetric {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendation?: string;
}

interface FinancialSnapshot {
  overallScore: number;
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  cashFlow: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  budgetCompliance: number;
  metrics: HealthMetric[];
  trends: {
    income: { value: number; change: number };
    expenses: { value: number; change: number };
    savings: { value: number; change: number };
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: string;
  }>;
}

export function FinancialHealthSnapshot() {
  const [isVisible, setIsVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const calculateFinancialHealth = (): FinancialSnapshot => {
    if (!Array.isArray(transactions)) {
      return {
        overallScore: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netWorth: 0,
        cashFlow: 0,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        emergencyFundMonths: 0,
        budgetCompliance: 0,
        metrics: [],
        trends: {
          income: { value: 0, change: 0 },
          expenses: { value: 0, change: 0 },
          savings: { value: 0, change: 0 }
        },
        alerts: []
      };
    }

    // Calculate metrics for current month and previous month for trend analysis
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month transactions
    const currentMonthTx = transactions.filter((tx: any) => new Date(tx.date) >= currentMonthStart);
    // Previous month transactions
    const previousMonthTx = transactions.filter((tx: any) => 
      new Date(tx.date) >= previousMonthStart && new Date(tx.date) <= previousMonthEnd
    );

    // Current month calculations
    const currentIncome = currentMonthTx
      .filter((tx: any) => tx.type === 'income')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    const currentExpenses = currentMonthTx
      .filter((tx: any) => tx.type === 'expense')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    // Previous month calculations for trends
    const previousIncome = previousMonthTx
      .filter((tx: any) => tx.type === 'income')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    const previousExpenses = previousMonthTx
      .filter((tx: any) => tx.type === 'expense')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    // Calculate trends
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

    const netWorth = Array.isArray(accounts) ? accounts.reduce((sum: number, account: any) => sum + parseFloat(account.balance || 0), 0) : 0;
    const cashFlow = currentIncome - currentExpenses;
    const savingsRate = currentIncome > 0 ? (cashFlow / currentIncome) * 100 : 0;
    const savingsChange = previousIncome > 0 ? (((currentIncome - currentExpenses) - (previousIncome - previousExpenses)) / (previousIncome - previousExpenses)) * 100 : 0;

    // Emergency fund calculation
    const monthlyExpenses = currentExpenses || previousExpenses || 1000; // Use previous month if current is 0
    const emergencyFundMonths = monthlyExpenses > 0 ? netWorth / monthlyExpenses : 0;

    // Budget compliance - compare current expenses to total budget
    const totalBudget = Array.isArray(budgets) ? budgets.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount || 0), 0) : 0;
    const budgetCompliance = totalBudget > 0 ? Math.max(0, Math.min(100, ((totalBudget - currentExpenses) / totalBudget) * 100)) : 100;

    // Health metrics scoring
    const metrics: HealthMetric[] = [
      {
        category: "Cash Flow",
        score: cashFlow > 0 ? (cashFlow > currentIncome * 0.2 ? 100 : 70) : 20,
        status: cashFlow > 0 ? (cashFlow > currentIncome * 0.2 ? 'excellent' : 'good') : 'poor',
        description: cashFlow > 0 ? "Positive cash flow" : "Negative cash flow",
        recommendation: cashFlow <= 0 ? "Review expenses and increase income" : undefined
      },
      {
        category: "Savings Rate",
        score: savingsRate >= 20 ? 100 : savingsRate >= 10 ? 80 : savingsRate >= 5 ? 60 : 30,
        status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate >= 5 ? 'fair' : 'poor',
        description: `${savingsRate.toFixed(1)}% savings rate`,
        recommendation: savingsRate < 20 ? "Aim for 20% savings rate" : undefined
      },
      {
        category: "Emergency Fund",
        score: emergencyFundMonths >= 6 ? 100 : emergencyFundMonths >= 3 ? 80 : emergencyFundMonths >= 1 ? 60 : 30,
        status: emergencyFundMonths >= 6 ? 'excellent' : emergencyFundMonths >= 3 ? 'good' : emergencyFundMonths >= 1 ? 'fair' : 'poor',
        description: `${emergencyFundMonths.toFixed(1)} months coverage`,
        recommendation: emergencyFundMonths < 3 ? "Build 3-6 months emergency fund" : undefined
      },
      {
        category: "Budget Adherence",
        score: budgetCompliance >= 90 ? 100 : budgetCompliance >= 70 ? 80 : budgetCompliance >= 50 ? 60 : 30,
        status: budgetCompliance >= 90 ? 'excellent' : budgetCompliance >= 70 ? 'good' : budgetCompliance >= 50 ? 'fair' : 'poor',
        description: `${budgetCompliance.toFixed(1)}% on track`,
        recommendation: budgetCompliance < 70 ? "Review and adjust budget categories" : undefined
      }
    ];

    const overallScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;

    // Generate alerts
    const alerts = [];
    if (cashFlow < 0) {
      alerts.push({
        type: 'warning' as const,
        message: "Your expenses exceed income this month",
        action: "Review spending patterns"
      });
    }
    if (emergencyFundMonths < 1) {
      alerts.push({
        type: 'warning' as const,
        message: "Low emergency fund reserves",
        action: "Start building emergency savings"
      });
    }
    if (savingsRate >= 20) {
      alerts.push({
        type: 'success' as const,
        message: "Excellent savings rate! You're on track for financial goals"
      });
    }

    return {
      overallScore,
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      netWorth,
      cashFlow,
      savingsRate,
      debtToIncomeRatio: 0, // Would need debt data
      emergencyFundMonths,
      budgetCompliance,
      metrics,
      trends: {
        income: { value: currentIncome, change: incomeChange },
        expenses: { value: currentExpenses, change: expenseChange },
        savings: { value: cashFlow, change: savingsChange }
      },
      alerts
    };
  };

  const snapshot = calculateFinancialHealth();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 70) return "bg-blue-100 dark:bg-blue-900/30";
    if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'good': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'poor': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      overallScore: snapshot.overallScore,
      metrics: snapshot.metrics,
      summary: {
        income: snapshot.totalIncome,
        expenses: snapshot.totalExpenses,
        netWorth: snapshot.netWorth,
        savingsRate: snapshot.savingsRate
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-health-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (transactionsLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-48 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-br from-background via-blue-50 dark:via-blue-950/30 to-purple-50 dark:to-purple-950/30 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Financial Health Snapshot
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Updated: {new Date().toLocaleDateString()} • Real-time analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-6">
          {/* Overall Score with animated progress */}
          <div className="text-center relative">
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Animated circular progress */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - snapshot.overallScore / 100)}`}
                  className={`transition-all duration-1000 ease-out ${
                    snapshot.overallScore >= 90 ? 'text-green-500' :
                    snapshot.overallScore >= 70 ? 'text-blue-500' :
                    snapshot.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className={`text-3xl font-bold ${getScoreColor(snapshot.overallScore)}`}>
                    {Math.round(snapshot.overallScore)}
                  </span>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Overall Financial Health Score
            </h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(snapshot.overallScore)} ${getScoreColor(snapshot.overallScore)}`}>
              {snapshot.overallScore >= 90 ? "🌟 Excellent" : 
               snapshot.overallScore >= 70 ? "✅ Good" : 
               snapshot.overallScore >= 50 ? "⚠️ Fair" : "🔴 Needs Improvement"}
            </div>
          </div>

          {/* Key Metrics Grid - Enhanced Mobile Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-background dark:bg-card rounded-xl p-4 shadow-md border border-green-100 dark:border-green-900/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mx-auto mb-3 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{formatCurrency(snapshot.totalIncome)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Monthly Income</p>
              <div className="flex items-center justify-center gap-1">
                {snapshot.trends.income.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${snapshot.trends.income.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {snapshot.trends.income.change >= 0 ? '+' : ''}{snapshot.trends.income.change.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-background dark:bg-card rounded-xl p-4 shadow-md border border-red-100 dark:border-red-900/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-xl mx-auto mb-3 shadow-lg">
                <TrendingDown className="h-7 w-7 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{formatCurrency(snapshot.totalExpenses)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Monthly Expenses</p>
              <div className="flex items-center justify-center gap-1">
                {snapshot.trends.expenses.change <= 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${snapshot.trends.expenses.change <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {snapshot.trends.expenses.change >= 0 ? '+' : ''}{snapshot.trends.expenses.change.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-background dark:bg-card rounded-xl p-4 shadow-md border border-blue-100 dark:border-blue-900/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mx-auto mb-3 shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{formatCurrency(snapshot.netWorth)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Net Worth</p>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Total Assets
              </div>
            </div>

            <div className="bg-background dark:bg-card rounded-xl p-4 shadow-md border border-purple-100 dark:border-purple-900/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mx-auto mb-3 shadow-lg">
                <PiggyBank className="h-7 w-7 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">{snapshot.savingsRate.toFixed(1)}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Savings Rate</p>
              <div className="flex items-center justify-center gap-1">
                {snapshot.trends.savings.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${snapshot.trends.savings.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {snapshot.trends.savings.change >= 0 ? '+' : ''}{isFinite(snapshot.trends.savings.change) ? snapshot.trends.savings.change.toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Health Metrics - Enhanced Mobile Design */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground text-lg">Financial Health Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {snapshot.metrics.map((metric, index) => (
                <div key={index} className="bg-background dark:bg-card rounded-xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${
                    metric.status === 'excellent' ? 'bg-green-100 dark:bg-green-900/30' :
                    metric.status === 'good' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    metric.status === 'fair' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-foreground text-base">{metric.category}</h5>
                      <Badge className={`${getStatusColor(metric.status)} font-medium text-xs px-2 py-1`}>
                        {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                      </Badge>
                    </div>
                    
                    {/* Score display with animated progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">{Math.round(metric.score)}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                            metric.status === 'excellent' ? 'bg-green-500' :
                            metric.status === 'good' ? 'bg-blue-500' :
                            metric.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${metric.score}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{metric.description}</p>
                    {metric.recommendation && (
                      <div className="bg-gradient-to-r from-yellow-50 dark:from-yellow-950/20 to-orange-50 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400 text-lg">💡</span>
                          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium leading-relaxed">
                            {metric.recommendation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts - Enhanced Mobile Design */}
          {snapshot.alerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-lg">Smart Alerts & Insights</h4>
              <div className="space-y-3">
                {snapshot.alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                    alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 dark:from-yellow-950/20 to-orange-50 dark:to-orange-950/20 border-l-yellow-500' :
                    alert.type === 'success' ? 'bg-gradient-to-r from-green-50 dark:from-green-950/20 to-emerald-50 dark:to-emerald-950/20 border-l-green-500' :
                    'bg-gradient-to-r from-blue-50 dark:from-blue-950/20 to-indigo-50 dark:to-indigo-950/20 border-l-blue-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        alert.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        ) : alert.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">{alert.message}</p>
                        {alert.action && (
                          <p className="text-xs text-muted-foreground bg-background/60 dark:bg-card/60 rounded-md px-2 py-1 inline-block">
                            💼 Action: {alert.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions - Enhanced Mobile Design */}
          <div className="pt-6 border-t border-border">
            <h4 className="font-semibold text-foreground text-lg mb-4">Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Target className="h-4 w-4 mr-2" />
                Set Financial Goals
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Calendar className="h-4 w-4 mr-2" />
                Review Budget
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Share className="h-4 w-4 mr-2" />
                Share Report
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}