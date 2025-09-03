import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const timeRanges = ["1M", "3M", "6M", "1Y"] as const;
type TimeRange = (typeof timeRanges)[number];

const currentPeriod = [
  { date: "Jan 1", value: 2000 },
  { date: "Jan 15", value: 2500 },
  { date: "Jan 30", value: 3000 },
  { date: "Feb 14", value: 3500 },
];

const previousPeriod = [
  { date: "Dec 1", value: 1500 },
  { date: "Dec 15", value: 1700 },
  { date: "Dec 30", value: 1800 },
  { date: "Jan 14", value: 1900 },
];

const faqs = [
  {
    q: "What is net worth?",
    a: "Net worth is the value of your assets minus your liabilities.",
  },
  {
    q: "How is the chart calculated?",
    a: "The chart compares your current period to the previous period.",
  },
];

interface SummaryCardProps {
  title: string;
  value: string;
  change: number;
}

function SummaryCard({ title, value, change }: SummaryCardProps) {
  const isPositive = change > 0;
  
  return (
    <Card className="flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">{Math.abs(change)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewDashboard() {
  const [range, setRange] = useState<TimeRange>("1M");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Net Worth</CardTitle>
          <div className="text-3xl font-bold">$12.5k</div>
          <div className="flex gap-2 mt-4">
            {timeRanges.map((t) => (
              <Button
                key={t}
                variant={range === t ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRange(t)}
                className={range === t ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}
              >
                {t}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Assets" value="$5.83k" change={127} />
        <SummaryCard title="Debt" value="$1.20k" change={4} />
        <SummaryCard title="Net Worth" value="$4.63k" change={187} />
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((item, idx) => (
            <Collapsible key={idx}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full justify-between p-0 h-auto"
                  onClick={() => toggleFaq(idx)}
                >
                  <span className="text-left">{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}