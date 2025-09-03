import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/financial-utils";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", 
  "#ec4899", "#10b981", "#84cc16", "#6366f1"
];

export default function CategoryBreakdownChart() {
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["/api/analytics/categories"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/categories?type=expense");
      return response.json();
    },
  });

  const processChartData = () => {
    if (!categoryData) return [];
    
    return categoryData.map((item: any, index: number) => ({
      name: item.category,
      value: item.amount,
      color: COLORS[index % COLORS.length],
    }));
  };

  const chartData = processChartData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{data.payload.name}</p>
          <p className="text-sm text-slate-600">
            Amount: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
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
          <CardTitle>Expense Categories</CardTitle>
          <Button variant="ghost" className="text-financial-primary hover:text-blue-700">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <p className="text-lg font-medium">No expense data available</p>
                <p className="text-sm">Upload your financial data to see category breakdown</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}