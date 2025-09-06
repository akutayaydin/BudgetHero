import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBudgetPlan } from "@/hooks/useBudgetPlan";
import ManageBudget from "@/components/budget/ManageBudget";
import { useLocation } from "wouter";

export default function BudgetsIndex() {
  const month = new Date().toISOString().slice(0, 7);
  const { data, isLoading, error } = useBudgetPlan(month);
  const [, navigate] = useLocation();

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{String(error)}</div>;

  if (!data) {
    return (
      <div className="p-4 flex justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Your budget plan hasn't been set for this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/budgets/setup')}>Set Budget</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ManageBudget plan={data} />;
}