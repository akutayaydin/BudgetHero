import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/financial-utils";
import { calculateProfitLoss, defaultCategories, includeInProfitLoss, getLedgerTypeColor, getLedgerTypeLabel } from "@/lib/transaction-classifier";
import { TrendingUp, TrendingDown, ArrowUpDown, Target } from "lucide-react";

export default function EnhancedAnalytics() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Calculate proper profit/loss excluding transfers
  const { totalIncome, totalExpenses, netIncome } = calculateProfitLoss(transactions as any[], defaultCategories);

  // Group transactions by ledger type for analysis
  const transactionsByLedgerType = (transactions as any[]).reduce((acc: any, transaction: any) => {
    const category = defaultCategories.find(c => c.name === transaction.category);
    const ledgerType = category?.ledgerType || 'EXPENSE';
    
    if (!acc[ledgerType]) {
      acc[ledgerType] = { count: 0, amount: 0, transactions: [] };
    }
    
    acc[ledgerType].count += 1;
    acc[ledgerType].amount += Math.abs(parseFloat(transaction.amount));
    acc[ledgerType].transactions.push(transaction);
    
    return acc;
  }, {});

  // Calculate transfer amounts (excluded from P/L)
  const transferAmount = (transactionsByLedgerType.TRANSFER?.amount || 0) + 
                        (transactionsByLedgerType.DEBT_PRINCIPAL?.amount || 0);

  return (
    <div className="space-y-6">
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income (P&L)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={netIncome >= 0 ? "text-financial-income" : "text-financial-expense"}>
                {formatCurrency(Math.abs(netIncome))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Excludes transfers and debt principal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">True Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-financial-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-financial-income">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionsByLedgerType.INCOME?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">True Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-financial-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-financial-expense">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Includes {(transactionsByLedgerType.EXPENSE?.count || 0) + (transactionsByLedgerType.DEBT_INTEREST?.count || 0)} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfers</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {formatCurrency(transferAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Excluded from P&L calculation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Classification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown by ledger type showing proper financial categorization
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(transactionsByLedgerType).map(([ledgerType, data]: [string, any]) => (
              <div key={ledgerType} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={getLedgerTypeColor(ledgerType as any)}>
                    {getLedgerTypeLabel(ledgerType as any)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.count} transactions
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.amount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {includeInProfitLoss(ledgerType as any) ? "Included in P&L" : "Excluded from P&L"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Classification Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Profit/Loss Calculation</p>
                <p className="text-sm text-green-700">
                  Only includes income, expenses, and debt interest - excludes transfers and principal payments
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(Math.abs(netIncome))}
                </p>
                <p className="text-sm text-green-700">
                  {netIncome >= 0 ? "Profit" : "Loss"}
                </p>
              </div>
            </div>

            {transferAmount > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Transfers & Debt Principal</p>
                  <p className="text-sm text-blue-700">
                    Money moved between accounts - not counted as expenses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(transferAmount)}
                  </p>
                  <p className="text-sm text-blue-700">Excluded</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}