import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetPlanSchema, type InsertBudgetPlan } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateBudgetPlan } from "@/hooks/useBudgetPlan";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/page-header";
import { DollarSign, Calculator, Target, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BudgetSetup() {
  const month = new Date().toISOString().slice(0, 7);
  const { toast } = useToast();
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();

  const incomeEstimate = useQuery<{ average: number; months: any[] }>({ 
    queryKey: ["/api/budget/income/estimate?months=3"] 
  });
  const billsEstimate = useQuery<{ average: number; candidates: any[] }>({ 
    queryKey: ["/api/budget/bills/estimate?months=3"] 
  });

  useEffect(() => {
    if (incomeEstimate.data?.average) {
      setValue("expectedEarnings", incomeEstimate.data.average);
    }
  }, [incomeEstimate.data, setValue]);

  useEffect(() => {
    if (billsEstimate.data?.average) {
      setValue("expectedBills", billsEstimate.data.average);
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
    createMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Budget Plan Created",
          description: "Your budget plan has been successfully created.",
        });
        navigate("/budgets");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create budget plan. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return <DollarSign className="h-5 w-5" />;
      case 2:
        return <Calculator className="h-5 w-5" />;
      case 3:
        return <Target className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Budget Setup" 
        subtitle="Create your personalized budget plan in 3 simple steps"
        description="Set up your budget plan to track income, expenses, and savings goals"
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step >= stepNumber
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    getStepIcon(stepNumber)
                  )}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-colors ${
                      step > stepNumber ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Step {step} of 3: {step === 1 ? "Income" : step === 2 ? "Bills" : "Savings"}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {getStepIcon(step)}
                <div>
                  <CardTitle className="text-xl">
                    {step === 1 && "Expected Monthly Income"}
                    {step === 2 && "Monthly Bills & Utilities"}
                    {step === 3 && "Savings Goal"}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && "Enter your expected monthly earnings from all sources"}
                    {step === 2 && "Enter your fixed monthly bills and utility expenses"}
                    {step === 3 && "Set your savings rate and review your spending budget"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  {incomeEstimate.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="expectedEarnings" className="text-sm font-medium">
                          Expected Earnings
                        </Label>
                        <Input
                          id="expectedEarnings"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("expectedEarnings", { valueAsNumber: true })}
                          className="text-lg"
                          data-testid="input-expected-earnings"
                        />
                        {errors.expectedEarnings && (
                          <p className="text-sm text-destructive">
                            {errors.expectedEarnings.message}
                          </p>
                        )}
                      </div>
                      {incomeEstimate.data?.average && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Based on your last 3 months:
                          </p>
                          <p className="font-medium">
                            Average Income: {formatCurrency(incomeEstimate.data.average)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {billsEstimate.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="expectedBills" className="text-sm font-medium">
                          Bills & Utilities
                        </Label>
                        <Input
                          id="expectedBills"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("expectedBills", { valueAsNumber: true })}
                          className="text-lg"
                          data-testid="input-expected-bills"
                        />
                        {errors.expectedBills && (
                          <p className="text-sm text-destructive">
                            {errors.expectedBills.message}
                          </p>
                        )}
                      </div>
                      {billsEstimate.data?.average && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Based on your last 3 months:
                          </p>
                          <p className="font-medium">
                            Average Bills: {formatCurrency(billsEstimate.data.average)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="savingsRate" className="text-sm font-medium">
                      Savings Rate (%)
                    </Label>
                    <Input
                      id="savingsRate"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="15"
                      {...register("savingsRate", { valueAsNumber: true })}
                      className="text-lg"
                      data-testid="input-savings-rate"
                    />
                    {errors.savingsRate && (
                      <p className="text-sm text-destructive">
                        {errors.savingsRate.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                          Savings Reserve
                        </p>
                        <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                          {formatCurrency(savingsReserve)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                          Spending Budget
                        </p>
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {formatCurrency(spendingBudget)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">
                          After Bills
                        </p>
                        <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                          {formatCurrency(earnings - bills)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                  className="flex items-center gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="flex items-center gap-2"
                    data-testid="button-next"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-save"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Create Budget Plan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}