import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertBudgetPlan, BudgetPlan } from "@shared/schema";

export function useBudgetPlan(month: string) {
  return useQuery({
    queryKey: ["/api/budget/plan", month],
    queryFn: async () => {
      const res = await fetch(`/api/budget/plan?month=${month}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as BudgetPlan;
    },
  });
}

export function useCreateBudgetPlan() {
  return useMutation({
    mutationFn: async (plan: InsertBudgetPlan) => {
      const res = await apiRequest("/api/budget/plan", "POST", plan);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/plan"] });
    },
  });
}

export function useUpdateBudgetPlan() {
  return useMutation({
    mutationFn: async (plan: Partial<InsertBudgetPlan> & { id: string }) => {
      const { id, ...data } = plan;
      const res = await apiRequest(`/api/budget/plan/${id}`, "PATCH", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/plan"] });
    },
  });
}
