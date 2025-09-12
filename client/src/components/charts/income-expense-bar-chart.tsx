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
  Legend,
} from "recharts";

interface DataPoint {
  period: string;
  income: number;
  expenses: number;
}

const DATA: Record<string, DataPoint[]> = {
  week: [
    { period: "8/4", income: 1200, expenses: 900 },
    { period: "8/11", income: 1100, expenses: 1000 },
    { period: "8/18", income: 1300, expenses: 1050 },
    { period: "8/25", income: 1250, expenses: 950 },
    { period: "9/1", income: 1400, expenses: 1000 },
    { period: "9/8", income: 1350, expenses: 1100 },
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
      {/* Toggle Controls */}
      <div className="flex justify-start mb-4">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as keyof typeof DATA)}
          className="rounded-full bg-gray-100 p-1"
        >
          <ToggleGroupItem
            value="week"
            className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-white data-[state=on]:shadow"
          >
            Week
          </ToggleGroupItem>
          <ToggleGroupItem
            value="month"
            className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-white data-[state=on]:shadow"
          >
            Month
          </ToggleGroupItem>
          <ToggleGroupItem
            value="quarter"
            className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-white data-[state=on]:shadow"
          >
            Quarter
          </ToggleGroupItem>
          <ToggleGroupItem
            value="year"
            className="px-3 py-1 text-xs rounded-full data-[state=on]:bg-white data-[state=on]:shadow"
          >
            Year
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Bar Chart */}
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: chartData.length * 48, width: "100%", height: 240 }}>
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
              {/* Expenses = cross-hatched orange */}
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
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#10B981" }}
                      />
                      Income
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Legend uses same cross-hatched pattern */}
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
    </div>
  );
}
