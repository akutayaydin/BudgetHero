import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BudgetPlan, Transaction, Budget } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  plan: BudgetPlan;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Ring({ percent }: { percent: number }) {
  const dash = Math.max(0, Math.min(percent, 100));
  return (
    <svg viewBox="0 0 36 36" className="w-6 h-6">
      <path
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <path
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={`${dash}, 100`}
      />
    </svg>
  );
}

function BudgetRow({
  name,
  budgeted,
  actual,
}: {
  name: string;
  budgeted: number;
  actual: number;
}) {
  const remaining = budgeted - actual;
  const percent = budgeted > 0 ? (remaining / budgeted) * 100 : 0;
  const color = remaining < 0 ? "text-red-500" : "text-green-600";
  return (
    <tr className="border-t">
      <td className="py-2">{name}</td>
      <td className="py-2 text-right">{fmt.format(budgeted)}</td>
      <td className="py-2 text-right">{fmt.format(actual)}</td>
      <td className="py-2">
        <div className={`flex items-center justify-end gap-2 ${color}`}>
          <Ring percent={percent} />
          <span>{fmt.format(remaining)}</span>
        </div>
      </td>
    </tr>
  );
}

export default function ManageBudget({ plan }: Props) {
  const { month, expectedEarnings, expectedBills, spendingBudget } = plan;

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", month],
    queryFn: async () => {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      const res = await fetch(`/api/transactions?startDate=${start}&endDate=${end}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    queryFn: async () => {
      const res = await fetch("/api/budgets", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const { basics, categoryRows, currentSpend, remaining, validationError } = useMemo(() => {
    let income = 0;
    let billsActual = 0;
    let totalExpenses = 0;
    const actualByCat: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if ((t as any).type === "income") {
        income += amt;
      } else {
        totalExpenses += amt;
        const cat = (t.category || "").toLowerCase();
        if (cat === "bills & utilities") billsActual += amt;
        actualByCat[cat] = (actualByCat[cat] || 0) + amt;
      }
    });

    const categories = budgets.map((b) => ({
      id: (b as any).id,
      name: (b as any).name as string,
      budgeted: Number((b as any).limit),
      actual: actualByCat[((b as any).name || "").toLowerCase()] || 0,
    }));

    const allocated = categories.reduce((s, c) => s + c.budgeted, 0);
    const categoriesSpent = categories.reduce((s, c) => s + c.actual, 0);
    const spendingExpenses = totalExpenses - billsActual;

    const everythingElse = {
      id: "everything-else",
      name: "Everything Else",
      budgeted: Math.max(Number(spendingBudget) - allocated, 0),
      actual: Math.max(spendingExpenses - categoriesSpent, 0),
    };

    const basicsRows = [
      { name: "Income", budgeted: Number(expectedEarnings), actual: income },
      { name: "Bills & Utilities", budgeted: Number(expectedBills), actual: billsActual },
    ];

    const currentSpendVal = categoriesSpent + everythingElse.actual;
    const remainingVal = Number(spendingBudget) - currentSpendVal;

    return {
      basics: basicsRows,
      categoryRows: [...categories, everythingElse],
      currentSpend: currentSpendVal,
      remaining: remainingVal,
      validationError: allocated > Number(spendingBudget),
    };
  }, [transactions, budgets, expectedEarnings, expectedBills, spendingBudget]);

  const percentLeft =
    Number(spendingBudget) > 0 ? (remaining / Number(spendingBudget)) * 100 : 0;
  const ringColor =
    remaining < 0
      ? "text-red-500"
      : percentLeft < 10
      ? "text-orange-500"
      : "text-green-600";

  const [yy, mm] = month.split("-").map(Number);
  const endOfMonth = new Date(yy, mm, 0);
  const today = new Date();
  let daysRemaining = endOfMonth.getDate();
  if (today.getFullYear() === yy && today.getMonth() + 1 === mm) {
    daysRemaining = Math.max(endOfMonth.getDate() - today.getDate() + 1, 0);
  }
  const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;
  

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget Basics</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Name</th>
                  <th className="text-right">Budgeted</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {basics.map((b) => (
                  <BudgetRow key={b.name} {...b} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <Button size="sm" variant="outline">
              Add Budget
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {validationError && (
              <div className="text-red-500 text-sm mb-2">
                Category budgets exceed spending budget
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Name</th>
                  <th className="text-right">Budgeted</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((c) => (
                  <BudgetRow key={c.id} {...c} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-1 md:sticky md:top-4">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 36 36" className={`w-24 h-24 ${ringColor}`}>
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${Math.max(Math.min(percentLeft, 100), 0)}, 100`}
              />
              <text x="18" y="20.35" className="text-xs" textAnchor="middle" fill="currentColor">
                {fmt.format(remaining)}
              </text>
            </svg>
            <span className="text-sm mt-1">Left to Spend</span>
            <span className="text-xs text-muted-foreground">
              {daysRemaining > 0 ? `${fmt.format(dailyAllowance)}/day` : ""}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Spending Budget</span>
              <span>{Number(spendingBudget).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Spend</span>
              <span>{currentSpend.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Remaining</span>
              <span className={ringColor}>{remaining.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
