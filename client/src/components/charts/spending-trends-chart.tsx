import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/financial-utils";

export default function SpendingTrendsChart() {
  const [timeRange, setTimeRange] = useState("6months");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "6months":
        return { start: subMonths(now, 6), end: now };
      case "1year":
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subMonths(now, 6), end: now };
    }
  };

  const processChartData = () => {
    if (!transactions) return [];

    const { start, end } = getDateRange();
    const filteredTransactions = (transactions as any[])?.filter((t: any) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    }) || [];

    // Group by month
    const monthlyData = new Map();
    
    filteredTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const monthKey = format(startOfMonth(date), "yyyy-MM");
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: format(date, "MMM yyyy"),
          income: 0,
          expenses: 0,
        });
      }
      
      const monthData = monthlyData.get(monthKey);
      const amount = parseFloat(transaction.amount);
      
      if (transaction.type === "income") {
        monthData.income += amount;
      } else {
        monthData.expenses += amount;
      }
    });

    return Array.from(monthlyData.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  };

  const chartData = processChartData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Trends</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "income" ? "Income" : "Expenses"
                ]}
                labelStyle={{ color: "#1e293b" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
