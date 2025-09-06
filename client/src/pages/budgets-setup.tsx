import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetPlanSchema, type InsertBudgetPlan } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBudgetPlan } from "@/hooks/useBudgetPlan";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function BudgetSetup() {
  const month = new Date().toISOString().slice(0, 7);
  const form = useForm<InsertBudgetPlan>({
    resolver: zodResolver(insertBudgetPlanSchema),
    defaultValues: {
      month,
      expectedEarnings: 0,
      expectedBills: 0,
      savingsRate: 15,
      savingsReserve: 0,
      spendingBudget: 0,
    },
  });

  const { register, handleSubmit, setValue, watch } = form;
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();

  const incomeEstimate = useQuery({ queryKey: ["/api/budget/income/estimate?months=3"] });
  const billsEstimate = useQuery({ queryKey: ["/api/budget/bills/estimate?months=3"] });

  useEffect(() => {
    if (incomeEstimate.data) {
      setValue("expectedEarnings", incomeEstimate.data.average || 0);
    }
  }, [incomeEstimate.data, setValue]);

  useEffect(() => {
    if (billsEstimate.data) {
      setValue("expectedBills", billsEstimate.data.average || 0);
    }
  }, [billsEstimate.data, setValue]);

  const earnings = watch("expectedEarnings") || 0;
  const bills = watch("expectedBills") || 0;
  const rate = watch("savingsRate") || 15;
  const savingsReserve = earnings * rate / 100;
  const spendingBudget = earnings - bills - savingsReserve;

  useEffect(() => {
    setValue("savingsReserve", savingsReserve);
    setValue("spendingBudget", spendingBudget);
  }, [savingsReserve, spendingBudget, setValue]);

  const createMutation = useCreateBudgetPlan();

  const onSubmit = (values: InsertBudgetPlan) => {
    createMutation.mutate(values, { onSuccess: () => navigate("/budgets") });
  };

  return (
    <div className="p-4 flex justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Setup Budget Plan - Step {step}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div>
              <label className="block text-sm mb-1">Expected Earnings</label>
              <Input type="number" step="0.01" {...register("expectedEarnings", { valueAsNumber: true })} />
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block text-sm mb-1">Bills & Utilities</label>
              <Input type="number" step="0.01" {...register("expectedBills", { valueAsNumber: true })} />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Savings %</label>
                <Input type="number" step="1" {...register("savingsRate", { valueAsNumber: true })} />
              </div>
              <div className="text-sm text-muted-foreground">
                Spending Budget: {spendingBudget.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 3 && <Button onClick={() => setStep(step + 1)}>Next</Button>}
            {step === 3 && (
              <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}