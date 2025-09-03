import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

export default function KpiCards() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Total Income",
      value: (summary as any)?.totalIncome || 0,
      icon: TrendingUp,
      bgColor: "bg-green-100",
      iconColor: "text-financial-income",
      valueColor: "text-financial-income",
      change: "+12.5%",
      changeColor: "text-green-600"
    },
    {
      title: "Total Expenses",
      value: (summary as any)?.totalExpenses || 0,
      icon: TrendingDown,
      bgColor: "bg-red-100",
      iconColor: "text-financial-expense",
      valueColor: "text-financial-expense",
      change: "+5.2%",
      changeColor: "text-red-600"
    },
    {
      title: "Net Savings",
      value: (summary as any)?.netSavings || 0,
      icon: PiggyBank,
      bgColor: "bg-blue-100",
      iconColor: "text-financial-primary",
      valueColor: "text-financial-income",
      change: "+18.3%",
      changeColor: "text-green-600"
    },
    {
      title: "Transactions",
      value: (summary as any)?.transactionCount || 0,
      icon: Receipt,
      bgColor: "bg-slate-100",
      iconColor: "text-slate-600",
      valueColor: "text-slate-900",
      change: "+23",
      changeColor: "text-green-600",
      isCount: true
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                <p className={`text-2xl font-bold ${kpi.valueColor}`}>
                  {kpi.isCount ? kpi.value : formatCurrency(kpi.value)}
                </p>
              </div>
              <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${kpi.changeColor}`}>{kpi.change}</span>
              <span className="text-slate-600 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
