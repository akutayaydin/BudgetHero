import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function BudgetPlanPage() {
  const { data, isLoading } = useQuery<{ expectedEarnings: number; suggestedEarnings: number; month: string }>( {
    queryKey: ["/api/budget-plan"],
  });

  const [income, setIncome] = useState("");

  useEffect(() => {
    if (data) {
      setIncome(String(data.expectedEarnings || ""));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/budget-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedEarnings: income }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-plan"] });
    },
  });

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Budget Plan - Income</h1>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Monthly Income</span>
        <Input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
      </label>
      {data && (
        <p className="text-sm text-muted-foreground">
          Suggested income: {currency(data.suggestedEarnings)}
        </p>
      )}
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Save
      </Button>
    </div>
  );
}