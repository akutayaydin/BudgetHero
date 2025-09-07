import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBudgetPlan } from "@/hooks/useBudgetPlan";
import ManageBudget from "@/components/budget/ManageBudget";
import { useLocation } from "wouter";

function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}


export default function BudgetsIndex() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, isLoading, error } = useBudgetPlan(month);
  const [, navigate] = useLocation();

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, m - 1);
    date.setMonth(date.getMonth() + delta);
    setMonth(date.toISOString().slice(0, 7));
  };


  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{String(error)}</div>;

        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => changeMonth(-1)}>&larr;</Button>
              <span className="font-medium">{formatMonth(month)}</span>
              <Button variant="outline" onClick={() => changeMonth(1)}>&rarr;</Button>
      </div>
            {data ? (
              <ManageBudget plan={data} />
            ) : (
              <div className="flex justify-center">
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <CardTitle>Your budget plan hasn't been set for this month</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={() => navigate('/budgets/setup')}>Set Budget</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
            );
}