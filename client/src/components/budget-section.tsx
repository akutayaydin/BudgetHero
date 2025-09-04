import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { Link } from "wouter";

interface Budget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  period: string;
}

export function BudgetSection() {
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ['/api/budgets'],
  });

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgeted, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.budgeted) * 100;
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'good': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <TrendingUp className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Budget Summary
          </CardTitle>
          <Link href="/budgets">
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Manage Budget
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {budgets.length > 0 ? (
          <>
            {/* Overall Budget Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Budgeted</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(totalBudgeted || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spent</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    ${(totalSpent || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className={`text-lg font-semibold ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${Math.abs(totalRemaining || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {spentPercentage.toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(spentPercentage)}`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Category Breakdown</h4>
              <div className="space-y-3">
                {budgets.map((budget) => {
                  const status = getBudgetStatus(budget);
                  const percentage = (budget.spent / budget.budgeted) * 100;
                  
                  return (
                    <div key={budget.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {budget.category}
                          </h5>
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="ml-1 capitalize">{status}</span>
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(budget.spent || 0).toLocaleString()} / ${(budget.budgeted || 0).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${Math.abs(budget.remaining || 0).toLocaleString()} {(budget.remaining || 0) >= 0 ? 'left' : 'over'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{budget.period}</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Create Your First Budget
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Set spending limits for different categories to stay on track with your financial goals
            </p>
            <Link href="/budgets">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}