import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function FinancialHealthScore() {
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const calculateOverallScore = () => {
    if (!Array.isArray(transactions)) return 0;

    // Calculate metrics for current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthTx = transactions.filter((tx: any) => new Date(tx.date) >= currentMonthStart);

    const currentIncome = currentMonthTx
      .filter((tx: any) => tx.type === 'income')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    const currentExpenses = currentMonthTx
      .filter((tx: any) => tx.type === 'expense')
      .reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

    const netWorth = Array.isArray(accounts) ? accounts.reduce((sum: number, account: any) => sum + parseFloat(account.balance || 0), 0) : 0;
    const cashFlow = currentIncome - currentExpenses;
    const savingsRate = currentIncome > 0 ? (cashFlow / currentIncome) * 100 : 0;

    // Emergency fund calculation
    const monthlyExpenses = currentExpenses || 1000;
    const emergencyFundMonths = monthlyExpenses > 0 ? netWorth / monthlyExpenses : 0;

    // Budget compliance
    const totalBudget = Array.isArray(budgets) ? budgets.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount || 0), 0) : 0;
    const budgetCompliance = totalBudget > 0 ? Math.max(0, Math.min(100, ((totalBudget - currentExpenses) / totalBudget) * 100)) : 100;

    // Calculate individual scores
    const cashFlowScore = cashFlow > 0 ? (cashFlow > currentIncome * 0.2 ? 100 : 70) : 20;
    const savingsScore = savingsRate >= 20 ? 100 : savingsRate >= 10 ? 80 : savingsRate >= 5 ? 60 : 30;
    const emergencyScore = emergencyFundMonths >= 6 ? 100 : emergencyFundMonths >= 3 ? 80 : emergencyFundMonths >= 1 ? 60 : 30;
    const budgetScore = budgetCompliance >= 90 ? 100 : budgetCompliance >= 70 ? 80 : budgetCompliance >= 50 ? 60 : 30;

    return (cashFlowScore + savingsScore + emergencyScore + budgetScore) / 4;
  };

  const overallScore = calculateOverallScore();

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { text: "Excellent", color: "text-green-600", bg: "bg-green-500" };
    if (score >= 70) return { text: "Good", color: "text-blue-600", bg: "bg-blue-500" };
    if (score >= 50) return { text: "Fair", color: "text-yellow-600", bg: "bg-yellow-500" };
    return { text: "Needs Improvement", color: "text-red-600", bg: "bg-red-500" };
  };

  const status = getScoreStatus(overallScore);

  if (transactionsLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-slate-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/health">
      <Card className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardContent className="p-4">
          {/* Mobile-first layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                  Financial Health Score
                </h3>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
                        className={`transition-all duration-1000 ease-out ${status.bg.replace('bg-', 'text-')}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${status.color}`}>
                        {Math.round(overallScore)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      overallScore >= 90 ? 'bg-green-100 text-green-700' :
                      overallScore >= 70 ? 'bg-blue-100 text-blue-700' :
                      overallScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {status.text}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tap for details
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow - positioned differently on mobile vs desktop */}
            <div className="self-center sm:self-auto flex-shrink-0">
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}