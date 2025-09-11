import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DataPoint {
  period: string;
  income: number;
  expenses: number;
}

const DATA: Record<string, DataPoint[]> = {
  week: [
    { period: "Week 1", income: 1200, expenses: 900 },
    { period: "Week 2", income: 1100, expenses: 1000 },
    { period: "Week 3", income: 1300, expenses: 1050 },
    { period: "Week 4", income: 1250, expenses: 950 },
  ],
  month: [
    { period: "Apr", income: 8000, expenses: 6200 },
    { period: "May", income: 8200, expenses: 6400 },
    { period: "Jun", income: 7800, expenses: 6100 },
    { period: "Jul", income: 8300, expenses: 6500 },
    { period: "Aug", income: 8100, expenses: 6300 },
    { period: "Sep", income: 8400, expenses: 6600 },
  ],
  quarter: [
    { period: "Q1", income: 24000, expenses: 18500 },
    { period: "Q2", income: 25000, expenses: 19500 },
    { period: "Q3", income: 24500, expenses: 19000 },
    { period: "Q4", income: 25500, expenses: 20000 },
  ],
  year: [
    { period: "2021", income: 96000, expenses: 76000 },
    { period: "2022", income: 98000, expenses: 78000 },
    { period: "2023", income: 99000, expenses: 79000 },
    { period: "2024", income: 102000, expenses: 80000 },
  ],
};

export default function IncomeExpenseBarChart() {
  const [period, setPeriod] = useState<keyof typeof DATA>("month");
  const chartData = DATA[period];

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as keyof typeof DATA)}
          className="border rounded-md p-1"
        >
          <ToggleGroupItem value="week" className="text-xs">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" className="text-xs">Month</ToggleGroupItem>
          <ToggleGroupItem value="quarter" className="text-xs">Quarter</ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs">Year</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="w-full overflow-x-auto">
        <div
          style={{
            minWidth: chartData.length * 60,
            width: "100%",
            height: 240,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis
                label={{ value: "Amount ($)", angle: -90, position: "insideLeft" }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="income" fill="#22C55E" name="Income" />
              <Bar dataKey="expenses" fill="#A855F7" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
