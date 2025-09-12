import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Category {
  name: string;
  amount: number;
  lastMonth: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
}

interface DataPoint {
  period: string;
  income: number;
  expenses: number;
}

interface Props {
  categories: Category[];
  transactions: Transaction[];
}

export default function IncomeExpenseBarChart({
  categories: _categories,
  transactions,
}: Props) {
  // Build monthly income/expense totals from live transactions
  const chartData = useMemo(() => {
    const map = new Map<string, { period: string; income: number; expenses: number; date: Date }>();

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const period = d.toLocaleDateString(undefined, { month: "short" });
      const amt = Math.abs(parseFloat(t.amount));
      const entry = map.get(key) || { period, income: 0, expenses: 0, date: d };
      if (t.type === "income") entry.income += amt;
      else entry.expenses += amt;
      map.set(key, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((v) => ({ period: v.period, income: v.income, expenses: v.expenses }));
  }, [transactions]);

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: chartData.length * 64, width: "100%", height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barCategoryGap={32}
            barGap={4}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              cursor={{ fill: "transparent" }}
            />
            <defs>
              {/* Cross-hatched pattern: vertical + horizontal dashes */}
              <pattern id="expensePattern" patternUnits="userSpaceOnUse" width={3} height={3}>
                <rect x="0" y="0" width="2" height="4" fill="#B23091" />
                <rect x="0" y="0" width="4" height="2" fill="#FFFFFF" />
              </pattern>
            </defs>
            {/* Income = solid teal */}
            <Bar
              dataKey="income"
              fill="#10B981"
              name="Income"
              radius={[24, 24, 0, 0]}
              barSize={16}
            />
            {/* Expenses = cross-hatched */}
            <Bar
              dataKey="expenses"
              fill="url(#expensePattern)"
              name="Expenses"
              radius={[24, 24, 0, 0]}
              barSize={16}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              content={() => (
                <div className="flex justify-center gap-4 text-xs mt-4">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} />
                    Income
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" className="rounded-sm">
                      <rect width="12" height="12" fill="url(#expensePattern)" />
                    </svg>
                    Expenses
                  </div>
                </div>
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
