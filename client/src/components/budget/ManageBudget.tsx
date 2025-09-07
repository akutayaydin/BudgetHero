import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetPlanSchema, type BudgetPlan, type InsertBudgetPlan } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUpdateBudgetPlan } from "@/hooks/useBudgetPlan";

interface Props {
  plan: BudgetPlan;
}

export default function ManageBudget({ plan }: Props) {
  const form = useForm<InsertBudgetPlan>({
    resolver: zodResolver(insertBudgetPlanSchema),
    defaultValues: {
      month: plan.month,
      expectedEarnings: Number(plan.expectedEarnings),
      expectedBills: Number(plan.expectedBills),
      savingsRate: plan.savingsRate,
      savingsReserve: Number(plan.savingsReserve),
      spendingBudget: Number(plan.spendingBudget),
    },
  });

  const { register, watch, handleSubmit } = form;
  const updateMutation = useUpdateBudgetPlan();

  const earnings = watch("expectedEarnings") || 0;
  const bills = watch("expectedBills") || 0;
  const rate = watch("savingsRate") || 0;
  const savingsReserve = earnings * rate / 100;
  const spendingBudget = earnings - bills - savingsReserve;
  const percent = earnings > 0 ? (spendingBudget / earnings) * 100 : 0;

  const onSubmit = (values: InsertBudgetPlan) => {
    updateMutation.mutate({
      id: plan.id,
      ...values,
      // React Hook Form only returns registered fields in `values`,
      // so ensure `month` is included for cache invalidation.
      month: plan.month,
      savingsReserve,
      spendingBudget,
    });
  };

  return (
    <div className="p-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Manage Budget Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Expected Earnings</label>
              <Input type="number" step="0.01" {...register("expectedEarnings", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Expected Bills</label>
              <Input type="number" step="0.01" {...register("expectedBills", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Savings %</label>
              <Input type="number" step="1" {...register("savingsRate", { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-24 h-24">
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
                  strokeDasharray={`${percent}, 100`}
                />
                <text x="18" y="20.35" className="text-xs" textAnchor="middle">
                  {spendingBudget.toFixed(0)}
                </text>
              </svg>
              <span className="text-sm mt-1">Left to Spend</span>
            </div>
          </div>
          <div>
            <Progress value={percent} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
